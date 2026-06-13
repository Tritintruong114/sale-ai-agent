"use client";

import { useUiStore } from "@/store/uiStore";
import { PlaygroundPanel } from "./PlaygroundPanel";
import { TrainingLog } from "./TrainingLog";

// Màn Đào tạo Agent (/playground) — 2 tab trên topbar (uiStore.playgroundTab):
// "train" = sân thử chat · "history" = bảng lịch sử các lần agent được đào tạo (TrainingLog có sẵn).
export function PlaygroundScreen() {
  const tab = useUiStore((s) => s.playgroundTab);

  if (tab === "history") {
    return <TrainingLog />;
  }

  return <PlaygroundPanel />;
}
