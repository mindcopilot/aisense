/**
 * Temporal activities — the side-effecting steps of a photoshoot.
 *
 * Activities may touch the database, call image models, etc. They are the only
 * place in the workflow layer allowed to do non-deterministic work.
 */
import { generationRepository } from "../db/repositories/generationRepository.js";
import { projectRepository } from "../db/repositories/projectRepository.js";
import { models } from "../llm/models.js";
import type { Look } from "@looma/shared";

/**
 * Render a single shot. In production this would call an image model; here it
 * simulates latency and yields a deterministic placeholder URL + seed.
 */
export async function renderShot(input: {
  shotId: string;
  look: Look;
  pose: string;
}): Promise<{ imageUrl: string; seed: number }> {
  await new Promise((r) => setTimeout(r, 1500));
  const seed = Math.floor(Math.random() * 99999);
  const imageUrl =
    `looma://shots/${input.shotId}` +
    `?model=${models.imageModelId}&look=${input.look}&seed=${seed}`;
  await generationRepository.completeShot(input.shotId, imageUrl, seed);
  return { imageUrl, seed };
}

export async function markBatchGenerating(batchId: string): Promise<void> {
  await generationRepository.setBatchStatus(batchId, "generating");
}

export async function finishBatch(input: {
  batchId: string;
  projectId: string;
  failed: boolean;
}): Promise<void> {
  await generationRepository.setBatchStatus(
    input.batchId,
    input.failed ? "failed" : "succeeded",
  );
  await projectRepository.updateStatus(
    input.projectId,
    input.failed ? "ready" : "ready",
  );
}

export async function failShot(shotId: string): Promise<void> {
  await generationRepository.failShot(shotId);
}
