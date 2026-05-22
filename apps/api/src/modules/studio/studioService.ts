/**
 * Studio domain service — the conversational core of Looma.
 *
 * Coordinates: chat persistence ↔ the AI art director ↔ generation batches ↔
 * Temporal orchestration. Each collaborator is injected as a module so this
 * service stays a thin coordinator with no vendor knowledge of its own.
 */
import { nanoid } from "nanoid";
import type {
  ChatMessage,
  GenerationBatch,
  Look,
  SendMessageResponse,
} from "@looma/shared";
import { chatRepository } from "../../db/repositories/chatRepository.js";
import { generationRepository } from "../../db/repositories/generationRepository.js";
import { projectRepository } from "../../db/repositories/projectRepository.js";
import { directShoot } from "../../llm/artDirector.js";
import { startPhotoshoot } from "../../temporal/client.js";
import { renderShot } from "../../temporal/activities.js";
import { NotFoundError, ValidationError } from "../projects/projectService.js";

/** Grid layout for new shots on the infinite canvas. */
function layoutShots(existingCount: number, count: number) {
  const COLS = 4;
  const CARD_W = 240;
  const GAP_X = 20;
  const GAP_Y = 100;
  const baseRow = Math.floor(existingCount / COLS);
  return Array.from({ length: count }).map((_, i) => {
    const idx = existingCount + i;
    return {
      x: 60 + (idx % COLS) * (CARD_W + GAP_X),
      y: 40 + (baseRow + Math.floor(i / COLS)) * (320 + GAP_Y),
      width: CARD_W,
    };
  });
}

export const studioService = {
  getThread(projectId: string): Promise<ChatMessage[]> {
    return chatRepository.listByProject(projectId);
  },

  /**
   * Handle one user turn: persist it, run the art director, persist the
   * reply, and — if the director decided to generate — open a batch and
   * orchestrate it through Temporal.
   */
  async sendMessage(projectId: string, text: string): Promise<SendMessageResponse> {
    const trimmed = text.trim();
    if (!trimmed) throw new ValidationError("消息不能为空");

    const project = await projectRepository.findById(projectId);
    if (!project) throw new NotFoundError("项目不存在");

    const userMessage = await chatRepository.insert({
      id: `msg-${nanoid(10)}`,
      projectId,
      role: "user",
      text: trimmed,
    });

    const history = await chatRepository.listByProject(projectId);
    const direction = await directShoot(projectId, history);

    let batch: GenerationBatch | null = null;
    if (direction.intent === "generate" && direction.generation) {
      batch = await this.openBatch(projectId, trimmed, direction.generation);
    }

    const aiMessage = await chatRepository.insert({
      id: `msg-${nanoid(10)}`,
      projectId,
      role: "ai",
      text: direction.reply,
      proposals: direction.proposals?.map((p) => ({ id: `p-${nanoid(6)}`, ...p })),
      batchId: batch?.id,
    });

    await projectRepository.touch(projectId);
    return { userMessage, aiMessage, batch };
  },

  /** Create a generation batch + its shots and dispatch the workflow. */
  async openBatch(
    projectId: string,
    prompt: string,
    plan: { count: number; pose: string; looks: Look[] },
  ): Promise<GenerationBatch> {
    const batch = await generationRepository.insertBatch({
      id: `batch-${nanoid(8)}`,
      projectId,
      prompt,
      count: plan.count,
    });

    const existing = await generationRepository.listShotsByProject(projectId);
    const layout = layoutShots(existing.length, plan.count);

    const shots = await Promise.all(
      Array.from({ length: plan.count }).map((_, i) => {
        const look = plan.looks[i % plan.looks.length]!;
        const place = layout[i]!;
        return generationRepository.insertShot({
          id: `shot-${nanoid(10)}`,
          projectId,
          batchId: batch.id,
          look,
          pose: plan.pose,
          x: place.x,
          y: place.y,
          width: place.width,
        });
      }),
    );

    await projectRepository.updateStatus(projectId, "generating");

    const workflowId = await startPhotoshoot({
      batchId: batch.id,
      projectId,
      shots: shots.map((s) => ({ shotId: s.id, look: s.look, pose: s.pose })),
    });

    if (workflowId) {
      await generationRepository.setBatchWorkflow(batch.id, workflowId);
      return { ...batch, workflowId };
    }

    // Temporal unavailable — render inline so the demo still completes.
    void renderInline(batch.id, projectId, shots);
    return batch;
  },
};

async function renderInline(
  batchId: string,
  projectId: string,
  shots: { id: string; look: Look; pose: string }[],
): Promise<void> {
  await generationRepository.setBatchStatus(batchId, "generating");
  for (const shot of shots) {
    try {
      await renderShot({ shotId: shot.id, look: shot.look, pose: shot.pose });
    } catch {
      await generationRepository.failShot(shot.id);
    }
  }
  await generationRepository.setBatchStatus(batchId, "succeeded");
  await projectRepository.updateStatus(projectId, "ready");
}
