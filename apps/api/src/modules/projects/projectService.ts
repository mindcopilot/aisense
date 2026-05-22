/**
 * Project domain service — business rules for the project list and detail.
 * Depends only on repositories, never on HTTP or Temporal.
 */
import { nanoid } from "nanoid";
import type { Project, Shot, ChatMessage, CreateProjectRequest } from "@looma/shared";
import { projectRepository } from "../../db/repositories/projectRepository.js";
import { generationRepository } from "../../db/repositories/generationRepository.js";
import { chatRepository } from "../../db/repositories/chatRepository.js";

export interface ProjectDetail {
  project: Project;
  shots: Shot[];
  thread: ChatMessage[];
}

export const projectService = {
  list(): Promise<Project[]> {
    return projectRepository.list();
  },

  async create(input: CreateProjectRequest): Promise<Project> {
    const title = input.title.trim();
    if (!title) throw new ValidationError("项目标题不能为空");

    return projectRepository.insert({
      id: `proj-${nanoid(8)}`,
      title,
      subtitle: input.subtitle?.trim() ?? "",
      note: "新建项目",
      status: "ready",
      looks: ["cream", "sage", "bone"],
    });
  },

  async getDetail(projectId: string): Promise<ProjectDetail> {
    const project = await projectRepository.findById(projectId);
    if (!project) throw new NotFoundError("项目不存在");

    const [shots, thread] = await Promise.all([
      generationRepository.listShotsByProject(projectId),
      chatRepository.listByProject(projectId),
    ]);
    return { project, shots, thread };
  },
};

export class ValidationError extends Error {}
export class NotFoundError extends Error {}
