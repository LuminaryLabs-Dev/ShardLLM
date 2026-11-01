// Metadata-only safetensors inspection. Weight payloads are NEVER requested.
const MAX_HEADER_BYTES = 64 * 1024 * 1024;
const HEADER_CHUNK_BYTES = 1024 * 1024;

function safeInt(value, label) {
  if (!Number.isSafeInteger(value) || value < 0) throw new Error(`${label} is not a safe nonnegative integer`);
  return value;
}

function safeShardPath(value) {
  if (typeof value !== "string" || !value || value.startsWith("/") || value.split("/").some((part) => !part || part === "." || part === "..")) {
    throw new Error("Invalid shard path in upstream weight map");
  }
  if (!value.endsWith(".safetensors")) throw new Error("Shard must be a .safetensors file");
  return value.split("/").map(encodeURIComponent).join("/");
}

async function fetchExactRange(url, start, end, fetchImpl, requestLog) {
  safeInt(start, "Range start");
  safeInt(end, "Range end");
  if (end < start || end - start + 1 > HEADER_CHUNK_BYTES) throw new Error("Invalid range size");
  const expected = end - start + 1;
  const response = await fetchImpl(url, {
    headers: { Range: `bytes=${start}-${end}`, "Accept-Encoding": "identity" }
  });
  // Critically, refuse a 200 response BEFORE consuming its potentially massive body.
  if (response.status !== 206) {
    await response.body?.cancel().catch(() => {});
    throw new Error(`Range unsupported or denied: HTTP ${response.status}`);
  }
  const range = /^bytes (\d+)-(\d+)\/(\d+)$/.exec(response.headers.get("content-range") ?? "");
  if (!range || Number(range[1]) !== start || Number(range[2]) !== end) {
    await response.body?.cancel().catch(() => {});
    throw new Error("Invalid Content-Range in shard response");
  }
  const totalBytes = safeInt(Number(range[3]), "Shard total size");
  if (totalBytes <= end) throw new Error("Shard length contradicts Content-Range");
  const declared = response.headers.get("content-length");
  if (declared !== null && Number(declared) !== expected) {
    await response.body?.cancel().catch(() => {});
    throw new Error("Range response length mismatch");
  }
  const chunks = [];
  let length = 0;
  if (!response.body) throw new Error("Missing ranged response body");
  const reader = response.body.getReader();
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      length += value.byteLength;
      if (length > expected) throw new Error("Range response exceeds requested bytes");
      chunks.push(value);
    }
  } catch (error) {
    await reader.cancel().catch(() => {});
    throw error;
  }
  if (length !== expected) throw new Error("Range response truncated");
  const buffer = Buffer.concat(chunks.map((chunk) => Buffer.from(chunk)), length);
  requestLog.push({ start, end, bytes: length, etag: response.headers.get("etag") });
  return { buffer, totalBytes };
}

