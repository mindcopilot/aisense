// 营销自动化 — one-sentence marketing pipeline (图片 + 视频 + 文章) + schedules.
import { useEffect, useRef, useState } from "react";
import type { Campaign, CampaignSchedule, CampaignStatus, Look } from "@looma/shared";
import { Icons } from "../components/Icons";
import { ThumbSwatch } from "../components/Shared";
import { api } from "../lib/apiClient";

const STATUS_LABEL: Record<CampaignStatus, string> = {
  queued: "排队中",
  planning: "拆解需求",
  rendering: "生成物料",
  succeeded: "已完成",
  failed: "失败",
};

const TERMINAL: CampaignStatus[] = ["succeeded", "failed"];

function lookOf(imageUrl: string): Look {
  const m = imageUrl.match(/[?&]look=([a-z]+)/);
  return (m?.[1] as Look) ?? "cream";
}

export function Marketing() {
  const [brief, setBrief] = useState(
    "为我们的 AI 代码助手做一波春季推广，主打多 Agent 并行提效",
  );
  const [interval, setInterval_] = useState(60);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [schedules, setSchedules] = useState<CampaignSchedule[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pollRef = useRef<number | null>(null);

  async function refresh() {
    const [c, s] = await Promise.all([
      api.listCampaigns().catch(() => []),
      api.listSchedules().catch(() => []),
    ]);
    setCampaigns(c);
    setSchedules(s);
  }

  useEffect(() => {
    void refresh();
  }, []);

  // Poll while any campaign is still running.
  useEffect(() => {
    const running = campaigns.some((c) => !TERMINAL.includes(c.status));
    if (running && pollRef.current == null) {
      pollRef.current = window.setInterval(refresh, 2500);
    } else if (!running && pollRef.current != null) {
      window.clearInterval(pollRef.current);
      pollRef.current = null;
    }
    return () => {
      if (pollRef.current != null) {
        window.clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };
  }, [campaigns]);

  async function runNow() {
    if (!brief.trim() || busy) return;
    setBusy(true);
    setError(null);
    try {
      const campaign = await api.runCampaign(brief);
      setCampaigns((c) => [campaign, ...c]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "生成失败");
    } finally {
      setBusy(false);
    }
  }

  async function schedule() {
    if (!brief.trim() || busy) return;
    setBusy(true);
    setError(null);
    try {
      const s = await api.createSchedule(brief, interval);
      setSchedules((list) => [s, ...list]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "创建定时任务失败");
    } finally {
      setBusy(false);
    }
  }

  async function cancel(id: string) {
    await api.cancelSchedule(id).catch(() => {});
    setSchedules((list) => list.filter((s) => s.id !== id));
  }

  return (
    <div className="market">
      {/* === LEFT: TRIGGER === */}
      <aside className="mk-side">
        <div className="chat-head">
          <div>
            <div className="eyebrow">PIPELINE · 营销自动化</div>
            <div className="chat-title cn-serif">
              一句话<span className="serif-italic" style={{ color: "var(--ink-3)" }}> · 全套物料</span>
            </div>
          </div>
        </div>

        <div className="cw-form">
          <div className="eyebrow">一句话宣传需求</div>
          <textarea
            className="cw-brief"
            value={brief}
            onChange={(e) => setBrief(e.target.value)}
            placeholder="例：为新款 AI 写作工具做一波夏季推广，主打长文一键生成…"
            rows={4}
          />

          <button className="btn btn-accent cw-gen" onClick={runNow} disabled={busy}>
            {busy ? <span className="spinner" /> : <Icons.Campaign />}
            立即生成图片 · 视频 · 文章
          </button>

          <div className="mk-pipeline">
            <span className="mk-step"><Icons.Image /> 图片</span>
            <Icons.ChevronRight />
            <span className="mk-step"><Icons.Video /> 视频</span>
            <Icons.ChevronRight />
            <span className="mk-step"><Icons.Note /> 文章</span>
          </div>

          <div className="kicker-line" style={{ marginTop: 6 }}>
            <span className="eyebrow">定期触发</span>
            <span className="line" />
          </div>
          <div className="mk-sched-form">
            <label className="mk-interval">
              每
              <input
                type="number"
                min={1}
                value={interval}
                onChange={(e) => setInterval_(Math.max(1, Number(e.target.value)))}
              />
              分钟
            </label>
            <button className="btn" onClick={schedule} disabled={busy}>
              <Icons.Refresh /> 创建定时任务
            </button>
          </div>

          {error && <div className="cw-error">{error}</div>}

          {schedules.length > 0 && (
            <div className="mk-schedules">
              {schedules.map((s) => (
                <div key={s.id} className="mk-sched">
                  <div className="mk-sched-body">
                    <div className="mk-sched-brief">{s.brief}</div>
                    <div className="mk-sched-meta">
                      每 {s.intervalMinutes} 分钟 · {s.mode === "temporal" ? "Temporal 调度" : "进程内调度"}
                      {s.active ? "" : " · 已停用"}
                    </div>
                  </div>
                  {s.active && (
                    <button className="btn-icon" title="停用" onClick={() => cancel(s.id)}>
                      <Icons.Close />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </aside>

      {/* === RIGHT: CAMPAIGNS === */}
      <div className="cw-main">
        <div className="dash-pad" style={{ gap: 18 }}>
          <div className="kicker-line">
            <span className="eyebrow">/ 营销任务 · {campaigns.length}</span>
            <span className="line" />
          </div>

          {campaigns.length === 0 && (
            <div className="cw-empty">
              <Icons.Campaign />
              <p>输入一句话需求，流水线会自动产出宣传图片、短视频与配套文章。</p>
            </div>
          )}

          {campaigns.map((c) => (
            <CampaignCard key={c.id} campaign={c} />
          ))}
        </div>
      </div>
    </div>
  );
}

function CampaignCard({ campaign: c }: { campaign: Campaign }) {
  const done = c.status === "succeeded";
  const running = c.status === "planning" || c.status === "rendering" || c.status === "queued";
  return (
    <article className="cw-post mk-campaign">
      <div className="cw-post-head">
        <h2 className="cn-serif cw-post-title" style={{ fontSize: 18 }}>{c.brief}</h2>
        <span
          className={
            "cw-badge " + (done ? "is-ok" : c.status === "failed" ? "is-bad" : "is-run")
          }
        >
          {running && <span className="spinner" />}
          {done && <Icons.Check />}
          {STATUS_LABEL[c.status]}
        </span>
      </div>

      {c.scheduleId && (
        <div className="cw-post-meta"><span className="cw-kind">定时触发</span></div>
      )}

      {c.status === "failed" && <div className="cw-error">{c.error ?? "流水线失败"}</div>}

      {done && c.plan && (
        <>
          <div className="mk-asset">
            <div className="mk-asset-h"><Icons.Image /> 宣传图片 · {c.imageUrls.length}</div>
            <div className="mk-images">
              {c.imageUrls.map((url, i) => (
                <ThumbSwatch key={i} look={lookOf(url)} size={84} />
              ))}
            </div>
          </div>

          {c.video && (
            <div className="mk-asset">
              <div className="mk-asset-h">
                <Icons.Video /> 短视频 · {c.video.durationSec.toFixed(1)}s
              </div>
              <div className="mk-clips">
                {c.video.clips.map((clip, i) => (
                  <div key={i} className="mk-clip">
                    <span className="mk-clip-motion">{clip.motion}</span>
                    <span className="mk-clip-label">{clip.label}</span>
                    <span className="mk-clip-dur">{clip.durationSec}s</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {c.article && (
            <div className="mk-asset">
              <div className="mk-asset-h"><Icons.Note /> 配套文章</div>
              <div className="mk-article">
                <div className="mk-article-title cn-serif">{c.article.title}</div>
                <p className="mk-article-body">{c.article.body}</p>
                <div className="cw-tags">
                  {c.article.tags.map((t) => (
                    <span key={t} className="chip chip-accent">{t}</span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </article>
  );
}
