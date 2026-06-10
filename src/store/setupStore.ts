import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

// Thiết lập ban đầu của shop — nguồn sự thật cho checklist "Bắt đầu nhanh" trên SideNav.
// Cũng giữ trạng thái nối cổng thanh toán (PaymentSettings đọc/ghi tại đây) để checklist
// phản ánh đúng thực tế. Persist qua reload; "Chạy lại Onboarding" / xong Onboarding gọi reset().
type SetupState = {
  // Cổng thanh toán đã nối (mock OAuth). Mặc định chưa nối cổng nào — để bước "Kết nối" là việc thật.
  gateways: Record<string, boolean>;
  setGateway: (key: string, connected: boolean) => void;
  // Đã chat thử với agent ít nhất một lần.
  agentTested: boolean;
  markAgentTested: () => void;
  // Chủ shop chủ động ẩn checklist.
  dismissed: boolean;
  dismiss: () => void;
  // Bắt đầu lại từ đầu (sau Onboarding / chạy lại Onboarding).
  reset: () => void;
};

const INITIAL_GATEWAYS: Record<string, boolean> = { sepay: false, vnpay: false, momo: false };

export const useSetupStore = create<SetupState>()(
  persist(
    (set) => ({
      gateways: { ...INITIAL_GATEWAYS },
      setGateway: (key, connected) => set((s) => ({ gateways: { ...s.gateways, [key]: connected } })),
      agentTested: false,
      markAgentTested: () => set({ agentTested: true }),
      dismissed: false,
      dismiss: () => set({ dismissed: true }),
      reset: () => set({ gateways: { ...INITIAL_GATEWAYS }, agentTested: false, dismissed: false }),
    }),
    { name: "fanpage-setup-state", storage: createJSONStorage(() => localStorage) },
  ),
);
