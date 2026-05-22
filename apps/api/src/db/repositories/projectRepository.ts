/**
 * Project data access. Pure persistence — no business rules here.
 */
import type { Project, ProjectStatus, Look } from "@looma/shared";
import { query } from "../pool.js";
import { toIso } from "../util.js";

interface ProjectRow {
  id: string;
  title: string;
  subtitle: string;
  note: string;
  status: ProjectStatus;
  looks: Look[];
  created_at: Date;
  updated_at: Date;
}

function toProject(row: ProjectRow): Project {
  return {
    id: row.id,
    title: row.title,
    subtitle: row.subtitle,
    note: row.note,
    status: row.status,
    looks: row.looks,
    createdAt: toIso(row.created_at),
    updatedAt: toIso(row.updated_at),
  };
}

export const projectRepository = {
  async list(): Promise<Project[]> {
    const rows = await query<ProjectRow>(
      `SELECT * FROM projects WHERE status <> 'archived' ORDER BY updated_at DESC`,
    );
    return rows.map(toProject);
  },

  async findById(id: string): Promise<Project | null> {
    const rows = await query<ProjectRow>(`SELECT * FROM projects WHERE id = $1`, [id]);
    return rows[0] ? toProject(rows[0]) : null;
  },

  async insert(p: {
    id: string;
    title: string;
    subtitle: string;
    note: string;
    status: ProjectStatus;
    looks: Look[];
  }): Promise<Project> {
    const rows = await query<ProjectRow>(
      `INSERT INTO projects (id, title, subtitle, note, status, looks)
       VALUES ($1, $2, $3, $4, $5, $6::jsonb)
       RETURNING *`,
      [p.id, p.title, p.subtitle, p.note, p.status, JSON.stringify(p.looks)],
    );
    return toProject(rows[0]!);
  },

  async updateStatus(id: string, status: ProjectStatus): Promise<void> {
    await query(
      `UPDATE projects SET status = $2, updated_at = now() WHERE id = $1`,
      [id, status],
    );
  },

  async touch(id: string): Promise<void> {
    await query(`UPDATE projects SET updated_at = now() WHERE id = $1`, [id]);
  },
};
