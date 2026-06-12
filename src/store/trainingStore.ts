"use client";

import { create } from "zustand";

// Nhật ký đào tạo agent — entries do người dùng thêm lúc chạy (vd "Dạy Agent từ hội thoại" ở Inbox).
// Giữ trong bộ nhớ (không persist) để sống qua điều hướng client, hiển thị xen cùng log tĩnh ở TrainingLog.
// Không persist → tránh lệch hydrate (server render rỗng); reload sẽ về log tĩnh, đủ cho prototype.

export type TrainingMethod = "manager" | "daily" | "manual" | "conversation";

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

export const useTrainingStore = create<TrainingStore>((set, get) => ({
  added: [],
  addEntry: (entry) => set((s) => ({ added: [entry, ...s.added] })),
  hasConversation: (conversationId) => get().added.some((e) => e.conversationId === conversationId),
}));
