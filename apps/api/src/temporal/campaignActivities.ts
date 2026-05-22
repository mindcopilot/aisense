/**
 * Campaign activities — the side-effecting steps of the marketing pipeline.
 *
 * Each function is a Temporal activity (durable + retryable). The marketing
 * service also calls them directly for the inline fallback when Temporal is
 * unavailable, so the pipeline logic lives here exactly once.
 */
import { nanoid } from "nanoid";
import type {
  CampaignArticle,
  CampaignPlan,
  CampaignStatus,
  CampaignVideo,
} from "@looma/shared";
import { campaignRepository } from "../db/repositories/campaignRepository.js";
import { planCampaignBrief } from "../llm/campaignPlanner.js";
import { writePost } from "../llm/copywriter.js";
import { validateXhsPost } from "../content/xiaohongshu.js";
import { models } from "../llm/models.js";

/** Create the campaign row. Used when a schedule triggers a fresh run. */
export async function openCampaign(input: {
  brief: string;
  scheduleId: string | null;
}): Promise<string> {
  const campaign = await campaignRepository.insertCampaign({
    id: `camp-${nanoid(10)}`,
    brief: input.brief,
    scheduleId: input.scheduleId,
  });
  return campaign.id;
}

export async function markCampaignStatus(input: {
  campaignId: string;
  status: CampaignStatus;
}): Promise<void> {
  await campaignRepository.setStatus(input.campaignId, input.status);
}

/** Step 1 — expand the one-sentence brief into a structured plan. */
export async function planCampaign(input: {
  campaignId: string;
  brief: string;
}): Promise<CampaignPlan> {
  const plan = await planCampaignBrief(input.campaignId, input.brief);
  await campaignRepository.setPlan(input.campaignId, plan);
  return plan;
}

/** Step 2a — render the promotional images. */
export async function renderCampaignImages(input: {
  campaignId: string;
  plan: CampaignPlan;
}): Promise<string[]> {
  const urls: string[] = [];
  for (const [i, shot] of input.plan.imageShots.entries()) {
    await new Promise((r) => setTimeout(r, 600));
    const seed = Math.floor(Math.random() * 99999);
    urls.push(
      `looma://campaigns/${input.campaignId}/img-${i + 1}` +
        `?model=${models.imageModelId}&look=${shot.look}&seed=${seed}`,
    );
  }
  return urls;
}

/** Step 2b — render the promotional video from the storyboard. */
export async function renderCampaignVideo(input: {
  plan: CampaignPlan;
}): Promise<CampaignVideo> {
  await new Promise((r) => setTimeout(r, 900));
  const per = Math.round((14 / input.plan.videoClips.length) * 10) / 10;
  const clips = input.plan.videoClips.map((c) => ({
    label: c.label,
    motion: c.motion,
    durationSec: per,
  }));
  return {
    url: `looma://campaigns/video-${nanoid(8)}.mp4`,
    durationSec: clips.reduce((s, c) => s + c.durationSec, 0),
    clips,
  };
}

/** Step 2c — write the companion article (生文 module). */
export async function writeCampaignArticle(input: {
  campaignId: string;
  plan: CampaignPlan;
}): Promise<CampaignArticle> {
  const spec = input.plan.article;
  const draft = await writePost(input.campaignId, spec.brief, {
    vertical: spec.vertical,
    angle: spec.angle,
    tone: spec.tone,
  });
  return {
    title: draft.title,
    body: draft.body,
    tags: draft.tags,
    coverTip: draft.coverTip,
    validation: validateXhsPost(draft),
  };
}

/** Step 3 — persist every produced asset and mark the run succeeded. */
export async function finalizeCampaign(input: {
  campaignId: string;
  imageUrls: string[];
  video: CampaignVideo;
  article: CampaignArticle;
}): Promise<void> {
  await campaignRepository.finalize(input.campaignId, {
    imageUrls: input.imageUrls,
    video: input.video,
    article: input.article,
  });
}

export async function failCampaign(input: {
  campaignId: string;
  error: string;
}): Promise<void> {
  await campaignRepository.fail(input.campaignId, input.error);
}
