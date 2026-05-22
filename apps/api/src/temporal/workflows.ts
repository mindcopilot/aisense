/**
 * Temporal workflows — deterministic orchestration of the photoshoot batch
 * and the marketing-automation pipeline.
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

// Campaign steps include LLM calls — allow a longer activity window.
const {
  openCampaign,
  markCampaignStatus,
  planCampaign,
  renderCampaignImages,
  renderCampaignVideo,
  writeCampaignArticle,
  finalizeCampaign,
  failCampaign,
} = proxyActivities<typeof activities>({
  startToCloseTimeout: "5 minutes",
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

export interface CampaignWorkflowInput {
  /** Provided for API-triggered runs; omitted for scheduled runs. */
  campaignId?: string;
  brief: string;
  /** Set when this run was triggered by a recurring schedule. */
  scheduleId?: string;
}

/**
 * The marketing pipeline: one sentence → plan → images + video + article.
 *
 * The three render steps run concurrently; a failure in any of them marks the
 * whole campaign failed (and, under Temporal, the activity is retried first).
 */
export async function marketingCampaignWorkflow(
  input: CampaignWorkflowInput,
): Promise<void> {
  const campaignId =
    input.campaignId ??
    (await openCampaign({ brief: input.brief, scheduleId: input.scheduleId ?? null }));

  try {
    await markCampaignStatus({ campaignId, status: "planning" });
    const plan = await planCampaign({ campaignId, brief: input.brief });

    await markCampaignStatus({ campaignId, status: "rendering" });
    const [imageUrls, video, article] = await Promise.all([
      renderCampaignImages({ campaignId, plan }),
      renderCampaignVideo({ plan }),
      writeCampaignArticle({ campaignId, plan }),
    ]);

    await finalizeCampaign({ campaignId, imageUrls, video, article });
  } catch (err) {
    await failCampaign({ campaignId, error: String(err) });
    throw err;
  }
}
