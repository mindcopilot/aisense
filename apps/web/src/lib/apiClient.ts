// Typed HTTP client for the Looma API. The single network boundary of the app.
import type {
  Project,
  Shot,
  ChatMessage,
  CreateProjectRequest,
  SendMessageResponse,
  XhsPost,
  PostTone,
  GeneratePostResponse,
} from "@looma/shared";

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:4000";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}/api${path}`, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(body.error ?? `请求失败 (${res.status})`);
  }
  return res.json() as Promise<T>;
}

export interface ProjectDetail {
  project: Project;
  shots: Shot[];
  thread: ChatMessage[];
}

export const api = {
  listProjects: () => request<Project[]>("/projects"),

  createProject: (body: CreateProjectRequest) =>
    request<Project>("/projects", { method: "POST", body: JSON.stringify(body) }),

  getProject: (id: string) => request<ProjectDetail>(`/projects/${id}`),

  getThread: (projectId: string) =>
    request<ChatMessage[]>(`/studio/${projectId}/thread`),

  sendMessage: (projectId: string, text: string) =>
    request<SendMessageResponse>(`/studio/${projectId}/messages`, {
      method: "POST",
      body: JSON.stringify({ text }),
    }),

  // 生文 — 小红书 content generation.
  listPosts: (projectId: string) =>
    request<XhsPost[]>(`/content/${projectId}/posts`),

  generatePost: (projectId: string, brief: string, tone: PostTone) =>
    request<GeneratePostResponse>(`/content/${projectId}/posts`, {
      method: "POST",
      body: JSON.stringify({ brief, tone }),
    }),
};
