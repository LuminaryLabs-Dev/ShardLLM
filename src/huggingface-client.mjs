const HUGGING_FACE = "https://huggingface.co";

function modelPath(modelId) {
  const parts = modelId.split("/");
  if (parts.length !== 2 || parts.some((part) => !part)) {
    throw new Error("Model id must use owner/model form.");
  }

  return parts.map(encodeURIComponent).join("/");
}

async function fetchJson(url) {
  const response = await fetch(url, {
    headers: { Accept: "application/json" }
  });

  if (!response.ok) {
    throw new Error(`Metadata request failed (${response.status}) for ${url}`);
  }

  const body = Buffer.from(await response.arrayBuffer());
  return {
    bytes: body.byteLength,
    contentType: response.headers.get("content-type"),
    etag: response.headers.get("etag"),
    json: JSON.parse(body.toString("utf8"))
  };
}

export async function inspectHuggingFaceModel(modelId) {
  const path = modelPath(modelId);
  const apiUrl = `${HUGGING_FACE}/api/models/${path}`;
  const api = await fetchJson(apiUrl);
  const revision = api.json.sha ?? "main";
  const configUrl = `${HUGGING_FACE}/${path}/resolve/${revision}/config.json`;
  const indexUrl = `${HUGGING_FACE}/${path}/resolve/${revision}/model.safetensors.index.json`;
  const config = await fetchJson(configUrl);
  const index = await fetchJson(indexUrl);

  return {
    apiUrl,
    api,
    configUrl,
    config,
    indexUrl,
    index,
    revision
  };
}
