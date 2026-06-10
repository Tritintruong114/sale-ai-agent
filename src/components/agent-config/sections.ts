import { GraduationCap, KeyRound, ListChecks, MessageSquareWarning, UserRound, type LucideIcon } from "lucide-react";

// Nhóm cấu hình M6 — nguồn chung cho tab in-page trong AgentConfigScreen.
// "threshold" (Ngưỡng tự chốt) tạm ẩn — sẽ bật lại sau.
export type AgentConfigTab = "learning" | "handoff" | "identity" | "byok" | "notify";

export const AGENT_CONFIG_SECTIONS: { key: AgentConfigTab; label: string; icon: LucideIcon }[] = [
  { key: "learning", label: "Học hằng ngày", icon: GraduationCap },
  { key: "handoff", label: "Bàn giao", icon: MessageSquareWarning },
  { key: "identity", label: "Danh tính", icon: UserRound },
  { key: "byok", label: "Khoá AI", icon: KeyRound },
  { key: "notify", label: "Thông báo", icon: ListChecks },
];
