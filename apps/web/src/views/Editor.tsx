// 编辑器 / Image editor with floating tool palette.
import { useState } from "react";
import { Icons } from "../components/Icons";
import { ShotModel, ThumbSwatch } from "../components/Shared";
import type { ReactNode } from "react";

type Tool = "select" | "erase" | "relight" | "bg" | "expand" | "enhance" | "wand";

interface Light {
  key: number;
  fill: number;
  rim: number;
  temp: number;
}

export function Editor() {
  const [tool, setTool] = useState<Tool>("relight");
  const [look] = useState<"cream">("cream");
  const [light, setLight] = useState<Light>({ key: 65, fill: 40, rim: 25, temp: 5500 });

  return (
    <div className="editor">
      <aside className="ed-layers">
        <div className="ed-section-h">
          <span>图层</span>
          <button className="btn-icon"><Icons.PlusSm /></button>
        </div>
        <div className="ed-layer-list">
          <LayerRow active title="原图 · 模特" sub="model_03.png" eye />
          <LayerRow title="重打光 · 暖逆光" sub="relight • +2.1k" eye />
          <LayerRow title="背景 · 苔园清晨" sub="scene • inpainted" eye />
          <LayerRow title="魔法消除 · 路人" sub="erase × 2" />
        </div>
        <div className="ed-section-h" style={{ marginTop: 16 }}>
          <span>历史</span>
          <span style={{ color: "var(--ink-4)", fontFamily: "var(--mono)", fontSize: 10 }}>14 步</span>
        </div>
        <div className="ed-history">
          <HistoryRow t="导入" ts="14:22" />
          <HistoryRow t="抠图 → 单独图层" ts="14:23" />
          <HistoryRow t="重打光" ts="14:25" />
          <HistoryRow t="背景替换" ts="14:27" />
          <HistoryRow t="魔法消除" ts="14:29" active />
        </div>
      </aside>

      <div className="ed-canvas-wrap">
        <div className="ed-canvas-top">
          <div className="ed-tabs">
            <button className="ed-tab is-active">model_03.png</button>
            <button className="ed-tab">model_04.png</button>
            <button className="ed-tab">model_05.png</button>
            <button className="ed-tab-add"><Icons.PlusSm /></button>
          </div>
          <div className="ed-canvas-meta">
            <span>2048 × 2730px</span><span>·</span><span>RGB</span>
            <span>·</span><span>已保存 2s 前</span>
          </div>
        </div>

        <div className="ed-stage">
          <div className="ed-image">
            <ShotModel
              look={look} aspect="3/4"
              style={{ width: 460, borderRadius: 12, boxShadow: "var(--shadow-lg)" }}
            />
            <div className="ed-split-handle">
              <div className="ed-split-line" />
              <div className="ed-split-pill">
                <span>原图</span>
                <span className="ed-split-pill-divider" />
                <span style={{ color: "var(--accent)" }}>已修</span>
              </div>
            </div>
            <div className="ed-hdl ed-hdl-tl" />
            <div className="ed-hdl ed-hdl-tr" />
            <div className="ed-hdl ed-hdl-bl" />
            <div className="ed-hdl ed-hdl-br" />
          </div>
          <div className="ed-cursor">
            <Icons.Wand />
            <span>点击 · 调整光线</span>
          </div>
        </div>

        <div className="ed-palette">
          <ToolBtn active={tool === "select"} on={() => setTool("select")} icon={<Icons.Compass />} label="选区" k="V" />
          <ToolBtn active={tool === "erase"} on={() => setTool("erase")} icon={<Icons.Erase />} label="魔法消除" k="E" />
          <ToolBtn active={tool === "relight"} on={() => setTool("relight")} icon={<Icons.Bulb />} label="重打光" k="L" />
          <ToolBtn active={tool === "bg"} on={() => setTool("bg")} icon={<Icons.Image />} label="换背景" k="B" />
          <ToolBtn active={tool === "expand"} on={() => setTool("expand")} icon={<Icons.Crop />} label="扩图" k="X" />
          <ToolBtn active={tool === "enhance"} on={() => setTool("enhance")} icon={<Icons.Sparkle />} label="超分" k="U" />
          <ToolBtn active={tool === "wand"} on={() => setTool("wand")} icon={<Icons.Wand />} label="对话改" k="A" />
        </div>
      </div>

      <aside className="ed-inspector">
        <div className="ed-section-h">
          <span>{tool === "relight" ? "重打光" : "工具"}</span>
          <span className="chip chip-accent"><Icons.Sparkle /> 智能</span>
        </div>

        {tool === "relight" && (
          <div className="ed-controls">
            <div className="ed-preset-row">
              <span className="eyebrow">预设</span>
              <div className="ed-presets">
                {[
                  { k: "morning", l: "晨光" },
                  { k: "golden", l: "金时" },
                  { k: "studio", l: "影棚" },
                  { k: "moody", l: "幽暗" },
                ].map((p) => (
                  <button key={p.k} className={`preset ${p.k === "golden" ? "is-on" : ""}`}>
                    <div className={`preset-sw preset-sw-${p.k}`} />
                    <span>{p.l}</span>
                  </button>
                ))}
              </div>
            </div>

            <Slider label="主光强度" value={light.key} min={0} max={100} unit="%"
              onChange={(v) => setLight({ ...light, key: v })} />
            <Slider label="补光" value={light.fill} min={0} max={100} unit="%"
              onChange={(v) => setLight({ ...light, fill: v })} />
            <Slider label="轮廓光" value={light.rim} min={0} max={100} unit="%"
              onChange={(v) => setLight({ ...light, rim: v })} />
            <Slider label="色温" value={light.temp} min={2500} max={9000} step={100} unit="K"
              onChange={(v) => setLight({ ...light, temp: v })} />

            <div className="ed-section-h" style={{ marginTop: 18 }}><span>方向</span></div>
            <div className="ed-direction">
              <div className="ed-dir-stage">
                <div className="ed-dir-target" />
                <div className="ed-dir-knob" />
              </div>
              <div className="ed-dir-info">
                <div className="ed-dir-lbl">主光方位</div>
                <div className="ed-dir-val">
                  <span>↗ 右上 35°</span>
                  <span style={{ color: "var(--ink-4)" }}>距离 1.4m</span>
                </div>
              </div>
            </div>

            <div className="ed-section-h" style={{ marginTop: 18 }}><span>对话调整</span></div>
            <button className="ed-chat-bait">
              <Icons.Wand />
              <span>把光调得更柔，像清晨透过纱帘…</span>
            </button>
          </div>
        )}

        <div style={{ flex: 1 }} />
        <div className="ed-foot">
          <button className="btn btn-ghost">放弃</button>
          <button className="btn btn-primary">应用 ✓</button>
        </div>
      </aside>
    </div>
  );
}

