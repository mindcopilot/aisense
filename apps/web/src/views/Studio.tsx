// 工作室 / Studio — the core: AI conversation + infinite canvas.
//
// Wired to the live API: the thread and canvas shots are loaded from the
// backend, messages run through the AI art director, and generation batches
// are orchestrated by Temporal. While a batch runs the canvas polls for status.
import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import { Icons } from "../components/Icons";
import { ShotModel, ShotProduct, ThumbSwatch, LOOK_NAMES } from "../components/Shared";
import { api } from "../lib/apiClient";
import type { ChatMessage, Shot, Look } from "@looma/shared";

const PROJECT_ID = "proj-linen";

interface ShotCard {
  kind: "shot";
  id: string;
  x: number;
  y: number;
  w: number;
  look: Look;
  pose: string;
  batch: string;
  generating: boolean;
}

interface MoodboardCard {
  kind: "moodboard";
  id: string;
  x: number;
  y: number;
  w: number;
  title: string;
  looks: Look[];
}

interface ProductCard {
  kind: "product";
  id: string;
  x: number;
  y: number;
  w: number;
  label: string;
}

interface NoteCard {
  kind: "note";
  id: string;
  x: number;
  y: number;
  w: number;
  text: string;
}

type Card = ShotCard | MoodboardCard | ProductCard | NoteCard;

// Static decoration cards — reference material that anchors the canvas.
const DECOR: Card[] = [
  {
    kind: "moodboard", id: "decor-mood", x: 60, y: 40, w: 220,
    title: "苔园清晨 · 参考", looks: ["sage", "bone", "cream", "sage"],
  },
  {
    kind: "product", id: "decor-product", x: 60, y: 380, w: 220,
    label: "产品图 · 已抠",
  },
  {
    kind: "note", id: "decor-note", x: 1100, y: 60, w: 200,
    text: "客户偏好：克制 · 文学感 · 避免过度后期修色。光线尽量保持自然。",
  },
];

function shotToCard(shot: Shot): ShotCard {
  return {
    kind: "shot",
    id: shot.id,
    x: shot.x,
    y: shot.y,
    w: shot.width,
    look: shot.look,
    pose: shot.pose,
    batch: shot.batchId,
    generating: shot.status === "generating" || shot.status === "queued",
  };
}

