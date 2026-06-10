import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

// Trạng thái nguyên mẫu của Dashboard — công cụ demo/review, chuyển nhanh giữa các
// trạng thái dữ liệu mà không đổi route. Lưu localStorage để giữ lựa chọn qua reload.
export type PrototypeMode = "static" | "empty" | "realtime";

type PrototypeState = {
  mode: PrototypeMode;
  setMode: (mode: PrototypeMode) => void;
  // Đếm số lần "chạy lại" chế độ thời gian thực — đổi giá trị để buộc realtime khởi động từ rỗng.
  // Để ở store (thay vì state cục bộ Dashboard) nên công cụ điều khiển ngoài Dashboard (sidebar) gọi được.
  restartNonce: number;
  restart: () => void;
};

export const usePrototypeStore = create<PrototypeState>()(
  persist(
    (set) => ({
      mode: "static",
      setMode: (mode) => set({ mode }),
      restartNonce: 0,
      restart: () => set((s) => ({ restartNonce: s.restartNonce + 1 })),
    }),
    {
      name: "fanpage-prototype-state",
      storage: createJSONStorage(() => localStorage),
      // Chỉ lưu lựa chọn chế độ; restartNonce là phiên làm việc nên không persist.
      partialize: (s) => ({ mode: s.mode }),
    },
  ),
);
