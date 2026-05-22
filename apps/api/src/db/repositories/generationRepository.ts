/**
 * Generation batch + shot data access. The Studio infinite-canvas reads from
 * `shots`; the Temporal workflow writes status transitions here.
 */
import type {
  GenerationBatch,
  GenerationStatus,
  Shot,
  Look,
} from "@looma/shared";
import { query } from "../pool.js";
import { toIso } from "../util.js";

interface BatchRow {
  id: string;
  project_id: string;
  prompt: string;
  count: number;
  status: GenerationStatus;
  workflow_id: string | null;
  created_at: Date;
}

interface ShotRow {
  id: string;
  project_id: string;
  batch_id: string;
  look: Look;
  pose: string;
  status: GenerationStatus;
  x: number;
  y: number;
  width: number;
  image_url: string | null;
  seed: number | null;
  created_at: Date;
}

function toBatch(row: BatchRow): GenerationBatch {
  return {
    id: row.id,
    projectId: row.project_id,
    prompt: row.prompt,
    count: row.count,
    status: row.status,
    workflowId: row.workflow_id,
    createdAt: toIso(row.created_at),
  };
}

function toShot(row: ShotRow): Shot {
  return {
    id: row.id,
    projectId: row.project_id,
    batchId: row.batch_id,
    look: row.look,
    pose: row.pose,
    status: row.status,
    x: row.x,
    y: row.y,
    width: row.width,
    imageUrl: row.image_url,
    seed: row.seed,
    createdAt: toIso(row.created_at),
  };
}

export const generationRepository = {
  async insertBatch(b: {
    id: string;
    projectId: string;
    prompt: string;
    count: number;
  }): Promise<GenerationBatch> {
    const rows = await query<BatchRow>(
      `INSERT INTO generation_batches (id, project_id, prompt, count, status)
       VALUES ($1, $2, $3, $4, 'queued')
       RETURNING *`,
      [b.id, b.projectId, b.prompt, b.count],
    );
    return toBatch(rows[0]!);
  },

  async setBatchWorkflow(batchId: string, workflowId: string): Promise<void> {
    await query(`UPDATE generation_batches SET workflow_id = $2 WHERE id = $1`, [
      batchId,
      workflowId,
    ]);
  },

  async setBatchStatus(batchId: string, status: GenerationStatus): Promise<void> {
    await query(`UPDATE generation_batches SET status = $2 WHERE id = $1`, [
      batchId,
      status,
    ]);
  },

  async findBatch(id: string): Promise<GenerationBatch | null> {
    const rows = await query<BatchRow>(
      `SELECT * FROM generation_batches WHERE id = $1`,
      [id],
    );
    return rows[0] ? toBatch(rows[0]) : null;
  },

  async insertShot(s: {
    id: string;
    projectId: string;
    batchId: string;
    look: Look;
    pose: string;
    x: number;
    y: number;
    width: number;
  }): Promise<Shot> {
    const rows = await query<ShotRow>(
      `INSERT INTO shots (id, project_id, batch_id, look, pose, status, x, y, width)
       VALUES ($1, $2, $3, $4, $5, 'generating', $6, $7, $8)
       RETURNING *`,
      [s.id, s.projectId, s.batchId, s.look, s.pose, s.x, s.y, s.width],
    );
    return toShot(rows[0]!);
  },

  async completeShot(id: string, imageUrl: string, seed: number): Promise<void> {
    await query(
      `UPDATE shots SET status = 'succeeded', image_url = $2, seed = $3 WHERE id = $1`,
      [id, imageUrl, seed],
    );
  },

  async failShot(id: string): Promise<void> {
    await query(`UPDATE shots SET status = 'failed' WHERE id = $1`, [id]);
  },

  async listShotsByProject(projectId: string): Promise<Shot[]> {
    const rows = await query<ShotRow>(
      `SELECT * FROM shots WHERE project_id = $1 ORDER BY created_at ASC`,
      [projectId],
    );
    return rows.map(toShot);
  },
};
