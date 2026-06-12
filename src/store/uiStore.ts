import { create } from "zustand";
import type { AgentConfigTab } from "@/components/agent-config/sections";
import { useSetupStore } from "@/store/setupStore";

// Kịch bản tự chạy khi mở chat: "payment" = agent gửi mã QR chốt đơn (M5);
// "suggestHandoff" = Manager gợi ý câu khách nói cho một tình huống bàn giao (M6, kèm nút Apply).
export type AgentChatScenario =
  | { kind: "payment"; nonce: number }
  | { kind: "suggestHandoff"; nonce: number; ruleKey: string; label: string; description?: string };

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
  // Tách màn chat ra cửa sổ nổi (iframe load route /agent-chat) thay cho side panel.
  agentChatPopped: boolean;
  setAgentChatPopped: (popped: boolean) => void;
  // Tin nhắn soạn sẵn đẩy vào ô nhập khi mở panel (vd "Train with Manager" từ M6).
  // nonce tăng mỗi lần đẩy để Composer/Panel nhận biết lần đẩy mới (kể cả cùng nội dung) mà không cần effect.
  agentChatDraft: { text: string; nonce: number } | null;
  pushAgentChatDraft: (text: string) => void;
  // Kịch bản tự chạy khi mở chat (vd "Kiểm tra với Agent" từ M5 → agent gửi mã QR chốt đơn).
  // nonce tăng mỗi lần kích để AgentChatContent nhận biết lần chạy mới.
  agentChatScenario: AgentChatScenario | null;
  startAgentChatTest: (kind: "payment") => void;
  // Mở chat + chạy kịch bản Manager gợi ý câu khách nói cho một tình huống bàn giao (M6).
  startHandoffSuggest: (payload: { ruleKey: string; label: string; description?: string }) => void;
  // Tab màn Quản lý đơn — đặt trên topbar (M2): "metrics" = chỉ số, "manage" = quản lý.
  ordersTab: "metrics" | "manage";
  setOrdersTab: (tab: "metrics" | "manage") => void;
  // Tab màn Sản phẩm — đặt trên topbar (M3): "overview" = tổng quan/chỉ số, "products" = danh mục.
  productsTab: "overview" | "products";
  setProductsTab: (tab: "overview" | "products") => void;
  // Tab màn Thanh toán — đặt trên topbar (M5): "metrics" = chỉ số (đọc), "collect" = thu tiền (thao tác).
  // Cổng thanh toán tách thành màn riêng (/payment-gateway) trong nhóm Cài đặt.
  paymentsTab: "metrics" | "collect";
  setPaymentsTab: (tab: "metrics" | "collect") => void;
  // Nhóm cấu hình Agent (M6) — composite list trên topbar điều khiển panel đang xem.
  agentConfigTab: AgentConfigTab;
  setAgentConfigTab: (tab: AgentConfigTab) => void;
  // Tab màn Thông tin shop — đặt trên topbar: "info" = hồ sơ shop, "channels" = kênh kết nối.
  shopTab: "info" | "channels";
  setShopTab: (tab: "info" | "channels") => void;
  // Tour hướng dẫn: id tour đang chờ chạy (đặt từ Onboarding / nút "Xem hướng dẫn"),
  // TourLauncher trong AppTour đọc cờ này rồi gọi start() và xoá cờ.
  pendingTourId: string | null;
  requestTour: (id: string) => void;
  clearPendingTour: () => void;
};

export const useUiStore = create<UiState>((set) => ({
  collapsed: false,
  toggleCollapsed: () => set((s) => ({ collapsed: !s.collapsed })),
  mobileOpen: false,
  setMobileOpen: (open) => set({ mobileOpen: open }),
  toggleMobile: () => set((s) => ({ mobileOpen: !s.mobileOpen })),
  agentChatOpen: false,
  setAgentChatOpen: (open) => {
    // Mở chat = đã "test thử với agent" — tick bước checklist "Bắt đầu nhanh".
    if (open) useSetupStore.getState().markAgentTested();
    set({ agentChatOpen: open });
  },
  toggleAgentChat: () => set((s) => ({ agentChatOpen: !s.agentChatOpen })),
  agentChatPopped: false,
  setAgentChatPopped: (popped) => set({ agentChatPopped: popped }),
  agentChatDraft: null,
  pushAgentChatDraft: (text) => set((s) => ({ agentChatDraft: { text, nonce: (s.agentChatDraft?.nonce ?? 0) + 1 } })),
  agentChatScenario: null,
  startAgentChatTest: (kind) => {
    // Mở chat = đã "test thử với agent" — tick bước checklist "Bắt đầu nhanh".
    useSetupStore.getState().markAgentTested();
    set((s) => ({ agentChatOpen: true, agentChatScenario: { kind, nonce: (s.agentChatScenario?.nonce ?? 0) + 1 } }));
  },
  startHandoffSuggest: (payload) =>
    set((s) => ({
      agentChatOpen: true,
      agentChatScenario: { kind: "suggestHandoff", nonce: (s.agentChatScenario?.nonce ?? 0) + 1, ...payload },
    })),
  ordersTab: "manage",
  setOrdersTab: (tab) => set({ ordersTab: tab }),
  productsTab: "products",
  setProductsTab: (tab) => set({ productsTab: tab }),
  paymentsTab: "collect",
  setPaymentsTab: (tab) => set({ paymentsTab: tab }),
  agentConfigTab: "identity",
  setAgentConfigTab: (tab) => set({ agentConfigTab: tab }),
  shopTab: "info",
  setShopTab: (tab) => set({ shopTab: tab }),
  pendingTourId: null,
  requestTour: (id) => set({ pendingTourId: id }),
  clearPendingTour: () => set({ pendingTourId: null }),
}));
