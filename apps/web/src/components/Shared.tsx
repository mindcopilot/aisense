// Stylized placeholder visuals — layered gradients standing in for real photos.
import type { CSSProperties, ReactNode } from "react";
import type { Look, Scene } from "@looma/shared";

export const LOOKS: Record<Look, { skin: string; fabric: string; a: string; b: string }> = {
  cream: { skin: "#E5BCA0", fabric: "#C18A6E", a: "#EFE3D2", b: "#C2A688" },
  desert: { skin: "#E0B095", fabric: "#A56347", a: "#E8C9A8", b: "#B07E55" },
  sage: { skin: "#DCB29A", fabric: "#5E7559", a: "#DCD7B8", b: "#8FA38A" },
  rose: { skin: "#E8BFA8", fabric: "#B96A6A", a: "#F1D1CC", b: "#D17F7F" },
  studio: { skin: "#E2B69A", fabric: "#2F2F2F", a: "#EAE5DC", b: "#9A938A" },
  midnight: { skin: "#C9A088", fabric: "#212A3A", a: "#3D4A5E", b: "#1A2231" },
  coral: { skin: "#E5B498", fabric: "#D5604A", a: "#F5C9B8", b: "#C46446" },
  bone: { skin: "#DEB89F", fabric: "#9F9586", a: "#F0EBE0", b: "#A19785" },
  ink: { skin: "#D7B098", fabric: "#1B1A17", a: "#D4CDBE", b: "#3F3A33" },
  sand: { skin: "#D8AE93", fabric: "#9A724E", a: "#E5CFAE", b: "#A57842" },
};

export const SCENES: Record<Scene, { sky: string; ground: string }> = {
  beach: { sky: "#D7C9A8", ground: "#A48557" },
  studio: { sky: "#EBE5D6", ground: "#B6AC97" },
  city: { sky: "#4F5A66", ground: "#1F242A" },
  garden: { sky: "#C2C9A5", ground: "#5E6E4A" },
  sunset: { sky: "#E4A07B", ground: "#7A3A2F" },
  marble: { sky: "#E8E0CF", ground: "#D2C6AC" },
  cafe: { sky: "#C8A781", ground: "#5E412B" },
  road: { sky: "#B7B0A3", ground: "#3D362B" },
};

export const LOOK_NAMES: Partial<Record<Look, string>> = {
  sage: "苔园清晨",
  cream: "亚麻日光",
  bone: "白瓷温柔",
  rose: "玫瑰柔焦",
  desert: "沙漠黄昏",
  coral: "珊瑚海岸",
};

type ShotStyle = CSSProperties & Record<string, string | number>;

interface ShotModelProps {
  look?: Look;
  tag?: string;
  label?: string;
  aspect?: string;
  style?: CSSProperties;
  className?: string;
  children?: ReactNode;
}

export function ShotModel({
  look = "cream", tag, label, aspect = "3/4", style, className = "", children,
}: ShotModelProps) {
  const l = LOOKS[look];
  const merged: ShotStyle = {
    aspectRatio: aspect,
    "--skin": l.skin, "--fabric": l.fabric,
    "--shot-a": l.a, "--shot-b": l.b,
    ...style,
  };
  return (
    <div className={`shot shot-model ${className}`} style={merged}>
      {tag && <div className="shot-tag">{tag}</div>}
      {label && <div className="shot-label">{label}</div>}
      {children}
    </div>
  );
}

interface ShotSceneProps {
  scene?: Scene;
  tag?: string;
  aspect?: string;
  style?: CSSProperties;
  className?: string;
}

export function ShotScene({
  scene = "studio", tag, aspect = "4/3", style, className = "",
}: ShotSceneProps) {
  const s = SCENES[scene];
  const merged: ShotStyle = {
    aspectRatio: aspect,
    "--sky": s.sky, "--ground": s.ground,
    ...style,
  };
  return (
    <div className={`shot shot-scene ${className}`} style={merged}>
      {tag && <div className="shot-tag">{tag}</div>}
    </div>
  );
}

type ProductTone = "linen" | "bone" | "ash" | "paper";

const TONES: Record<ProductTone, { a: string; b: string; item: string }> = {
  linen: { a: "#F1ECDE", b: "#D8CFBA", item: "#9A724E" },
  bone: { a: "#EDE7D6", b: "#C6BBA2", item: "#2F2925" },
  ash: { a: "#D6D2C5", b: "#9C9586", item: "#403B30" },
  paper: { a: "#F6F2E5", b: "#E4DCC6", item: "#A0411F" },
};

interface ShotProductProps {
  tone?: ProductTone;
  label?: string;
  tag?: string;
  aspect?: string;
  style?: CSSProperties;
}

export function ShotProduct({
  tone = "linen", label, tag, aspect = "1/1", style,
}: ShotProductProps) {
  const t = TONES[tone];
  return (
    <div
      className="shot"
      style={{
        aspectRatio: aspect,
        background: `
          radial-gradient(ellipse 40% 55% at 50% 50%, ${t.item} 0%, ${t.item} 30%, transparent 65%),
          repeating-linear-gradient(135deg, transparent 0 8px, rgba(0,0,0,.025) 8px 9px),
          linear-gradient(${t.a}, ${t.b})
        `,
        ...style,
      }}
    >
      {tag && <div className="shot-tag">{tag}</div>}
      {label && <div className="shot-label">{label}</div>}
    </div>
  );
}

export function ThumbSwatch({ look = "cream", size = 36 }: { look?: Look; size?: number }) {
  const l = LOOKS[look];
  return (
    <div
      style={{
        width: size, height: size, borderRadius: 6, flex: "none",
        background: `
          radial-gradient(ellipse 38% 25% at 50% 30%, ${l.skin}, transparent 65%),
          radial-gradient(ellipse 70% 55% at 50% 90%, ${l.fabric}, transparent 70%),
          linear-gradient(${l.a}, ${l.b})
        `,
        boxShadow: "inset 0 0 0 0.5px rgba(0,0,0,.08)",
      }}
    />
  );
}

export function LoomaMark({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 22 22" aria-label="Looma">
      <rect x="0" y="0" width="22" height="22" rx="6" fill="var(--ink)" />
      <text
        x="11" y="16.2" textAnchor="middle"
        fontFamily="Instrument Serif, serif" fontStyle="italic"
        fontSize="15" fill="var(--bg)"
      >L</text>
      <circle cx="15.8" cy="14.2" r="1.6" fill="var(--accent)" />
    </svg>
  );
}
