/**
 * @looma/shared — domain contract shared between the web app and the API.
 *
 * Kept dependency-free on purpose so both the browser bundle and the Node
 * server can import it without dragging in runtime libraries.
 */

export type Look =
  | "cream" | "desert" | "sage" | "rose" | "studio"
  | "midnight" | "coral" | "bone" | "ink" | "sand";

export type Scene =
  | "beach" | "studio" | "city" | "garden"
  | "sunset" | "marble" | "cafe" | "road";

export type ProjectStatus = "generating" | "ready" | "archived";

export interface Project {
  id: string;
  title: string;
  subtitle: string;
  note: string;
  status: ProjectStatus;
  looks: Look[];
  createdAt: string;
  updatedAt: string;
}

export type GenerationStatus = "queued" | "generating" | "succeeded" | "failed";

/** A single AI-generated shot living on the Studio canvas. */
export interface Shot {
  id: string;
  projectId: string;
  batchId: string;
  look: Look;
  pose: string;
  status: GenerationStatus;
  /** Canvas placement — drives the infinite-canvas layout. */
  x: number;
  y: number;
  width: number;
  imageUrl: string | null;
  seed: number | null;
  createdAt: string;
}

/** A batch of shots requested in one go (1 LLM prompt → N shots). */
export interface GenerationBatch {
  id: string;
  projectId: string;
  prompt: string;
  count: number;
  status: GenerationStatus;
  /** Temporal workflow id orchestrating this batch. */
  workflowId: string | null;
  createdAt: string;
}

export type ChatRole = "user" | "ai";

export interface ChatMessage {
  id: string;
  projectId: string;
  role: ChatRole;
  text: string;
  /** AI direction proposals, when the assistant offers creative directions. */
  proposals?: DirectionProposal[];
  /** Set when the message kicked off a generation batch. */
  batchId?: string;
  createdAt: string;
}

export interface DirectionProposal {
  id: string;
  title: string;
  desc: string;
  looks: Look[];
}

// ---------- API request / response shapes ----------

export interface SendMessageRequest {
  text: string;
}

export interface SendMessageResponse {
  userMessage: ChatMessage;
  aiMessage: ChatMessage;
  batch: GenerationBatch | null;
}

export interface CreateProjectRequest {
  title: string;
  subtitle?: string;
}

export interface ApiError {
  error: string;
}
