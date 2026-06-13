import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

// Thiết lập ban đầu của shop — nguồn sự thật cho checklist "Bắt đầu nhanh" trên SideNav.
// Cũng giữ trạng thái nối cổng thanh toán (PaymentSettings đọc/ghi tại đây) để checklist
// phản ánh đúng thực tế. Persist qua reload; "Chạy lại Onboarding" / xong Onboarding gọi reset().
type SetupState = {
  // Cổng thanh toán đã nối (mock OAuth). Mặc định chưa nối cổng nào — để bước "Kết nối" là việc thật.
  gateways: Record<string, boolean>;
  setGateway: (key: string, connected: boolean) => void;
  // Hệ thống CRM / quản lý bán hàng đã nối (mock OAuth) — KiotViet, Sapo, Haravan…
  crms: Record<string, boolean>;
  setCrm: (key: string, connected: boolean) => void;
  // Đã chat thử với agent ít nhất một lần.
  agentTested: boolean;
  markAgentTested: () => void;
  // Chủ shop chủ động ẩn checklist.
  dismissed: boolean;
  dismiss: () => void;
  // Welcome sau Onboarding: bật cờ để hiện modal chào mừng (2 lựa chọn xem/bỏ qua hướng dẫn).
  // Không tự chạy tour nữa — để người dùng tự chọn (không force).
  welcomePending: boolean;
  showWelcome: () => void;
  dismissWelcome: () => void;
  // Bắt đầu lại từ đầu (sau Onboarding / chạy lại Onboarding).
  reset: () => void;
};

const INITIAL_GATEWAYS: Record<string, boolean> = { sepay: false, vnpay: false, momo: false };
// Mặc định nối sẵn KiotViet để demo kết nối CRM (đơn hiện mã đơn ngoài ở mục Hoạt động). Đổi/ngắt ở /crm.
const INITIAL_CRMS: Record<string, boolean> = { kiotviet: true, sapo: false, haravan: false };

export const useSetupStore = create<SetupState>()(
  persist(
    (set) => ({
      gateways: { ...INITIAL_GATEWAYS },
      setGateway: (key, connected) => set((s) => ({ gateways: { ...s.gateways, [key]: connected } })),
      crms: { ...INITIAL_CRMS },
      setCrm: (key, connected) => set((s) => ({ crms: { ...s.crms, [key]: connected } })),
      agentTested: false,
      markAgentTested: () => set({ agentTested: true }),
      dismissed: false,
      dismiss: () => set({ dismissed: true }),
      welcomePending: false,
      showWelcome: () => set({ welcomePending: true }),
      dismissWelcome: () => set({ welcomePending: false }),
      reset: () =>
        set({
          gateways: { ...INITIAL_GATEWAYS },
          crms: { ...INITIAL_CRMS },
          agentTested: false,
          dismissed: false,
          welcomePending: false,
        }),
    }),
    {
      name: "fanpage-setup-state",
      // v1: bật sẵn KiotViet cho localStorage cũ (trước đó crms toàn false) để demo CRM hiện ngay.
      version: 1,
      migrate: (persisted, from) =>
        from < 1 ? { ...(persisted as SetupState), crms: { ...INITIAL_CRMS } } : (persisted as SetupState),
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