export function Studio() {
  const [thread, setThread] = useState<ChatMessage[]>([]);
  const [cards, setCards] = useState<Card[]>(DECOR);
  const [selected, setSelected] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);

  const draggingRef = useRef<{ id: string; startX: number; startY: number; origX: number; origY: number } | null>(null);
  const panningRef = useRef<{ startX: number; startY: number; origX: number; origY: number } | null>(null);

  const generating = cards.some((c) => c.kind === "shot" && c.generating);

  const loadDetail = useCallback(async () => {
    const detail = await api.getProject(PROJECT_ID);
    setThread(detail.thread);
    setCards([...DECOR, ...detail.shots.map(shotToCard)]);
  }, []);

  useEffect(() => {
    loadDetail().catch((err) => console.error("[studio] load failed", err));
  }, [loadDetail]);

  // Poll while a batch is in flight so resolved shots appear on the canvas.
  useEffect(() => {
    if (!generating) return;
    const timer = setInterval(() => {
      api.getProject(PROJECT_ID)
        .then((detail) => {
          setCards((prev) => {
            const decor = prev.filter((c) => c.kind !== "shot");
            return [...decor, ...detail.shots.map(shotToCard)];
          });
        })
        .catch(() => {});
    }, 1500);
    return () => clearInterval(timer);
  }, [generating]);

  async function send() {
    const text = input.trim();
    if (!text || thinking) return;
    setInput("");
    setThinking(true);
    try {
      const res = await api.sendMessage(PROJECT_ID, text);
      setThread((t) => [...t, res.userMessage, res.aiMessage]);
      if (res.batch) await loadDetail();
    } catch (err) {
      console.error("[studio] send failed", err);
      setThread((t) => [
        ...t,
        {
          id: `err-${Date.now()}`, projectId: PROJECT_ID, role: "ai",
          text: "抱歉，连接 Atelier 失败，请确认 API 服务已启动。",
          createdAt: new Date().toISOString(),
        },
      ]);
    } finally {
      setThinking(false);
    }
  }

  function onCardDown(e: React.MouseEvent, id: string) {
    if ((e.target as HTMLElement).closest(".card-toolbar")) return;
    e.stopPropagation();
    setSelected(id);
    const card = cards.find((c) => c.id === id);
    if (!card) return;
    draggingRef.current = {
      id, startX: e.clientX, startY: e.clientY, origX: card.x, origY: card.y,
    };
    const onMove = (ev: MouseEvent) => {
      const d = draggingRef.current;
      if (!d) return;
      const dx = (ev.clientX - d.startX) / zoom;
      const dy = (ev.clientY - d.startY) / zoom;
      setCards((cs) => cs.map((c) => (c.id === d.id ? { ...c, x: d.origX + dx, y: d.origY + dy } : c)));
    };
    const onUp = () => {
      draggingRef.current = null;
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }

  function onCanvasDown(e: React.MouseEvent) {
    if ((e.target as HTMLElement).closest(".canvas-card")) return;
    if ((e.target as HTMLElement).closest(".canvas-toolbar")) return;
    setSelected(null);
    panningRef.current = { startX: e.clientX, startY: e.clientY, origX: pan.x, origY: pan.y };
    const onMove = (ev: MouseEvent) => {
      const p = panningRef.current;
      if (!p) return;
      setPan({ x: p.origX + (ev.clientX - p.startX), y: p.origY + (ev.clientY - p.startY) });
    };
    const onUp = () => {
      panningRef.current = null;
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }

  function onWheel(e: React.WheelEvent) {
    if (!e.ctrlKey && !e.metaKey) return;
    e.preventDefault();
    setZoom((z) => Math.max(0.4, Math.min(2, z * (e.deltaY > 0 ? 0.94 : 1.06))));
  }

  const selectedShot = cards.find((c) => c.id === selected && c.kind === "shot") as ShotCard | undefined;

  return (
    <div className="studio">
      <ChatPanel
        thread={thread} thinking={thinking}
        input={input} setInput={setInput} onSend={send}
      />

      <div className="studio-canvas-wrap">
        <CanvasToolbar
          zoom={zoom} setZoom={setZoom}
          onFit={() => { setZoom(1); setPan({ x: 0, y: 0 }); }}
        />

        <div className="studio-canvas" onMouseDown={onCanvasDown} onWheel={onWheel}>
          <div className="canvas-grid" />
          <div
            className="canvas-stage"
            style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})` }}
          >
            {cards.map((c) => (
              <CanvasCard
                key={c.id} card={c}
                selected={selected === c.id}
                onMouseDown={(e) => onCardDown(e, c.id)}
              />
            ))}
          </div>

          {selectedShot && <ContextToolbar card={selectedShot} pan={pan} zoom={zoom} />}
          <MiniMap cards={cards} zoom={zoom} />
        </div>
      </div>
    </div>
  );
}

// =================== CHAT PANEL ===================

interface ChatPanelProps {
  thread: ChatMessage[];
  thinking: boolean;
  input: string;
  setInput: (v: string) => void;
  onSend: () => void;
}

function ChatPanel({ thread, thinking, input, setInput, onSend }: ChatPanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [thread, thinking]);

  return (
    <div className="chat">
      <div className="chat-head">
        <div>
          <div className="eyebrow">PROJECT</div>
          <div className="chat-title cn-serif">
            春装亚麻系列{" "}
            <span className="serif-italic" style={{ color: "var(--ink-3)" }}>· spring linen</span>
          </div>
        </div>
        <div className="icon-row">
          <button className="btn-icon" title="重命名"><Icons.Editor /></button>
          <button className="btn-icon" title="分享"><Icons.Upload /></button>
          <button className="btn-icon" title="更多"><Icons.More /></button>
        </div>
      </div>

      <div className="chat-director">
        <div className="chat-dir-avatar"><Icons.Sparkle /></div>
        <div>
          <div className="chat-dir-name">
            Atelier — <span className="serif-italic">your AI 艺术总监</span>
          </div>
          <div className="chat-dir-status">
            <span className="spinner-dot" />
            理解你的产品 · 给方向 · 不只是出图
          </div>
        </div>
      </div>

      <div className="chat-scroll" ref={scrollRef}>
        {thread.map((m) => (m.role === "user" ? <UserMsg key={m.id} m={m} /> : <AIMsg key={m.id} m={m} />))}
        {thinking && (
          <div className="msg msg-ai">
            <div className="msg-bubble ai-bubble">
              <div className="row" style={{ gap: 6, color: "var(--ink-3)" }}>
                <span className="dot-pulse" />
                <span className="dot-pulse" style={{ animationDelay: ".15s" }} />
                <span className="dot-pulse" style={{ animationDelay: ".3s" }} />
                <span style={{ marginLeft: 6, fontSize: 12 }}>Atelier 思考中…</span>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="chat-composer">
        <div className="chat-quick">
          <button className="chip" onClick={() => setInput("加 2 张回眸 · 同光")}>
            <Icons.PlusSm /> 加变体
          </button>
          <button className="chip" onClick={() => setInput("把背景换成清晨园林")}>
            <Icons.Image /> 换场景
          </button>
          <button className="chip" onClick={() => setInput("把这张的光打得更柔")}>
            <Icons.Bulb /> 改光线
          </button>
          <button className="chip" onClick={() => setInput("生成走位序列 5 帧")}>
            <Icons.Layers /> 走位序列
          </button>
        </div>

        <div className="chat-input">
          <button className="btn-icon" title="附产品图"><Icons.Upload /></button>
          <textarea
            placeholder="告诉 Atelier 你想要什么 — 比如：换成清晨园林，模特带一只藤编篮…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                onSend();
              }
            }}
            rows={1}
          />
          <button className={`send-btn ${input.trim() ? "active" : ""}`} onClick={onSend}>
            <Icons.Send />
          </button>
        </div>
        <div className="chat-footnote">
          <span>Enter 发送 · Shift+Enter 换行</span>
          <span><Icons.Bolt /> 单次约 12 credits</span>
        </div>
      </div>
    </div>
  );
}

function UserMsg({ m }: { m: ChatMessage }) {
  return (
    <div className="msg msg-user">
      <div className="msg-bubble user-bubble">{m.text}</div>
    </div>
  );
}

function AIMsg({ m }: { m: ChatMessage }) {
  return (
    <div className="msg msg-ai">
      <div className="msg-bubble ai-bubble">
        {m.text}
        {m.proposals && (
          <div className="proposals">
            {m.proposals.map((p, i) => (
              <div key={p.id} className="proposal">
                <div className="proposal-head">
                  <div className="proposal-n">/ 方向 {i + 1}</div>
                  <div className="proposal-t cn-serif">{p.title}</div>
                  <div className="proposal-d">{p.desc}</div>
                </div>
                <div className="proposal-thumbs">
                  {p.looks.map((l, j) => <ThumbSwatch key={j} look={l} size={42} />)}
                </div>
                <div className="proposal-act">
                  <button className="btn btn-primary">选这个 →</button>
                  <button className="btn btn-ghost">看大图</button>
                </div>
              </div>
            ))}
          </div>
        )}
        {m.batchId && (
          <div className="gen-strip">
            <span className="spinner" />
            <span>生成批次 <b>{m.batchId}</b></span>
            <span style={{ flex: 1 }} />
            <button className="btn btn-ghost">取消</button>
          </div>
        )}
      </div>
    </div>
  );
}

// =================== CANVAS ===================

interface CanvasToolbarProps {
  zoom: number;
  setZoom: React.Dispatch<React.SetStateAction<number>>;
  onFit: () => void;
}

function CanvasToolbar({ zoom, setZoom, onFit }: CanvasToolbarProps) {
  return (
    <div className="canvas-toolbar">
      <div className="ct-group">
        <button className="btn-icon" title="选择"><Icons.Compass /></button>
        <button className="btn-icon" title="便签"><Icons.Pin /></button>
        <button className="btn-icon" title="圈选"><Icons.Crop /></button>
      </div>
      <div className="ct-divider" />
      <div className="ct-group">
        <button className="btn-icon" onClick={() => setZoom((z) => Math.max(0.4, z * 0.9))}>−</button>
        <button className="ct-zoom" onClick={onFit}>{Math.round(zoom * 100)}%</button>
        <button className="btn-icon" onClick={() => setZoom((z) => Math.min(2, z * 1.1))}>+</button>
      </div>
      <div className="ct-divider" />
      <div className="ct-group">
        <button className="btn-icon" title="网格"><Icons.Grid /></button>
        <button className="btn-icon" title="对比"><Icons.Layers /></button>
      </div>
      <div className="ct-spacer" />
      <button className="btn"><Icons.Download /> 导出</button>
    </div>
  );
}

interface CanvasCardProps {
  card: Card;
  selected: boolean;
  onMouseDown: (e: React.MouseEvent) => void;
}

function CanvasCard({ card, selected, onMouseDown }: CanvasCardProps) {
  return (
    <div
      className={`canvas-card ${selected ? "is-selected " : ""}kind-${card.kind}`}
      style={{ left: card.x, top: card.y, width: card.w }}
      onMouseDown={onMouseDown}
    >
      {card.kind === "shot" && (
        <>
          <div className="card-meta-top">
            <span className="card-batch">{card.batch}</span>
            <span className="card-pose">{card.pose}</span>
          </div>
          <div className="card-img-wrap">
            {card.generating ? (
              <div className="card-generating">
                <ShotModel look={card.look} aspect="3/4" style={{ borderRadius: 8, opacity: 0.35 }} />
                <div className="card-genoverlay">
                  <span className="spinner" />
                  <span>生成中…</span>
                </div>
              </div>
            ) : (
              <ShotModel look={card.look} aspect="3/4" style={{ borderRadius: 8 }} />
            )}
          </div>
          <div className="card-foot">
            <span className="card-name cn-serif">{LOOK_NAMES[card.look] ?? "草稿"}</span>
            <div className="icon-row">
              <button className="btn-icon" title="收藏"><Icons.Heart /></button>
              <button className="btn-icon" title="更多"><Icons.More /></button>
            </div>
          </div>
        </>
      )}

      {card.kind === "moodboard" && (
        <>
          <div className="card-meta-top"><span className="card-batch">MOODBOARD</span></div>
          <div className="moodboard-grid">
            {card.looks.map((l, i) => <ThumbSwatch key={i} look={l} size={84} />)}
          </div>
          <div className="card-foot">
            <span className="card-name cn-serif">{card.title}</span>
          </div>
        </>
      )}

      {card.kind === "product" && (
        <>
          <div className="card-meta-top">
            <span className="card-batch">PRODUCT</span>
            <span className="card-pose">已抠</span>
          </div>
          <ShotProduct tone="linen" aspect="1/1" label={card.label} style={{ borderRadius: 8 }} />
        </>
      )}

      {card.kind === "note" && (
        <div className="note-card">
          <div className="note-tab">NOTE</div>
          <div className="note-text cn-serif">{card.text}</div>
        </div>
      )}
    </div>
  );
}

function ContextToolbar({ card, pan, zoom }: { card: ShotCard; pan: { x: number; y: number }; zoom: number }) {
  const left = card.x * zoom + pan.x + (card.w * zoom) / 2;
  const top = card.y * zoom + pan.y - 12;
  return (
    <div className="card-toolbar" style={{ left, top }}>
      <button className="ctb-btn"><Icons.Wand /> 改这张</button>
      <div className="ctb-sep" />
      <button className="ctb-btn" title="重打光"><Icons.Bulb /></button>
      <button className="ctb-btn" title="换背景"><Icons.Image /></button>
      <button className="ctb-btn" title="扩图"><Icons.Crop /></button>
      <button className="ctb-btn" title="魔法消除"><Icons.Erase /></button>
      <div className="ctb-sep" />
      <button className="ctb-btn" title="变体 ×4"><Icons.Refresh /></button>
      <button className="ctb-btn" title="导出"><Icons.Download /></button>
      <div className="ctb-sep" />
      <button className="ctb-btn ctb-accent">用于详情页 →</button>
    </div>
  );
}

function MiniMap({ cards, zoom }: { cards: Card[]; zoom: number }) {
  const bb = useMemo(() => {
    if (!cards.length) return { x: 0, y: 0, w: 1, h: 1 };
    const xs = cards.map((c) => c.x);
    const ys = cards.map((c) => c.y);
    const xe = cards.map((c) => c.x + c.w);
    const ye = cards.map((c) => c.y + c.w * 1.3);
    const x = Math.min(...xs);
    const y = Math.min(...ys);
    return { x, y, w: Math.max(...xe) - x, h: Math.max(...ye) - y };
  }, [cards]);

  const scale = 140 / Math.max(bb.w, bb.h);
  return (
    <div className="minimap">
      <div className="minimap-canvas">
        {cards.map((c) => (
          <div
            key={c.id}
            className="minimap-dot"
            style={{
              left: (c.x - bb.x) * scale,
              top: (c.y - bb.y) * scale,
              width: Math.max(4, c.w * scale * 0.6),
              height: Math.max(6, c.w * scale * 0.8),
              background:
                c.kind === "note" ? "var(--gold)"
                  : c.kind === "product" ? "var(--ocean)"
                    : "var(--accent)",
              opacity: 0.85,
            }}
          />
        ))}
      </div>
      <div className="minimap-label">
        <span>{cards.length} 张</span>
        <span style={{ color: "var(--ink-4)" }}>{Math.round(zoom * 100)}%</span>
      </div>
    </div>
  );
}
