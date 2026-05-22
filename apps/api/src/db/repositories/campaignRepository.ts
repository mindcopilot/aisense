/**
 * Campaign + schedule data access for the marketing-automation module.
 */
import type {
  Campaign,
  CampaignArticle,
  CampaignPlan,
  CampaignSchedule,
  CampaignStatus,
  CampaignVideo,
  ScheduleMode,
} from "@looma/shared";
import { query } from "../pool.js";
import { toIso } from "../util.js";

interface CampaignRow {
  id: string;
  brief: string;
  status: CampaignStatus;
  schedule_id: string | null;
  workflow_id: string | null;
  plan: CampaignPlan | null;
  image_urls: string[];
  video: CampaignVideo | null;
  article: CampaignArticle | null;
  error: string | null;
  created_at: Date;
  completed_at: Date | null;
}

interface ScheduleRow {
  id: string;
  brief: string;
  interval_minutes: number;
  mode: ScheduleMode;
  active: boolean;
  created_at: Date;
}

function toCampaign(row: CampaignRow): Campaign {
  return {
    id: row.id,
    brief: row.brief,
    status: row.status,
    scheduleId: row.schedule_id,
    workflowId: row.workflow_id,
    plan: row.plan,
    imageUrls: row.image_urls,
    video: row.video,
    article: row.article,
    error: row.error,
    createdAt: toIso(row.created_at),
    completedAt: row.completed_at ? toIso(row.completed_at) : null,
  };
}

function toSchedule(row: ScheduleRow): CampaignSchedule {
  return {
    id: row.id,
    brief: row.brief,
    intervalMinutes: row.interval_minutes,
    mode: row.mode,
    active: row.active,
    createdAt: toIso(row.created_at),
  };
}

export const campaignRepository = {
  // ----- campaigns -----

  async insertCampaign(c: {
    id: string;
    brief: string;
    scheduleId: string | null;
  }): Promise<Campaign> {
    const rows = await query<CampaignRow>(
      `INSERT INTO campaigns (id, brief, status, schedule_id)
       VALUES ($1, $2, 'queued', $3)
       RETURNING *`,
      [c.id, c.brief, c.scheduleId],
    );
    return toCampaign(rows[0]!);
  },

  async setStatus(id: string, status: CampaignStatus): Promise<void> {
    await query(`UPDATE campaigns SET status = $2 WHERE id = $1`, [id, status]);
  },

  async setWorkflowId(id: string, workflowId: string): Promise<void> {
    await query(`UPDATE campaigns SET workflow_id = $2 WHERE id = $1`, [id, workflowId]);
  },

  async setPlan(id: string, plan: CampaignPlan): Promise<void> {
    await query(`UPDATE campaigns SET plan = $2::jsonb WHERE id = $1`, [
      id,
      JSON.stringify(plan),
    ]);
  },

  async finalize(id: string, assets: {
    imageUrls: string[];
    video: CampaignVideo;
    article: CampaignArticle;
  }): Promise<void> {
    await query(
      `UPDATE campaigns
         SET status = 'succeeded', image_urls = $2::jsonb,
             video = $3::jsonb, article = $4::jsonb, completed_at = now()
       WHERE id = $1`,
      [
        id,
        JSON.stringify(assets.imageUrls),
        JSON.stringify(assets.video),
        JSON.stringify(assets.article),
      ],
    );
  },

  async fail(id: string, error: string): Promise<void> {
    await query(
      `UPDATE campaigns SET status = 'failed', error = $2, completed_at = now()
       WHERE id = $1`,
      [id, error],
    );
  },

  async findCampaign(id: string): Promise<Campaign | null> {
    const rows = await query<CampaignRow>(`SELECT * FROM campaigns WHERE id = $1`, [id]);
    return rows[0] ? toCampaign(rows[0]) : null;
  },

  async listCampaigns(limit = 30): Promise<Campaign[]> {
    const rows = await query<CampaignRow>(
      `SELECT * FROM campaigns ORDER BY created_at DESC LIMIT $1`,
      [limit],
    );
    return rows.map(toCampaign);
  },

  // ----- schedules -----

  async insertSchedule(s: {
    id: string;
    brief: string;
    intervalMinutes: number;
    mode: ScheduleMode;
  }): Promise<CampaignSchedule> {
    const rows = await query<ScheduleRow>(
      `INSERT INTO campaign_schedules (id, brief, interval_minutes, mode)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [s.id, s.brief, s.intervalMinutes, s.mode],
    );
    return toSchedule(rows[0]!);
  },

  async listSchedules(): Promise<CampaignSchedule[]> {
    const rows = await query<ScheduleRow>(
      `SELECT * FROM campaign_schedules ORDER BY created_at DESC`,
    );
    return rows.map(toSchedule);
  },

  async listActiveSchedules(): Promise<CampaignSchedule[]> {
    const rows = await query<ScheduleRow>(
      `SELECT * FROM campaign_schedules WHERE active = true`,
    );
    return rows.map(toSchedule);
  },

  async setScheduleActive(id: string, active: boolean): Promise<void> {
    await query(`UPDATE campaign_schedules SET active = $2 WHERE id = $1`, [id, active]);
  },

  async findSchedule(id: string): Promise<CampaignSchedule | null> {
    const rows = await query<ScheduleRow>(
      `SELECT * FROM campaign_schedules WHERE id = $1`,
      [id],
    );
    return rows[0] ? toSchedule(rows[0]) : null;
  },
};
