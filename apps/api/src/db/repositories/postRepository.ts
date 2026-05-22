/**
 * 小红书 post data access (生文 module). Pure persistence.
 */
import type {
  AiAngle,
  PostTone,
  PostVertical,
  XhsPost,
  XhsValidation,
} from "@looma/shared";
import { query } from "../pool.js";
import { toIso } from "../util.js";

interface PostRow {
  id: string;
  project_id: string;
  brief: string;
  vertical: PostVertical;
  angle: AiAngle | null;
  tone: PostTone;
  title: string;
  body: string;
  tags: string[];
  cover_tip: string;
  validation: XhsValidation;
  created_at: Date;
}

function toPost(row: PostRow): XhsPost {
  return {
    id: row.id,
    projectId: row.project_id,
    brief: row.brief,
    vertical: row.vertical,
    angle: row.angle,
    tone: row.tone,
    title: row.title,
    body: row.body,
    tags: row.tags,
    coverTip: row.cover_tip,
    validation: row.validation,
    createdAt: toIso(row.created_at),
  };
}

export const postRepository = {
  async insert(p: {
    id: string;
    projectId: string;
    brief: string;
    vertical: PostVertical;
    angle: AiAngle | null;
    tone: PostTone;
    title: string;
    body: string;
    tags: string[];
    coverTip: string;
    validation: XhsValidation;
  }): Promise<XhsPost> {
    const rows = await query<PostRow>(
      `INSERT INTO xhs_posts
         (id, project_id, brief, vertical, angle, tone,
          title, body, tags, cover_tip, validation)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb, $10, $11::jsonb)
       RETURNING *`,
      [
        p.id,
        p.projectId,
        p.brief,
        p.vertical,
        p.angle,
        p.tone,
        p.title,
        p.body,
        JSON.stringify(p.tags),
        p.coverTip,
        JSON.stringify(p.validation),
      ],
    );
    return toPost(rows[0]!);
  },

  async listByProject(projectId: string): Promise<XhsPost[]> {
    const rows = await query<PostRow>(
      `SELECT * FROM xhs_posts WHERE project_id = $1 ORDER BY created_at DESC`,
      [projectId],
    );
    return rows.map(toPost);
  },
};