interface ToolBtnProps {
  icon: ReactNode;
  label: string;
  k: string;
  active: boolean;
  on: () => void;
}

function ToolBtn({ icon, label, k, active, on }: ToolBtnProps) {
  return (
    <button className={`tool-btn ${active ? "is-on" : ""}`} onClick={on}>
      <div className="tool-btn-ico">{icon}</div>
      <div className="tool-btn-lbl">
        <span>{label}</span>
        <kbd>{k}</kbd>
      </div>
    </button>
  );
}

function LayerRow({
  active, title, sub, eye,
}: { active?: boolean; title: string; sub: string; eye?: boolean }) {
  return (
    <div className={`layer-row ${active ? "is-on" : ""}`}>
      <button className="layer-eye" title="显示/隐藏">
        {eye !== false ? <Icons.Eye /> : <span style={{ width: 12, opacity: 0.3 }}>—</span>}
      </button>
      <ThumbSwatch look={title.includes("背景") ? "sage" : "cream"} size={28} />
      <div className="layer-text">
        <div className="layer-t">{title}</div>
        <div className="layer-s">{sub}</div>
      </div>
    </div>
  );
}

function HistoryRow({ t, ts, active }: { t: string; ts: string; active?: boolean }) {
  return (
    <div className={`hist-row ${active ? "is-on" : ""}`}>
      <span className="hist-dot" />
      <span className="hist-t">{t}</span>
      <span className="hist-ts">{ts}</span>
    </div>
  );
}

interface SliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (v: number) => void;
  unit?: string;
}

function Slider({ label, value, min, max, step = 1, onChange, unit = "" }: SliderProps) {
  return (
    <div className="ed-slider">
      <div className="ed-slider-h">
        <span>{label}</span>
        <span className="ed-slider-v">{value}{unit}</span>
      </div>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </div>
  );
}
