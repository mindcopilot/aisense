// 素材库 / Assets — waterfall grid of every generated shot.
import { Icons } from "../components/Icons";
import { ShotModel, LOOKS } from "../components/Shared";
import type { Look } from "@looma/shared";

const LOOK_KEYS = Object.keys(LOOKS) as Look[];

export function Assets() {
  const items = Array.from({ length: 18 }).map((_, i) => ({
    look: LOOK_KEYS[i % LOOK_KEYS.length]!,
    i,
  }));

  return (
    <div className="page">
      <div className="dash-pad">
        <div>
          <div className="eyebrow">/ 素材库 · 2026 春装</div>
          <h1 className="dash-headline" style={{ fontSize: 44 }}>
            <span className="serif-italic">所有</span> 已生成
          </h1>
        </div>

        <div className="assets-filters">
          <button className="chip chip-solid">全部 · 184</button>
          <button className="chip">模特 · 96</button>
          <button className="chip">场景 · 42</button>
          <button className="chip">产品 · 28</button>
          <button className="chip">视频 · 18</button>
          <span style={{ flex: 1 }} />
          <button className="btn"><Icons.Grid /> 瀑布流</button>
          <button className="btn"><Icons.Layers /> 按项目</button>
        </div>

        <div className="assets-grid">
          {items.map((it) => (
            <div key={it.i} className="asset-tile">
              <ShotModel look={it.look} aspect="3/4" />
              <div className="asset-overlay">
                <button className="btn-icon"><Icons.Heart /></button>
                <button className="btn-icon"><Icons.Download /></button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
