// Top-level shell — routing between the five Looma views + tweaks.
import { useState } from "react";
import { Sidebar, TopBar } from "./components/Sidebar";
import { TweaksPanel } from "./components/TweaksPanel";
import { Icons } from "./components/Icons";
import { useTweaks } from "./hooks/useTweaks";
import { Dashboard } from "./views/Dashboard";
import { Studio } from "./views/Studio";
import { Editor } from "./views/Editor";
import { VideoAgent } from "./views/VideoAgent";
import { Assets } from "./views/Assets";

export type Route = "inspire" | "studio" | "editor" | "video" | "assets";

const SECTION_LABEL: Record<Route, string> = {
  inspire: "灵感",
  studio: "工作室",
  editor: "编辑器",
  video: "视频代理",
  assets: "素材库",
};

export function App() {
  const [tweaks, setTweak] = useTweaks();
  const [route, setRoute] = useState<Route>("inspire");

  const projectName =
    route === "inspire" ? "Spring 2026"
      : route === "video" ? "春装亚麻 · 短视频"
        : "春装亚麻系列";

  return (
    <div className="app" data-screen-label={`00 ${SECTION_LABEL[route]}`}>
      <Sidebar current={route} onNav={setRoute} />

      <div className="workspace">
        <TopBar
          section={SECTION_LABEL[route]}
          projectName={projectName}
          status={route === "studio" ? "正在生成 · Atelier 待命" : undefined}
        />

        {route === "inspire" && <Dashboard onOpen={setRoute} />}
        {route === "studio" && <Studio />}
        {route === "editor" && <Editor />}
        {route === "video" && <VideoAgent />}
        {route === "assets" && <Assets />}
      </div>

      {route !== "studio" && (
        <button className="frap" onClick={() => setRoute("studio")} title="开始拍摄">
          <span className="frap-ring" aria-hidden="true" />
          <Icons.Sparkle />
          <span className="frap-label">拍一组 →</span>
        </button>
      )}

      <TweaksPanel tweaks={tweaks} setTweak={setTweak} route={route} onRoute={setRoute} />
    </div>
  );
}
