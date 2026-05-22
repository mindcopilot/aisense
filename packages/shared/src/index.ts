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

// ---------- Content generation (生文 · 小红书) ----------

export type PostTone = "literary" | "lively" | "professional";

/** Content vertical — which domain the copywriter writes for. */
export type PostVertical = "ecommerce" | "ai_tech";

/** Content angle for the AI/科技 vertical. */
export type AiAngle = "tutorial" | "review" | "news" | "opinion";

export interface XhsValidationIssue {
  level: "error" | "warning";
  field: "title" | "body" | "tags";
  message: string;
}

/** Result of linting a draft against the 小红书 publishing spec. */
export interface XhsValidation {
  ok: boolean;
  titleLength: number;
  bodyLength: number;
  tagCount: number;
  issues: XhsValidationIssue[];
}

/** A 小红书-format post ("笔记") generated for a project. */
export interface XhsPost {
  id: string;
  projectId: string;
  brief: string;
  vertical: PostVertical;
  /** Content angle — only meaningful for the ai_tech vertical. */
  angle: AiAngle | null;
  tone: PostTone;
  title: string;
  body: string;
  tags: string[];
  coverTip: string;
  validation: XhsValidation;
  createdAt: string;
}

export interface GeneratePostRequest {
  /** Free-form brief: product / tool / topic, key points, audience. */
  brief: string;
  vertical?: PostVertical;
  /** Required when vertical is ai_tech; ignored otherwise. */
  angle?: AiAngle;
  tone?: PostTone;
}

export interface GeneratePostResponse {
  post: XhsPost;
}

// ---------- Marketing automation (营销 pipeline) ----------

export type CampaignStatus =
  | "queued" | "planning" | "rendering" | "succeeded" | "failed";

/** Structured plan the planner derives from a one-sentence brief. */
export interface CampaignPlan {
  theme: string;
  imageShots: { look: Look; pose: string }[];
  videoConcept: string;
  videoClips: { label: string; motion: string }[];
  article: {
    brief: string;
    vertical: PostVertical;
    angle: AiAngle | null;
    tone: PostTone;
  };
}

export interface CampaignVideo {
  url: string;
  durationSec: number;
  clips: { label: string; motion: string; durationSec: number }[];
}

export interface CampaignArticle {
  title: string;
  body: string;
  tags: string[];
  coverTip: string;
  validation: XhsValidation;
}

/** One run of the marketing pipeline — its inputs and all produced assets. */
export interface Campaign {
  id: string;
  brief: string;
  status: CampaignStatus;
  /** Set when the run was triggered by a schedule. */
  scheduleId: string | null;
  workflowId: string | null;
  plan: CampaignPlan | null;
  imageUrls: string[];
  video: CampaignVideo | null;
  article: CampaignArticle | null;
  error: string | null;
  createdAt: string;
  completedAt: string | null;
}

/** How a recurring trigger is driven. */
export type ScheduleMode = "temporal" | "in-process";

export interface CampaignSchedule {
  id: string;
  brief: string;
  intervalMinutes: number;
  mode: ScheduleMode;
  active: boolean;
  createdAt: string;
}

export interface RunCampaignRequest {
  brief: string;
}

export interface CreateScheduleRequest {
  brief: string;
  intervalMinutes: number;
}

export interface ApiError {
  error: string;
}
