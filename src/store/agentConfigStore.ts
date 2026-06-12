"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { DEFAULT_CONFIG, type AgentConfig, type HandoffRule } from "@/data/config";

type AgentConfigStore = {
  config: AgentConfig;
  setConfig: (patch: Partial<AgentConfig>) => void;
  resetToDefault: () => void;
};

// Config lưu từ phiên cũ có thể thiếu field handoff mới (description/triggerPhrases).
// Backfill từ DEFAULT_CONFIG theo key để tránh vỡ render sau khi nâng cấp.
function normalizeHandoffRules(rules: HandoffRule[] | undefined): HandoffRule[] {
  if (!Array.isArray(rules)) return DEFAULT_CONFIG.handoffRules;
  return rules.map((r) => {
    const base = DEFAULT_CONFIG.handoffRules.find((d) => d.key === r.key);
    return {
      ...r,
      description: r.description ?? base?.description ?? "",
      triggerPhrases: r.triggerPhrases ?? base?.triggerPhrases ?? [],
      thresholdUnit: r.thresholdUnit ?? base?.thresholdUnit,
    };
  });
}

// Nguồn sự thật chung — Onboarding & M6 cùng ghi, M1/M2/M4 cùng đọc.
// Persist localStorage: cấu hình user nhập ở onboarding sống qua reload để agent (chat) đọc đúng
// shop thật thay vì DEFAULT_CONFIG. Component đọc giá trị phụ thuộc localStorage nên dùng useHydrated
// để tránh lệch hydration (xem src/lib/useHydrated.ts).
export const useAgentConfig = create<AgentConfigStore>()(
  persist(
    (set) => ({
      config: DEFAULT_CONFIG,
      setConfig: (patch) => set((s) => ({ config: { ...s.config, ...patch } })),
      resetToDefault: () => set({ config: DEFAULT_CONFIG }),
    }),
    {
      name: "fanpage-agent-config",
      storage: createJSONStorage(() => localStorage),
      // Chỉ lưu config; các hàm setter không cần persist.
      partialize: (s) => ({ config: s.config }),
      // Backfill field handoff mới cho config lưu từ phiên cũ.
      merge: (persisted, current) => {
        const saved = (persisted as { config?: AgentConfig })?.config;
        if (!saved) return current;
        return {
          ...current,
          config: { ...saved, handoffRules: normalizeHandoffRules(saved.handoffRules) },
        };
      },
    },
  ),
);
