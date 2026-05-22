// 灵感 / Inspiration — editorial magazine-style entry point.
import { Icons } from "../components/Icons";
import { ShotModel, ShotScene } from "../components/Shared";
import type { Route } from "../App";
import type { Look } from "@looma/shared";

interface DashboardProps {
  onOpen: (r: Route) => void;
}

export function Dashboard({ onOpen }: DashboardProps) {
  return (
    <div className="page">
      <div className="dash-pad">
        <div className="dash-mast">
          <div className="dash-mast-l">
            <div className="eyebrow">第 28 期 · 2026 春夏 · 周四清晨</div>
            <h1 className="dash-headline">
              <span className="serif-italic">Today's</span> 灵感工位
              <span className="dash-headline-dot">.</span>
            </h1>
            <p className="dash-sub">
              下午好，舒。从一张<span className="serif-italic"> garment flat </span>开始，
              或让 AI 导演为你的春装系列定一组镜头。
            </p>
          </div>
          <div className="dash-mast-r">
            <div className="dash-stat">
              <div className="dash-stat-n">42</div>
              <div className="dash-stat-l">本周已生成</div>
            </div>
            <div className="dash-divider" />
            <div className="dash-stat">
              <div className="dash-stat-n">7</div>
              <div className="dash-stat-l">在跑的项目</div>
            </div>
            <div className="dash-divider" />
            <div className="dash-stat">
              <div className="dash-stat-n">¥3.6k</div>
              <div className="dash-stat-l">本月节省</div>
            </div>
          </div>
        </div>

        <div className="dash-actions">
          <button className="dash-action dash-action-primary" onClick={() => onOpen("studio")}>
            <div className="dash-action-eye">/ 01 主入口</div>
            <div className="dash-action-title">
              <span className="serif-italic">让 AI</span> 给你拍一组
            </div>
            <div className="dash-action-sub">
              对话式工作室 · 上传衣服 → 描述风格 → 生成 4-12 张
            </div>
            <div className="dash-action-cta">
              开始对话 <Icons.ArrowRight />
            </div>
            <div className="dash-action-deco" aria-hidden="true">
              <ShotModel look="rose" aspect="3/4" />
              <ShotModel look="sage" aspect="3/4" />
              <ShotModel look="ink" aspect="3/4" />
            </div>
          </button>

          <div className="dash-action-stack">
            <button className="dash-action-sm" onClick={() => onOpen("editor")}>
              <Icons.Wand />
              <div>
                <div className="dash-action-sm-t">编辑器</div>
                <div className="dash-action-sm-s">抠图 · 重打光 · 扩图</div>
              </div>
              <Icons.ChevronRight />
            </button>
            <button className="dash-action-sm" onClick={() => onOpen("video")}>
              <Icons.Video />
              <div>
                <div className="dash-action-sm-t">视频代理</div>
                <div className="dash-action-sm-s">一张图生成 15s 短视频</div>
              </div>
              <Icons.ChevronRight />
            </button>
            <button className="dash-action-sm" onClick={() => onOpen("assets")}>
              <Icons.Layers />
              <div>
                <div className="dash-action-sm-t">批量改图</div>
                <div className="dash-action-sm-s">200+ SKU 一键统一</div>
              </div>
              <Icons.ChevronRight />
            </button>
          </div>
        </div>

        <section className="dash-section">
          <div className="kicker-line">
            <span className="eyebrow">/ 02 · 在跑的项目</span>
            <span className="line" />
            <button className="btn btn-ghost">查看全部 <Icons.ArrowRight /></button>
          </div>
          <div className="dash-projects">
            <ProjectCard
              title="春装亚麻系列" cn="aerial 春装" note="3 个模特 · 5 个场景"
              ts="进行中 · 2 小时前" status="generating"
              shots={["cream", "sage", "bone"]} onOpen={() => onOpen("studio")}
            />
            <ProjectCard
              title="珠宝详情页 v4" cn="光泽 · 极简" note="48 张已生成"
              ts="2 天前" status="ready"
              shots={["studio", "ink", "midnight"]} onOpen={() => onOpen("studio")}
            />
            <ProjectCard
              title="海边度假草帽" cn="海岛 · 黄昏" note="12 张已生成"
              ts="昨天" status="ready"
              shots={["desert", "coral", "sand"]} onOpen={() => onOpen("studio")}
            />
          </div>
        </section>

        <section className="dash-section">
          <div className="kicker-line">
            <span className="eyebrow">/ 03 · 本周编辑精选</span>
            <span className="line" />
            <span className="chip">@looma editorial</span>
          </div>
          <div className="dash-editorial">
            <article className="dash-edit-hero">
              <ShotScene scene="sunset" aspect="16/10" tag="EDITORIAL 015" />
              <div className="dash-edit-hero-body">
                <div className="eyebrow">— 季节灵感</div>
                <h2 className="display" style={{ fontSize: 36, lineHeight: 1.05 }}>
                  How to shoot<br /><em>"summer haze"</em>
                </h2>
                <p style={{ color: "var(--ink-2)", fontSize: 13.5, maxWidth: 360 }}>
                  五个模板 · 三种灯光配方 · 让你的麻质衣物在傍晚 6 点的金色时刻里显得不那么"AI"。
                </p>
                <div className="row" style={{ gap: 8 }}>
                  <button className="btn btn-primary">一键套用</button>
                  <button className="btn">查看 →</button>
                </div>
              </div>
            </article>
            <div className="dash-edit-grid">
              <EditCard look="rose" title="柔焦 · 玫瑰金" meta="编辑 / 张悠然" />
              <EditCard look="midnight" title="赛博 · 深夜街拍" meta="编辑 / 林望舒" />
              <EditCard look="sage" title="园林 · 苔藓绿" meta="编辑 / Looma AI" />
              <EditCard look="cream" title="日系奶白" meta="编辑 / 余知白" />
            </div>
          </div>
        </section>

        <section className="dash-section">
          <div className="kicker-line">
            <span className="eyebrow">/ 04 · 灵感配方</span>
            <span className="line" />
          </div>
          <div className="dash-recipes">
            {RECIPES.map((r) => (
              <button key={r.t} className="recipe">
                <div className="recipe-k">{r.k}</div>
                <div className="recipe-t">{r.t}</div>
                <div className="recipe-s">{r.s}</div>
                <Icons.ArrowRight />
              </button>
            ))}
          </div>
        </section>

        <footer className="dash-foot">
          <span className="serif-italic">Looma</span>
          <span>·</span>
          <span>your AI atelier</span>
          <span>·</span>
          <span>v0.28 · 2026 spring</span>
        </footer>
      </div>
    </div>
  );
}

