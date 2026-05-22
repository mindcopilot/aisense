// Stroke-based icons, 20x20 viewBox, currentColor. Ported from the design.
import type { ReactNode } from "react";

interface IProps {
  d: string | ReactNode;
  fill?: boolean;
  w?: number;
  h?: number;
  stroke?: number;
  vb?: string;
}

function I({ d, fill, w = 20, h = 20, stroke = 1.5, vb = "0 0 20 20" }: IProps) {
  return (
    <svg
      width={w}
      height={h}
      viewBox={vb}
      fill={fill ? "currentColor" : "none"}
      stroke={fill ? "none" : "currentColor"}
      strokeWidth={stroke}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {typeof d === "string" ? <path d={d} /> : d}
    </svg>
  );
}

export const Icons = {
  Inspire: () => (
    <I d={<path d="M10 2 L11.8 6.6 L16.5 6.9 L12.8 9.9 L14.1 14.5 L10 11.9 L5.9 14.5 L7.2 9.9 L3.5 6.9 L8.2 6.6 Z" />} />
  ),
  Studio: () => (
    <I d={<><rect x="2.5" y="3.5" width="15" height="11" rx="1.5" /><path d="M2.5 11 L7 7.5 L11 11 L14 9 L17.5 12" /><circle cx="13" cy="7" r="1.2" /><path d="M6.5 17 L13.5 17" /></>} />
  ),
  Editor: () => (
    <I d={<><path d="M14.5 3.5 L16.5 5.5 L7 15 L4 16 L5 13 Z" /><path d="M12.5 5.5 L14.5 7.5" /></>} />
  ),
  Video: () => (
    <I d={<><rect x="2.5" y="4.5" width="11" height="11" rx="1.5" /><path d="M13.5 8 L17.5 5.5 L17.5 14.5 L13.5 12 Z" /></>} />
  ),
  Assets: () => <I d="M3 5 H9 L10.5 7 H17 V15.5 H3 Z" />,
  Settings: () => (
    <I d={<><circle cx="10" cy="10" r="2.2" /><path d="M10 2.5 V4.5 M10 15.5 V17.5 M17.5 10 H15.5 M4.5 10 H2.5 M15.3 4.7 L13.9 6.1 M6.1 13.9 L4.7 15.3 M15.3 15.3 L13.9 13.9 M6.1 6.1 L4.7 4.7" /></>} />
  ),
  Plus: () => <I d="M10 4 V16 M4 10 H16" />,
  PlusSm: () => <I d="M8 3 V13 M3 8 H13" w={16} h={16} vb="0 0 16 16" stroke={1.6} />,
  Search: () => (
    <I d={<><circle cx="8.5" cy="8.5" r="5" /><path d="M12.5 12.5 L17 17" /></>} />
  ),
  Send: () => (
    <I d={<><path d="M3 10 L17 3 L13.5 17 L9.5 11 Z" /><path d="M3 10 L9.5 11" /></>} />
  ),
  Sparkle: () => (
    <I d={<><path d="M10 2.5 L11.2 7.2 L15.5 8.5 L11.2 9.8 L10 14.5 L8.8 9.8 L4.5 8.5 L8.8 7.2 Z" /><path d="M15.5 13 L16.2 14.8 L18 15.5 L16.2 16.2 L15.5 18 L14.8 16.2 L13 15.5 L14.8 14.8 Z" /></>} />
  ),
  Wand: () => (
    <I d={<><path d="M4 16 L13 7" /><path d="M11.5 4 L12.3 5.7 L14 6.5 L12.3 7.3 L11.5 9 L10.7 7.3 L9 6.5 L10.7 5.7 Z" /><path d="M16 11 L16.5 12 L17.5 12.5 L16.5 13 L16 14 L15.5 13 L14.5 12.5 L15.5 12 Z" /></>} />
  ),
  Image: () => (
    <I d={<><rect x="2.5" y="3.5" width="15" height="13" rx="1.5" /><circle cx="7" cy="8" r="1.5" /><path d="M3 14 L8 10 L13 14 L17 11.5" /></>} />
  ),
  Upload: () => (
    <I d={<><path d="M10 14 V3 M5.5 7 L10 3 L14.5 7" /><path d="M3 14 V16 H17 V14" /></>} />
  ),
  Download: () => (
    <I d={<><path d="M10 3 V13 M5.5 9 L10 13 L14.5 9" /><path d="M3 16 H17" /></>} />
  ),
  Heart: () => <I d="M10 16 C4 12 2.5 8.5 4.5 5.5 C6.5 3 9 4 10 6 C11 4 13.5 3 15.5 5.5 C17.5 8.5 16 12 10 16 Z" />,
  Eye: () => (
    <I d={<><path d="M1 10 C3 5 6 3 10 3 C14 3 17 5 19 10 C17 15 14 17 10 17 C6 17 3 15 1 10 Z" /><circle cx="10" cy="10" r="2.5" /></>} />
  ),
  More: () => (
    <I fill d={<><circle cx="4" cy="10" r="1.2" /><circle cx="10" cy="10" r="1.2" /><circle cx="16" cy="10" r="1.2" /></>} />
  ),
  Close: () => <I d="M5 5 L15 15 M15 5 L5 15" />,
  ArrowRight: () => <I d="M4 10 H16 M11.5 5.5 L16 10 L11.5 14.5" />,
  ChevronRight: () => <I d="M8 6 L12 10 L8 14" />,
  Refresh: () => (
    <I d={<><path d="M3 10 C3 6 6 3.5 10 3.5 C12.5 3.5 14.5 4.7 15.5 6.5" /><path d="M16 3.5 V7 H12.5" /><path d="M17 10 C17 14 14 16.5 10 16.5 C7.5 16.5 5.5 15.3 4.5 13.5" /><path d="M4 16.5 V13 H7.5" /></>} />
  ),
  Layers: () => (
    <I d={<><path d="M10 3 L17 7 L10 11 L3 7 Z" /><path d="M3 11 L10 15 L17 11" /><path d="M3 14.5 L10 18.5 L17 14.5" /></>} />
  ),
  Grid: () => (
    <I d={<><rect x="2.5" y="2.5" width="6" height="6" rx="1" /><rect x="11.5" y="2.5" width="6" height="6" rx="1" /><rect x="2.5" y="11.5" width="6" height="6" rx="1" /><rect x="11.5" y="11.5" width="6" height="6" rx="1" /></>} />
  ),
  Bolt: () => <I d="M11 2 L4 11 H9 L8 18 L16 9 H11 Z" />,
  Compass: () => (
    <I d={<><circle cx="10" cy="10" r="7.5" /><path d="M13 7 L11 11 L7 13 L9 9 Z" /></>} />
  ),
  Erase: () => (
    <I d={<><path d="M3 14 L13 4 L17 8 L7 18 Z" /><path d="M9 10 L13 14" /></>} />
  ),
  Crop: () => <I d="M5 2 V15 H18 M2 5 H15 V18" />,
  Bulb: () => (
    <I d={<><path d="M10 3 C7 3 5 5 5 8 C5 10 6 11 7 12.5 V14 H13 V12.5 C14 11 15 10 15 8 C15 5 13 3 10 3 Z" /><path d="M8 16 H12 M8.5 18 H11.5" /></>} />
  ),
  Pin: () => (
    <I d={<><path d="M10 2.5 L14 6.5 L11.5 9 L13 12.5 L10 11 L7 12.5 L8.5 9 L6 6.5 Z" /><path d="M10 11 V17.5" /></>} />
  ),
};
