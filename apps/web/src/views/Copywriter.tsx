// 生文 — 小红书笔记生成器.
// Left: brief + tone form. Right: generated 笔记 with spec-compliance linting.
import { useEffect, useState } from "react";
import type { PostTone, XhsPost, XhsValidationIssue } from "@looma/shared";
import { Icons } from "../components/Icons";
import { api } from "../lib/apiClient";

const PROJECT_ID = "proj-linen";

const TONES: { key: PostTone; label: string; hint: string }[] = [
  { key: "literary", label: "文学", hint: "克制 · 画面感" },
  { key: "lively", label: "活泼", hint: "亲和 · 像朋友安利" },
  { key: "professional", label: "专业", hint: "理性 · 测评感" },
];

export function Copywriter() {
  const [brief, setBrief] = useState(
    "亚麻衬衫 · 米白 · 春季新品，主打透气垂坠、东方面孔模特、清晨自然光",
  );
  const [tone, setTone] = useState<PostTone>("literary");
  const [posts, setPosts] = useState<XhsPost[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.listPosts(PROJECT_ID).then(setPosts).catch(() => setPosts([]));
  }, []);

  async function generate() {
    if (!brief.trim() || busy) return;
    setBusy(true);
    setError(null);
    try {
      const { post } = await api.generatePost(PROJECT_ID, brief, tone);
      setPosts((p) => [post, ...p]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "生成失败");
    } finally {
      setBusy(false);
    }
  }

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
          <div className="eyebrow">产品与卖点</div>
          <textarea
            className="cw-brief"
            value={brief}
            onChange={(e) => setBrief(e.target.value)}
            placeholder="例：亚麻衬衫 · 米白 · 主打透气垂坠、东方面孔模特、清晨自然光…"
            rows={5}
          />

          <div className="eyebrow" style={{ marginTop: 6 }}>语气</div>
          <div className="cw-tones">
            {TONES.map((t) => (
              <button
                key={t.key}
                className={"cw-tone " + (tone === t.key ? "is-on" : "")}
                onClick={() => setTone(t.key)}
              >
                <span className="cw-tone-l">{t.label}</span>
                <span className="cw-tone-h">{t.hint}</span>
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
              <Icons.Bulb /> 小红书发文规范
            </div>
            <ul>
              <li>标题 8–20 字，首句即钩子</li>
              <li>正文 120–1000 字，口语化、分段、emoji 适量</li>
              <li>话题标签 3–10 个，均以 # 开头</li>
              <li>规避绝对化用语（最佳 / 第一 / 100% 等），避免限流</li>
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
              <p>填写左侧产品卖点，让 AI 写手产出符合小红书规范的笔记。</p>
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