const RECIPES = [
  { t: "Amazon 主图合规包", s: "白底 · 居中 · 边距 15%", k: "主图" },
  { t: "小红书探店九宫格", s: "竖版 · 滤镜 · 字幕预留", k: "九宫格" },
  { t: "Instagram 走位序列", s: "正面 → 1/4 转 → 回眸", k: "5 帧" },
  { t: "TikTok 15s 短视频", s: "镜头切换 · 配乐 · 字幕", k: "短视频" },
  { t: "Lookbook 跨页对开", s: "极简留白 · 2:1 横版", k: "印刷" },
  { t: "详情页穿搭三件套", s: "上装 · 下装 · 配饰组合", k: "套装" },
];

interface ProjectCardProps {
  title: string;
  cn: string;
  note: string;
  ts: string;
  status: "generating" | "ready";
  shots: Look[];
  onOpen: () => void;
}

function ProjectCard({ title, cn, note, ts, status, shots, onOpen }: ProjectCardProps) {
  return (
    <button className="proj" onClick={onOpen}>
      <div className="proj-shots">
        {shots.map((look, i) => (
          <ShotModel key={i} look={look} aspect="3/4" className={`proj-shot proj-shot-${i}`} />
        ))}
        {status === "generating" && (
          <div className="proj-badge"><span className="spinner" /> 生成中</div>
        )}
      </div>
      <div className="proj-body">
        <div className="proj-title">
          <span>{title}</span>
          <span className="serif-italic" style={{ color: "var(--ink-3)" }}>{cn}</span>
        </div>
        <div className="proj-meta">
          <span>{note}</span>
          <span>·</span>
          <span style={{ color: "var(--ink-4)" }}>{ts}</span>
        </div>
      </div>
    </button>
  );
}

function EditCard({ look, title, meta }: { look: Look; title: string; meta: string }) {
  return (
    <div className="edit-card">
      <ShotModel look={look} aspect="4/5" />
      <div className="edit-card-body">
        <div className="edit-card-t cn-serif">{title}</div>
        <div className="edit-card-m">{meta}</div>
      </div>
    </div>
  );
}
