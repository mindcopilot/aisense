// 生文 — 小红书笔记生成器.
// Left: vertical + angle + brief form. Right: generated 笔记 with spec linting.
import { useEffect, useState } from "react";
import type {
  AiAngle,
  PostTone,
  PostVertical,
  XhsPost,
  XhsValidationIssue,
} from "@looma/shared";
import { Icons } from "../components/Icons";
import { api } from "../lib/apiClient";

const PROJECT_ID = "proj-linen";

const VERTICALS: { key: PostVertical; label: string; hint: string }[] = [
  { key: "ai_tech", label: "AI · 科技", hint: "AI 自媒体" },
  { key: "ecommerce", label: "电商种草", hint: "好物笔记" },
];

const ANGLES: { key: AiAngle; label: string; hint: string }[] = [
  { key: "tutorial", label: "教程实操", hint: "手把手 · 可复现" },
  { key: "review", label: "工具测评", hint: "横向对比 · 选型" },
  { key: "news", label: "资讯快讯", hint: "时效 · 三要点" },
  { key: "opinion", label: "深度观点", hint: "判断 · 有支撑" },
];

const TONES: { key: PostTone; label: string }[] = [
  { key: "professional", label: "专业" },
  { key: "lively", label: "活泼" },
  { key: "literary", label: "文学" },
];

const DEFAULT_BRIEF: Record<PostVertical, string> = {
  ai_tech:
    "Claude Code 多 Agent 工作流：用子 Agent 并行做代码检索与审查，面向想用 AI 提效的开发者",
  ecommerce: "亚麻衬衫 · 米白 · 春季新品，主打透气垂坠、东方面孔模特、清晨自然光",
};

export function Copywriter() {
  const [vertical, setVertical] = useState<PostVertical>("ai_tech");
  const [angle, setAngle] = useState<AiAngle>("tutorial");
  const [tone, setTone] = useState<PostTone>("professional");
  const [brief, setBrief] = useState(DEFAULT_BRIEF.ai_tech);
  const [posts, setPosts] = useState<XhsPost[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.listPosts(PROJECT_ID).then(setPosts).catch(() => setPosts([]));
  }, []);

  function switchVertical(next: PostVertical) {
    setVertical(next);
    setTone(next === "ai_tech" ? "professional" : "literary");
    setBrief(DEFAULT_BRIEF[next]);
  }

  async function generate() {
    if (!brief.trim() || busy) return;
    setBusy(true);
    setError(null);
    try {
      const { post } = await api.generatePost(PROJECT_ID, {
        brief,
        vertical,
        tone,
        ...(vertical === "ai_tech" ? { angle } : {}),
      });
      setPosts((p) => [post, ...p]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "生成失败");
    } finally {
      setBusy(false);
    }
  }

  const isAi = vertical === "ai_tech";

  return (
    <div className="copy">
      {/* === LEFT: BRIEF === */}
      <aside className="cw-side">
        <div className="chat-head">
          <div>
            <div className="eyebrow">CONTENT · 生文</div>
            <div className="chat-title cn-serif">
              小红书<span className="serif-italic" style={{ color: "var(--ink-3)" }}> · 笔记</span>
            </div>
          </div>
        </div>

        <div className="cw-form">
          <div className="eyebrow">内容领域</div>
          <div className="cw-tones cw-verticals">
            {VERTICALS.map((v) => (
              <button
                key={v.key}
                className={"cw-tone " + (vertical === v.key ? "is-on" : "")}
                onClick={() => switchVertical(v.key)}
              >
                <span className="cw-tone-l">{v.label}</span>
                <span className="cw-tone-h">{v.hint}</span>
              </button>
            ))}
          </div>

          {isAi && (
            <>
              <div className="eyebrow" style={{ marginTop: 6 }}>内容体裁</div>
              <div className="cw-angles">
                {ANGLES.map((a) => (
                  <button
                    key={a.key}
                    className={"cw-tone " + (angle === a.key ? "is-on" : "")}
                    onClick={() => setAngle(a.key)}
                  >
                    <span className="cw-tone-l">{a.label}</span>
                    <span className="cw-tone-h">{a.hint}</span>
                  </button>
                ))}
              </div>
            </>
          )}

          <div className="eyebrow" style={{ marginTop: 6 }}>
            {isAi ? "主题 · 工具 · 要点" : "产品与卖点"}
          </div>
          <textarea
            className="cw-brief"
            value={brief}
            onChange={(e) => setBrief(e.target.value)}
            placeholder={
              isAi
                ? "例：某 AI 工具 / 模型 / 工作流，核心能力、对读者的价值…"
                : "例：亚麻衬衫 · 米白 · 主打透气垂坠…"
            }
            rows={5}
          />

          <div className="eyebrow" style={{ marginTop: 6 }}>语气</div>
          <div className="cw-tones">
            {TONES.map((t) => (
              <button
                key={t.key}
                className={"cw-tone cw-tone-sm " + (tone === t.key ? "is-on" : "")}
                onClick={() => setTone(t.key)}
              >
                <span className="cw-tone-l">{t.label}</span>
              </button>
            ))}
          </div>

          <button className="btn btn-accent cw-gen" onClick={generate} disabled={busy}>
            {busy ? <span className="spinner" /> : <Icons.Sparkle />}
            {busy ? "生成中…" : "生成小红书笔记"}
          </button>
          {error && <div className="cw-error">{error}</div>}

          <div className="cw-spec">
            <div className="cw-spec-h">
              <Icons.Bulb /> {isAi ? "AI 自媒体生文要点" : "小红书发文规范"}
            </div>
            <ul>
              {isAi ? (
                <>
                  <li>信息密度高、可信、可复现，术语用准不滥用</li>
                  <li>突出对读者的实际价值，拒绝标题党与夸大</li>
                  <li>教程给可照做步骤；测评给克制结论</li>
                  <li>标题 ≤20 字，标签 3–10 个，规避绝对化用语</li>
                </>
              ) : (
                <>
                  <li>标题 8–20 字，首句即钩子</li>
                  <li>正文 120–1000 字，口语化、分段、emoji 适量</li>
                  <li>话题标签 3–10 个，均以 # 开头</li>
                  <li>规避绝对化用语（最佳 / 第一 / 100% 等）</li>
                </>
              )}
            </ul>
          </div>
        </div>
      </aside>

      {/* === RIGHT: GENERATED POSTS === */}
      <div className="cw-main">
        <div className="dash-pad" style={{ gap: 20 }}>
          <div className="kicker-line">
            <span className="eyebrow">/ 已生成笔记 · {posts.length}</span>
            <span className="line" />
          </div>

          {posts.length === 0 && (
            <div className="cw-empty">
              <Icons.Note />
              <p>选择内容领域与体裁，填写要点，让 AI 写手产出符合小红书规范的笔记。</p>
            </div>
          )}

          {posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      </div>
    </div>
  );
}

