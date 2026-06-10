import { GraduationCap, History, KeyRound, ListChecks, MessageSquareWarning, UserRound, type LucideIcon } from "lucide-react";

// Nhóm cấu hình M6 — nguồn chung cho tab in-page trong AgentConfigScreen.
export type AgentConfigTab = "learning" | "training" | "handoff" | "identity" | "byok" | "notify";

export const AGENT_CONFIG_SECTIONS: { key: AgentConfigTab; label: string; icon: LucideIcon }[] = [
  { key: "identity", label: "Danh tính", icon: UserRound },
  { key: "learning", label: "Học hằng ngày", icon: GraduationCap },
  { key: "handoff", label: "Bàn giao", icon: MessageSquareWarning },
  { key: "notify", label: "Thông báo", icon: ListChecks },
  { key: "training", label: "Nhật ký đào tạo", icon: History },
  { key: "byok", label: "Khoá API", icon: KeyRound },
];
