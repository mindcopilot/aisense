/**
 * Temporal workflows — deterministic orchestration of a photoshoot batch.
 *
 * This file runs inside the Temporal workflow sandbox: it must stay
 * deterministic and may only reach the outside world through activity proxies.
 */
import { proxyActivities } from "@temporalio/workflow";
import type * as activities from "./activities.js";
import type { Look } from "@looma/shared";

const { renderShot, markBatchGenerating, finishBatch, failShot } =
  proxyActivities<typeof activities>({
    startToCloseTimeout: "2 minutes",
    retry: { maximumAttempts: 3 },
  });

export interface PhotoshootInput {
  batchId: string;
  projectId: string;
  shots: { shotId: string; look: Look; pose: string }[];
}

/**
 * Generates every shot in a batch, tolerating individual shot failures.
 * The batch succeeds if at least one shot rendered.
 */
export async function photoshootWorkflow(input: PhotoshootInput): Promise<void> {
  await markBatchGenerating(input.batchId);

  const results = await Promise.allSettled(
    input.shots.map((s) =>
      renderShot({ shotId: s.shotId, look: s.look, pose: s.pose }),
    ),
  );

  let anyFailed = false;
  let allFailed = true;
  for (let i = 0; i < results.length; i++) {
    const result = results[i]!;
    if (result.status === "fulfilled") {
      allFailed = false;
    } else {
      anyFailed = true;
      await failShot(input.shots[i]!.shotId);
    }
  }

  await finishBatch({
    batchId: input.batchId,
    projectId: input.projectId,
    failed: allFailed,
  });

  void anyFailed; // partial failure is acceptable; surfaced via shot status
}
