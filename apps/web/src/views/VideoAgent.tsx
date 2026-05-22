// 视频代理 / AI Video Agent — chat → storyboard → timeline.
import { useState } from "react";
import { Icons } from "../components/Icons";
import { ShotModel } from "../components/Shared";
import type { Look } from "@looma/shared";

interface Clip {
  id: number;
  dur: number;
  look: Look;
  label: string;
  motion: string;
}

const CLIPS: Clip[] = [
  { id: 1, dur: 2.5, look: "cream", label: "推近 · 产品特写", motion: "ZOOM IN" },
  { id: 2, dur: 3.0, look: "sage", label: "侧逆光 · 转身", motion: "PAN L→R" },
  { id: 3, dur: 2.5, look: "bone", label: "走位 · 中景", motion: "DOLLY" },
  { id: 4, dur: 3.5, look: "rose", label: "回眸 · 慢动作", motion: "SLOW MO" },
  { id: 5, dur: 2.5, look: "ink", label: "落幅 · 黑场", motion: "FADE OUT" },
];

export function VideoAgent() {
  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(2);
  const clip = CLIPS[current - 1]!;

  return (
    <div className="video">
      <aside className="vid-side">
        <div className="vid-side-h">
          <div>
            <div className="eyebrow">PROJECT</div>
            <div className="chat-title cn-serif">
              春装亚麻 · <span className="serif-italic">15s 短视频</span>
            </div>
          </div>
          <button className="btn-icon"><Icons.More /></button>
        </div>

        <div className="vid-prompt">
          <Icons.Wand />
          <div>
            <div className="vid-prompt-l">你的指令</div>
            <div className="vid-prompt-t cn-serif">
              一支 15 秒短视频，文学杂志感，强调亚麻的垂坠和透气，从产品特写到模特走位，适配 TikTok 竖版。
            </div>
          </div>
        </div>

        <div className="vid-side-body">
          <div className="vid-section-h">
            <span className="eyebrow">/ 分镜建议 · 5 个</span>
            <button className="btn btn-ghost" style={{ padding: "2px 8px" }}>
              <Icons.Refresh /> 重排
            </button>
          </div>
          <div className="vid-storyboard">
            {CLIPS.map((c, i) => (
              <div
                key={c.id}
                className={`vid-shot-row ${current === c.id ? "is-on" : ""}`}
                onClick={() => setCurrent(c.id)}
              >
                <div className="vid-shot-n">{String(i + 1).padStart(2, "0")}</div>
                <ShotModel look={c.look} aspect="3/4" style={{ width: 56, borderRadius: 6, flex: "none" }} />
                <div className="vid-shot-body">
                  <div className="vid-shot-t">{c.label}</div>
                  <div className="vid-shot-m">
                    <span className="chip" style={{ padding: "2px 7px", fontSize: 10 }}>{c.motion}</span>
                    <span>{c.dur}s</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="vid-section-h" style={{ marginTop: 14 }}>
            <span className="eyebrow">/ 配乐 · 自动匹配</span>
          </div>
          <div className="vid-music">
            <div className="vid-music-icon">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M7 14 V4 L16 3 V13" />
                <circle cx="5" cy="14.5" r="2" />
                <circle cx="14" cy="13.5" r="2" />
              </svg>
            </div>
            <div className="vid-music-body">
              <div className="vid-music-t">Lo-fi · 木吉他与雨声</div>
              <div className="vid-music-w">
                {Array.from({ length: 32 }).map((_, i) => (
                  <span key={i} className="vid-bar"
                    style={{ height: `${30 + Math.sin(i * 0.6) * 25 + (i % 4) * 5}%` }} />
                ))}
              </div>
            </div>
            <button className="btn-icon"><Icons.Refresh /></button>
          </div>
        </div>

        <div className="vid-side-foot">
          <button className="chip"><Icons.PlusSm /> 加镜头</button>
          <button className="chip"><Icons.Wand /> 改氛围</button>
          <button className="btn btn-accent" style={{ marginLeft: "auto" }}>
            <Icons.Bolt /> 生成 · 38 credits
          </button>
        </div>
      </aside>

      <div className="vid-main">
        <div className="vid-stage-wrap">
          <div className="vid-stage">
            <ShotModel
              look={clip.look} aspect="9/16"
              style={{ height: "100%", maxHeight: 460, borderRadius: 8, boxShadow: "var(--shadow-lg)" }}
            />
            <div className="vid-safe vid-safe-top">字幕安全区</div>
            <div className="vid-safe vid-safe-bottom">CTA 安全区</div>
            <div className="vid-caption cn-serif">
              "<span className="serif-italic">linen,</span> 春天落在肩上"
            </div>
          </div>

          <div className="vid-stage-side">
            <div className="eyebrow">/ 镜头 {String(current).padStart(2, "0")} · {clip.label}</div>
            <h2 className="cn-serif" style={{ fontSize: 22, marginTop: 6 }}>
              <span className="serif-italic">{clip.motion}</span>
            </h2>
            <div className="vid-params">
              <Param k="时长" v={`${clip.dur} 秒`} />
              <Param k="比例" v="9 : 16" />
              <Param k="模型" v="Looma · Director v3" />
              <Param k="种子" v="#28194" mono />
            </div>
            <hr className="hr" style={{ marginTop: 12, marginBottom: 12 }} />
            <div className="eyebrow" style={{ marginBottom: 8 }}>对这一帧说</div>
            <div className="vid-frame-chat">
              <button className="chip">让转身更慢</button>
              <button className="chip">加一阵风</button>
              <button className="chip">换 1.85:1</button>
            </div>
            <button className="ed-chat-bait" style={{ marginTop: 8 }}>
              <Icons.Wand />
              <span>例：让光透过亚麻穿过来…</span>
            </button>
          </div>
        </div>

        <div className="vid-timeline">
          <div className="vid-tl-controls">
            <button className="btn-icon" onClick={() => setPlaying((p) => !p)}>
              {playing ? (
                <svg width="18" height="18" viewBox="0 0 20 20" fill="currentColor">
                  <rect x="5" y="4" width="3" height="12" /><rect x="12" y="4" width="3" height="12" />
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M6 4 L16 10 L6 16 Z" />
                </svg>
              )}
            </button>
            <span className="vid-time">00:04.5 / 00:14.0</span>
            <div className="vid-spacer" />
            <button className="btn btn-ghost"><Icons.Layers /> 多机位</button>
            <button className="btn"><Icons.Download /> MP4</button>
          </div>

          <div className="vid-tl-track">
            <div className="vid-ruler">
              {[0, 2, 4, 6, 8, 10, 12, 14].map((s) => (
                <span key={s} className="vid-tick">{s}s</span>
              ))}
            </div>
            <div className="vid-clips">
              {CLIPS.map((c) => (
                <div
                  key={c.id}
                  className={`vid-clip ${current === c.id ? "is-on" : ""}`}
                  style={{ flex: `${(c.dur / 14) * 100} 1 0` }}
                  onClick={() => setCurrent(c.id)}
                >
                  <ShotModel look={c.look} aspect="16/9"
                    style={{ height: 36, width: "auto", borderRadius: 4, flex: "none" }} />
                  <div className="vid-clip-lbl">{c.label}</div>
                  <div className="vid-clip-dur">{c.dur}s</div>
                </div>
              ))}
            </div>
            <div className="vid-tl-audio">
              <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor">
                <path d="M3 7 V13 H7 L12 17 V3 L7 7 Z" />
              </svg>
              <div className="vid-tl-wave">
                {Array.from({ length: 80 }).map((_, i) => (
                  <span key={i} className="vid-bar-sm"
                    style={{ height: `${20 + Math.sin(i * 0.4) * 18 + (i % 5) * 4}%` }} />
                ))}
              </div>
            </div>
            <div className="vid-playhead" style={{ left: `${(4.5 / 14) * 100}%` }}>
              <div className="vid-playhead-head" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Param({ k, v, mono }: { k: string; v: string; mono?: boolean }) {
  return (
    <div className="vid-param">
      <span className="vid-param-k">{k}</span>
      <span className={`vid-param-v${mono ? " mono" : ""}`}>{v}</span>
    </div>
  );
}
