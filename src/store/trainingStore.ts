"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

// Nhật ký đào tạo agent — entries do người dùng thêm lúc chạy (vd "Dạy Agent từ hội thoại" ở Inbox,
// hoặc "Re-train hội thoại" ở Playground). Persist localStorage → lưu thật, sống qua reload (dữ liệu thật),
// hiển thị xen cùng log tĩnh ở TrainingLog. Component đọc `added` dùng useHydrated để tránh lệch hydrate
// (server render rỗng, client mới có localStorage) — xem TrainingLog.

export type TrainingMethod = "playground" | "daily" | "inbox";

export type TrainingEntry = {
  id: string;
  at: string; // ISO không offset, vd "2026-06-11T09:24:00"
  method: TrainingMethod;
  by: string;
  scope: string;
  summary: string;
  files: string[];
  status: "done" | "running";
  conversationId?: string; // nguồn hội thoại (nếu thêm từ Inbox) — dùng để chống thêm trùng
};

type TrainingStore = {
  added: TrainingEntry[]; // mới nhất ở đầu mảng
  addEntry: (entry: TrainingEntry) => void;
  hasConversation: (conversationId: string) => boolean;
};

export const useTrainingStore = create<TrainingStore>()(
  persist(
    (set, get) => ({
      added: [],
      addEntry: (entry) => set((s) => ({ added: [entry, ...s.added] })),
      hasConversation: (conversationId) => get().added.some((e) => e.conversationId === conversationId),
    }),
    {
      name: "fanpage-training-log",
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ added: s.added }),
    },
  ),
);