async function readShardHeader({ modelId, revision, shard, fetchImpl, requests }) {
  const [owner, model] = modelId.split("/");
  if (!owner || !model || modelId.split("/").length !== 2) throw new Error("Model id must use owner/model form");
  const url = `https://huggingface.co/${encodeURIComponent(owner)}/${encodeURIComponent(model)}/resolve/${encodeURIComponent(revision)}/${safeShardPath(shard)}`;
  const prefix = await fetchExactRange(url, 0, 7, fetchImpl, requests);
  const headerLengthBig = prefix.buffer.readBigUInt64LE(0);
  if (headerLengthBig < 2n || headerLengthBig > BigInt(MAX_HEADER_BYTES)) throw new Error("Safetensors header exceeds permitted size or is invalid");
  const headerLength = Number(headerLengthBig);
  const dataStart = safeInt(8 + headerLength, "Header end");
  if (dataStart > prefix.totalBytes) throw new Error("Header exceeds shard file length");
  const pieces = [];
  for (let offset = 8; offset < dataStart; offset += HEADER_CHUNK_BYTES) {
    const part = await fetchExactRange(url, offset, Math.min(offset + HEADER_CHUNK_BYTES, dataStart) - 1, fetchImpl, requests);
    if (part.totalBytes !== prefix.totalBytes) throw new Error("Shard file size changed between requests");
    // Multiple ETags, when supplied, must agree to prevent mixed-revision reads.
    const etags = requests.map((request) => request.etag).filter(Boolean);
    if (new Set(etags).size > 1) throw new Error("Shard ETag changed between range requests");
    pieces.push(part.buffer);
  }
  const header = JSON.parse(Buffer.concat(pieces, headerLength).toString("utf8"));
  if (!header || typeof header !== "object" || Array.isArray(header)) throw new Error("Invalid safetensors header JSON");
  const records = {};
  const intervals = [];
  for (const [name, info] of Object.entries(header)) {
    if (name === "__metadata__") continue;
    if (!info || typeof info !== "object" || typeof info.dtype !== "string" || !Array.isArray(info.shape) || !Array.isArray(info.data_offsets) || info.data_offsets.length !== 2) {
      throw new Error("Malformed safetensors tensor entry");
    }
    const [start, end] = info.data_offsets;
    safeInt(start, "Tensor offset start");
    safeInt(end, "Tensor offset end");
    if (end < start || !Number.isSafeInteger(dataStart + end) || dataStart + end > prefix.totalBytes) throw new Error("Tensor range exceeds shard payload");
    if (!info.shape.every((value) => Number.isSafeInteger(value) && value >= 0)) throw new Error("Invalid tensor shape");
    records[name] = {
      dtype: info.dtype, shape: info.shape,
      byte_length: end - start,
      byte_range: [dataStart + start, dataStart + end], // half-open absolute HTTP byte offsets
      source_shard: shard
    };
    intervals.push([start, end]);
  }
  intervals.sort((a, b) => a[0] - b[0]);
  let lastEnd = 0;
  let gapBytes = 0;
  for (const [start, end] of intervals) {
    if (start < lastEnd) throw new Error("Overlapping tensor payload ranges");
    gapBytes += start - lastEnd;
    lastEnd = end;
  }
  const trailingBytes = prefix.totalBytes - dataStart - lastEnd;
  const sumBytes = Object.values(records).reduce((sum, tensor) => sum + tensor.byte_length, 0);
  if (!Number.isSafeInteger(sumBytes)) throw new Error("Tensor sum exceeds safe integer precision");
  return { shard, records, tensor_count: intervals.length, tensor_bytes: sumBytes,
    header_bytes: dataStart, file_bytes: prefix.totalBytes, gap_bytes: gapBytes,
    trailing_bytes: trailingBytes, metadata_request_bytes: requests.reduce((total, request) => total + request.bytes, 0),
    requests: requests.map((request) => ({ ...request, url })) };
}

export async function inspectSafetensorsHeaders({ modelId, revision, shards, fetchImpl = fetch, concurrency = 3 }) {
  if (!Number.isInteger(concurrency) || concurrency < 1 || concurrency > 8) throw new Error("Header concurrency must be 1..8");
  const results = new Array(shards.length);
  let next = 0;
  const workers = Array.from({ length: Math.min(concurrency, shards.length) }, async () => {
    while (next < shards.length) {
      const index = next++;
      const requests = [];
      try {
        results[index] = { status: "ok", result: await readShardHeader({ modelId, revision, shard: shards[index], fetchImpl, requests }) };
      } catch (error) {
        results[index] = { status: "error", shard: shards[index], reason: error.message,
          metadata_request_bytes: requests.reduce((total, request) => total + request.bytes, 0),
          requests };
      }
    }
  });
  await Promise.all(workers);
  return {
    inspected_shards: results.filter((r) => r.status === "ok").map((r) => r.result),
    failures: results.filter((r) => r.status === "error"),
    metadata_request_bytes: results.reduce((n, r) => n + (r.result?.metadata_request_bytes ?? r.metadata_request_bytes ?? 0), 0),
    weight_payload_bytes_downloaded: 0,
    full_weight_shards_downloaded: 0
  };
}
