import { create } from "zustand";
import type { AgentConfigTab } from "@/components/agent-config/sections";

// Trạng thái khung ứng dụng — SideNav: thu gọn trên desktop + drawer trên mobile.
type UiState = {
  // Thu gọn SideNav trên desktop (icon-only). Mặc định mở rộng.
  collapsed: boolean;
  toggleCollapsed: () => void;
  // Drawer trên mobile (mặc định đóng).
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
  toggleMobile: () => void;
  // Side panel chat với Agent (trượt từ phải).
  agentChatOpen: boolean;
  setAgentChatOpen: (open: boolean) => void;
  toggleAgentChat: () => void;
  // Tin nhắn soạn sẵn đẩy vào ô nhập khi mở panel (vd "Train with Manager" từ M6).
  // nonce tăng mỗi lần đẩy để Composer/Panel nhận biết lần đẩy mới (kể cả cùng nội dung) mà không cần effect.
  agentChatDraft: { text: string; nonce: number } | null;
  pushAgentChatDraft: (text: string) => void;
  // Tab màn Quản lý đơn — đặt trên topbar (M2): "metrics" = chỉ số, "manage" = quản lý.
  ordersTab: "metrics" | "manage";
  setOrdersTab: (tab: "metrics" | "manage") => void;
  // Tab màn Sản phẩm — đặt trên topbar (M3): "overview" = tổng quan/chỉ số, "products" = danh mục.
  productsTab: "overview" | "products";
  setProductsTab: (tab: "overview" | "products") => void;
  // Tab màn Thanh toán — đặt trên topbar (M5): "metrics" = chỉ số (đọc), "collect" = thu tiền (thao tác),
  // "settings" = cài đặt (cổng thanh toán + tự động tạo QR).
  paymentsTab: "metrics" | "collect" | "settings";
  setPaymentsTab: (tab: "metrics" | "collect" | "settings") => void;
  // Nhóm cấu hình Agent (M6) — composite list trên topbar điều khiển panel đang xem.
  agentConfigTab: AgentConfigTab;
  setAgentConfigTab: (tab: AgentConfigTab) => void;
};

export const useUiStore = create<UiState>((set) => ({
  collapsed: false,
  toggleCollapsed: () => set((s) => ({ collapsed: !s.collapsed })),
  mobileOpen: false,
  setMobileOpen: (open) => set({ mobileOpen: open }),
  toggleMobile: () => set((s) => ({ mobileOpen: !s.mobileOpen })),
  agentChatOpen: false,
  setAgentChatOpen: (open) => set({ agentChatOpen: open }),
  toggleAgentChat: () => set((s) => ({ agentChatOpen: !s.agentChatOpen })),
  agentChatDraft: null,
  pushAgentChatDraft: (text) => set((s) => ({ agentChatDraft: { text, nonce: (s.agentChatDraft?.nonce ?? 0) + 1 } })),
  ordersTab: "manage",
  setOrdersTab: (tab) => set({ ordersTab: tab }),
  productsTab: "products",
  setProductsTab: (tab) => set({ productsTab: tab }),
  paymentsTab: "collect",
  setPaymentsTab: (tab) => set({ paymentsTab: tab }),
  agentConfigTab: "learning",
  setAgentConfigTab: (tab) => set({ agentConfigTab: tab }),
}));
