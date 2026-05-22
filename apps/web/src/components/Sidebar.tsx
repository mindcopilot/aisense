// Left rail navigation + workspace top bar.
import { Icons } from "./Icons";
import { LoomaMark } from "./Shared";
import type { Route } from "../App";

const NAV: { key: Route; icon: JSX.Element; label: string }[] = [
  { key: "inspire", icon: <Icons.Inspire />, label: "灵感" },
  { key: "studio", icon: <Icons.Studio />, label: "工作室" },
  { key: "editor", icon: <Icons.Editor />, label: "编辑器" },
  { key: "video", icon: <Icons.Video />, label: "视频" },
  { key: "copy", icon: <Icons.Note />, label: "生文" },
  { key: "market", icon: <Icons.Campaign />, label: "营销" },
  { key: "assets", icon: <Icons.Assets />, label: "素材库" },
];

export function Sidebar({ current, onNav }: { current: Route; onNav: (r: Route) => void }) {
  return (
    <aside className="rail">
      <div className="rail-logo" title="Looma · 露玛">L</div>
      {NAV.map((n) => (
        <button
          key={n.key}
          className="rail-btn"
          aria-current={current === n.key ? "true" : undefined}
          onClick={() => onNav(n.key)}
        >
          {n.icon}
          <span>{n.label}</span>
        </button>
      ))}
      <div className="rail-spacer" />
      <button className="rail-btn" title="设置">
        <Icons.Settings />
        <span>设置</span>
      </button>
      <div className="rail-avatar" title="林望舒">舒</div>
    </aside>
  );
}

interface TopBarProps {
  section: string;
  projectName: string;
  status?: string;
}

export function TopBar({ section, projectName, status }: TopBarProps) {
  return (
    <div className="topbar">
      <div className="crumb">
        <LoomaMark />
        <span className="crumb-serif">Looma</span>
        <span>·</span>
        <b>{projectName}</b>
        <span style={{ color: "var(--ink-4)" }}>/ {section}</span>
      </div>

      <div className="tb-spacer" />

      <div className="tb-search">
        <Icons.Search />
        <input placeholder="搜索素材 · 项目 · 命令…" />
        <kbd>⌘K</kbd>
      </div>

      <div className="tb-pill" title={status}>
        <span className="dot" />
        <span>{status ?? "已自动保存 · 3 秒前"}</span>
      </div>

      <button className="tb-btn tb-btn-gold">
        <Icons.Bolt />
        <span>1,284 credits</span>
      </button>

      <button className="tb-btn tb-btn-primary">分享</button>
    </div>
  );
}
