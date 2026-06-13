import { GraduationCap, KeyRound, ListChecks, MessageSquareWarning, UserRound, type LucideIcon } from "lucide-react";

// Nhóm cấu hình M6 — nguồn chung cho tab in-page trong AgentConfigScreen.
// Playground đã tách thành màn riêng (/playground, "Đào tạo Agent") — không còn là tab ở đây.
export type AgentConfigTab = "learning" | "training" | "handoff" | "identity" | "byok" | "notify";

// Tab Khoá API (BYOK) đang tạm ẩn — bật lại bằng cờ này.
export const AGENT_CONFIG_BYOK_ENABLED = false;

const ALL_SECTIONS: { key: AgentConfigTab; label: string; icon: LucideIcon }[] = [
  { key: "identity", label: "Danh tính", icon: UserRound },
  { key: "learning", label: "Học hằng ngày", icon: GraduationCap },
  { key: "handoff", label: "Bàn giao", icon: MessageSquareWarning },
  { key: "notify", label: "Thông báo", icon: ListChecks },
  // Tab Nhật ký đào tạo tạm ẩn — bỏ comment để bật lại.
  // { key: "training", label: "Nhật ký đào tạo", icon: History },
  { key: "byok", label: "Khoá API", icon: KeyRound },
];

export const AGENT_CONFIG_SECTIONS = ALL_SECTIONS.filter(
  (s) => s.key !== "byok" || AGENT_CONFIG_BYOK_ENABLED,
);
