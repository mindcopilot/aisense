// Floating Tweaks panel — theme / density / accent / navigation controls.
import { useState } from "react";
import { Icons } from "./Icons";
import type { Tweaks, Density, Accent } from "../hooks/useTweaks";
import type { Route } from "../App";

const ACCENT_OPTIONS: [string, string][] = [
  ["#00754A", "#005A39"],
  ["#1E3932", "#0D2520"],
  ["#B8893A", "#9C7A3F"],
  ["#D14B33", "#9A2D1A"],
  ["#3D5A6C", "#1F3340"],
];

const ROUTES: { value: Route; label: string }[] = [
  { value: "inspire", label: "灵感 / Dashboard" },
  { value: "studio", label: "工作室 / Studio" },
  { value: "editor", label: "编辑器 / Editor" },
  { value: "video", label: "视频代理 / Video" },
  { value: "assets", label: "素材库 / Assets" },
];

interface Props {
  tweaks: Tweaks;
  setTweak: <K extends keyof Tweaks>(key: K, value: Tweaks[K]) => void;
  route: Route;
  onRoute: (r: Route) => void;
}

export function TweaksPanel({ tweaks, setTweak, route, onRoute }: Props) {
  const [open, setOpen] = useState(false);

  const accentValue = Array.isArray(tweaks.accent) ? tweaks.accent[0] : tweaks.accent;

  return (
    <div className={`tweaks ${open ? "tweaks-open" : ""}`}>
      <button className="tweaks-toggle" onClick={() => setOpen((o) => !o)} title="Tweaks">
        <Icons.Settings />
      </button>
      {open && (
        <div className="tweaks-body">
          <div className="tweaks-section">主题</div>

          <label className="tweaks-row">
            <span>深色模式</span>
            <input
              type="checkbox"
              checked={tweaks.dark}
              onChange={(e) => setTweak("dark", e.target.checked)}
            />
          </label>

          <div className="tweaks-row tweaks-col">
            <span>布局密度</span>
            <div className="tweaks-options">
              {(["compact", "regular", "comfy"] as Density[]).map((d) => (
                <button
                  key={d}
                  className={`tweaks-opt ${tweaks.density === d ? "is-on" : ""}`}
                  onClick={() => setTweak("density", d)}
                >
                  {d === "compact" ? "紧凑" : d === "regular" ? "标准" : "舒适"}
                </button>
              ))}
            </div>
          </div>

          <div className="tweaks-row tweaks-col">
            <span>强调色</span>
            <div className="tweaks-swatches">
              {ACCENT_OPTIONS.map((opt) => (
                <button
                  key={opt[0]}
                  className={`tweaks-sw ${accentValue === opt[0] ? "is-on" : ""}`}
                  style={{ background: opt[0] }}
                  onClick={() => setTweak("accent", opt as Accent)}
                />
              ))}
            </div>
          </div>

          <div className="tweaks-section">导航</div>
          <select
            className="tweaks-select"
            value={route}
            onChange={(e) => onRoute(e.target.value as Route)}
          >
            {ROUTES.map((r) => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}
