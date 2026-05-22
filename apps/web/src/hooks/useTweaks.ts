// Persistent UI tweaks (theme / density / accent) — the design's Tweaks panel.
import { useCallback, useEffect, useState } from "react";

export type Density = "compact" | "regular" | "comfy";
export type Accent = string | [string, string];

export interface Tweaks {
  dark: boolean;
  density: Density;
  accent: Accent;
}

export const TWEAK_DEFAULTS: Tweaks = {
  dark: false,
  density: "regular",
  accent: "#00754A",
};

const STORAGE_KEY = "looma.tweaks";

function load(): Tweaks {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...TWEAK_DEFAULTS, ...(JSON.parse(raw) as Partial<Tweaks>) };
  } catch {
    /* ignore corrupt storage */
  }
  return TWEAK_DEFAULTS;
}

export function useTweaks(): [Tweaks, <K extends keyof Tweaks>(key: K, value: Tweaks[K]) => void] {
  const [tweaks, setTweaks] = useState<Tweaks>(load);

  const setTweak = useCallback(<K extends keyof Tweaks>(key: K, value: Tweaks[K]) => {
    setTweaks((prev) => ({ ...prev, [key]: value }));
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tweaks));
  }, [tweaks]);

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute("data-theme", tweaks.dark ? "dark" : "light");
    root.setAttribute("data-density", tweaks.density);
    const accent = Array.isArray(tweaks.accent) ? tweaks.accent : [tweaks.accent];
    root.style.setProperty("--accent", accent[0]!);
    if (accent[1]) root.style.setProperty("--accent-deep", accent[1]);
  }, [tweaks]);

  return [tweaks, setTweak];
}
