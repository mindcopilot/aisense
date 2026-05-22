/**
 * Marketing domain service — the one-sentence → 图/视频/文章 pipeline.
 *
 * Coordinates: the campaign pipeline steps ↔ Temporal orchestration ↔
 * recurring schedules. When Temporal is available it runs the durable
 * workflow; otherwise it runs the pipeline inline and drives schedules with an
 * in-process timer — so marketing automation works with or without infra.
 */
import { nanoid } from "nanoid";
import type { Campaign, CampaignSchedule } from "@looma/shared";
import { campaignRepository } from "../../db/repositories/campaignRepository.js";
import {
  startCampaign,
  createCampaignSchedule,
  deleteCampaignSchedule,
} from "../../temporal/client.js";
import * as steps from "../../temporal/campaignActivities.js";
import { startLocalSchedule, stopLocalSchedule } from "./localScheduler.js";
import { NotFoundError, ValidationError } from "../projects/projectService.js";

/** Run the full pipeline in-process — the fallback when Temporal is absent. */
async function runInline(campaignId: string, brief: string): Promise<void> {
  try {
    await steps.markCampaignStatus({ campaignId, status: "planning" });
    const plan = await steps.planCampaign({ campaignId, brief });

    await steps.markCampaignStatus({ campaignId, status: "rendering" });
    const [imageUrls, video, article] = await Promise.all([
      steps.renderCampaignImages({ campaignId, plan }),
      steps.renderCampaignVideo({ plan }),
      steps.writeCampaignArticle({ campaignId, plan }),
    ]);

    await steps.finalizeCampaign({ campaignId, imageUrls, video, article });
  } catch (err) {
    await steps.failCampaign({ campaignId, error: String(err) });
  }
}

export const marketingService = {
  listCampaigns(): Promise<Campaign[]> {
    return campaignRepository.listCampaigns();
  },

  async getCampaign(id: string): Promise<Campaign> {
    const campaign = await campaignRepository.findCampaign(id);
    if (!campaign) throw new NotFoundError("营销任务不存在");
    return campaign;
  },

  listSchedules(): Promise<CampaignSchedule[]> {
    return campaignRepository.listSchedules();
  },

  /**
   * Run the pipeline once for a one-sentence brief. Dispatches to Temporal
   * when available, otherwise runs inline.
   */
  async runCampaign(brief: string, scheduleId: string | null = null): Promise<Campaign> {
    const trimmed = brief.trim();
    if (!trimmed) throw new ValidationError("请输入一句话宣传需求");

    const campaign = await campaignRepository.insertCampaign({
      id: `camp-${nanoid(10)}`,
      brief: trimmed,
      scheduleId,
    });

    const workflowId = await startCampaign({ campaignId: campaign.id, brief: trimmed });
    if (workflowId) {
      await campaignRepository.setWorkflowId(campaign.id, workflowId);
      return { ...campaign, workflowId };
    }

    // Temporal unavailable — run the pipeline inline.
    void runInline(campaign.id, trimmed);
    return campaign;
  },

  /** Create a recurring trigger that runs the pipeline every N minutes. */
  async createSchedule(brief: string, intervalMinutes: number): Promise<CampaignSchedule> {
    const trimmed = brief.trim();
    if (!trimmed) throw new ValidationError("请输入一句话宣传需求");
    if (!Number.isFinite(intervalMinutes) || intervalMinutes < 1) {
      throw new ValidationError("触发间隔至少 1 分钟");
    }

    const id = `sched-${nanoid(8)}`;
    const onTemporal = await createCampaignSchedule({
      scheduleId: id,
      brief: trimmed,
      intervalMinutes,
    });

    const schedule = await campaignRepository.insertSchedule({
      id,
      brief: trimmed,
      intervalMinutes,
      mode: onTemporal ? "temporal" : "in-process",
    });

    if (!onTemporal) {
      startLocalSchedule(id, intervalMinutes, () => {
        void marketingService.runCampaign(trimmed, id);
      });
    }
    return schedule;
  },

  async cancelSchedule(id: string): Promise<void> {
    const schedule = await campaignRepository.findSchedule(id);
    if (!schedule) throw new NotFoundError("定时任务不存在");

    if (schedule.mode === "temporal") {
      await deleteCampaignSchedule(id);
    } else {
      stopLocalSchedule(id);
    }
    await campaignRepository.setScheduleActive(id, false);
  },

  /** Re-arm in-process schedules after an API restart. */
  async resumeSchedules(): Promise<void> {
    const active = await campaignRepository.listActiveSchedules();
    for (const schedule of active) {
      if (schedule.mode !== "in-process") continue;
      startLocalSchedule(schedule.id, schedule.intervalMinutes, () => {
        void marketingService.runCampaign(schedule.brief, schedule.id);
      });
    }
  },
};