const VERTICAL_LABEL: Record<PostVertical, string> = {
  ai_tech: "AI · 科技",
  ecommerce: "电商种草",
};
const ANGLE_LABEL: Record<AiAngle, string> = {
  tutorial: "教程实操",
  review: "工具测评",
  news: "资讯快讯",
  opinion: "深度观点",
};

function PostCard({ post }: { post: XhsPost }) {
  const v = post.validation;
  return (
    <article className="cw-post">
      <div className="cw-post-head">
        <h2 className="cn-serif cw-post-title">{post.title}</h2>
        <span className={"cw-badge " + (v.ok ? "is-ok" : "is-bad")}>
          {v.ok ? <Icons.Check /> : <Icons.Close />}
          {v.ok ? "符合规范" : "需修改"}
        </span>
      </div>

      <div className="cw-post-meta">
        <span className="cw-kind">
          {VERTICAL_LABEL[post.vertical]}
          {post.angle ? ` · ${ANGLE_LABEL[post.angle]}` : ""}
        </span>
        <span>·</span>
        <span>标题 {v.titleLength}/20</span>
        <span>·</span>
        <span>正文 {v.bodyLength}/1000</span>
        <span>·</span>
        <span>标签 {v.tagCount}</span>
      </div>

      <p className="cw-post-body">{post.body}</p>

      <div className="cw-tags">
        {post.tags.map((t) => (
          <span key={t} className="chip chip-accent">{t}</span>
        ))}
      </div>

      <div className="cw-cover">
        <Icons.Image />
        <span>{post.coverTip}</span>
      </div>

      {v.issues.length > 0 && (
        <ul className="cw-issues">
          {v.issues.map((issue, i) => (
            <li key={i} className={"cw-issue cw-issue-" + issue.level}>
              <span className="cw-issue-tag">
                {issue.level === "error" ? "违规" : "建议"} · {fieldLabel(issue)}
              </span>
              {issue.message}
            </li>
          ))}
        </ul>
      )}
    </article>
  );
}

function fieldLabel(issue: XhsValidationIssue): string {
  return { title: "标题", body: "正文", tags: "标签" }[issue.field];
}
