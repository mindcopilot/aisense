/**
 * Chat message data access for the Studio conversation thread.
 */
import type { ChatMessage, ChatRole, DirectionProposal } from "@looma/shared";
import { query } from "../pool.js";

interface ChatRow {
  id: string;
  project_id: string;
  role: ChatRole;
  text: string;
  proposals: DirectionProposal[] | null;
  batch_id: string | null;
  created_at: Date;
}

function toMessage(row: ChatRow): ChatMessage {
  const message: ChatMessage = {
    id: row.id,
    projectId: row.project_id,
    role: row.role,
    text: row.text,
    createdAt: row.created_at.toISOString(),
  };
  if (row.proposals) message.proposals = row.proposals;
  if (row.batch_id) message.batchId = row.batch_id;
  return message;
}

export const chatRepository = {
  async listByProject(projectId: string): Promise<ChatMessage[]> {
    const rows = await query<ChatRow>(
      `SELECT * FROM chat_messages WHERE project_id = $1 ORDER BY created_at ASC`,
      [projectId],
    );
    return rows.map(toMessage);
  },

  async insert(m: {
    id: string;
    projectId: string;
    role: ChatRole;
    text: string;
    proposals?: DirectionProposal[];
    batchId?: string;
  }): Promise<ChatMessage> {
    const rows = await query<ChatRow>(
      `INSERT INTO chat_messages (id, project_id, role, text, proposals, batch_id)
       VALUES ($1, $2, $3, $4, $5::jsonb, $6)
       RETURNING *`,
      [
        m.id,
        m.projectId,
        m.role,
        m.text,
        m.proposals ? JSON.stringify(m.proposals) : null,
        m.batchId ?? null,
      ],
    );
    return toMessage(rows[0]!);
  },
};
