"use client";

import { create } from "zustand";
import { DEFAULT_CONFIG, type AgentConfig } from "@/data/config";

type AgentConfigStore = {
  config: AgentConfig;
  setConfig: (patch: Partial<AgentConfig>) => void;
  resetToDefault: () => void;
};

// Nguồn sự thật chung — Onboarding & M6 cùng ghi, M1/M2/M4 cùng đọc.
export const useAgentConfig = create<AgentConfigStore>((set) => ({
  config: DEFAULT_CONFIG,
  setConfig: (patch) => set((s) => ({ config: { ...s.config, ...patch } })),
  resetToDefault: () => set({ config: DEFAULT_CONFIG }),
}));
