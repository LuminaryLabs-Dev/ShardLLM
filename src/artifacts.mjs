import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

function safeSourceId(modelId) {
  return modelId.replace(/[^a-zA-Z0-9._-]+/g, "--");
}

function runId() {
  return new Date().toISOString().replace(/[:.]/g, "-");
}

async function writeJson(directory, filename, value) {
  await writeFile(join(directory, filename), `${JSON.stringify(value, null, 2)}\n`);
}

export async function writeArtifacts({ outputRoot, modelId, manifest, tensorIndex, budget, cachePlan, executionPlan, runConfig, proofEvents, report }) {
  const directory = join(outputRoot, "models", safeSourceId(modelId), "runs", runId());
  await mkdir(join(directory, "checkpoints"), { recursive: true });
  await writeJson(directory, "manifest.json", manifest);
  await writeJson(directory, "tensor-index.json", tensorIndex);
  await writeJson(directory, "budget.json", budget);
  await writeJson(directory, "cache-plan.json", cachePlan);
  await writeJson(directory, "execution-plan.json", executionPlan);
  await writeJson(directory, "run-config.json", runConfig);
  await writeFile(join(directory, "proof.jsonl"), `${proofEvents.map((event) => JSON.stringify(event)).join("\n")}\n`);
  await writeJson(directory, "report.json", report);
  return directory;
}
