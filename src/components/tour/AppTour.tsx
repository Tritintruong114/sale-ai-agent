"use client";

import { useEffect } from "react";
import { type Tour, TourProvider, useTour } from "@/components/ui/tour";
import { useUiStore } from "@/store/uiStore";

// Tour hướng dẫn sau onboarding — đi qua 7 mục theo đúng thứ tự SideNav.
// Mỗi bước spotlight một mục trên SideNav (luôn hiển thị ở mọi trang) qua data-tour-step-id,
// nextRoute/previousRoute đổi nội dung trang phía sau. Nhãn nút + nội dung tiếng Việt.
const GUIDE_TOUR: Tour = {
  id: "guide",
  steps: [
    {
      id: "nav-dashboard",
      title: "Dashboard",
      content:
        "Nơi bạn nắm nhanh tình hình trong ngày: agent đã tư vấn bao nhiêu khách, chốt được bao nhiêu đơn, và còn việc gì đang chờ bạn.",
      side: "right",
      nextRoute: "/inbox",
      nextLabel: "Tiếp",
    },
    {
      id: "nav-inbox",
      title: "Inbox hội thoại",
      content:
        "Tất cả hội thoại agent đang trò chuyện với khách.",
      side: "right",
      previousRoute: "/dashboard",
      previousLabel: "Quay lại",
      nextRoute: "/orders",
      nextLabel: "Tiếp",
    },
    {
      id: "nav-orders",
      title: "Quản lý đơn",
      content:
        "Mọi đơn hàng agent tạo từ hội thoại với khách",
      side: "right",
      previousRoute: "/inbox",
      previousLabel: "Quay lại",
      nextRoute: "/products",
      nextLabel: "Tiếp",
    },
    {
      id: "nav-products",
      title: "Sản phẩm",
      content:
        "Đây là nguồn hàng agent dựa vào để tư vấn và báo giá cho khách.",
      side: "right",
      previousRoute: "/orders",
      previousLabel: "Quay lại",
      nextRoute: "/agent-config",
      nextLabel: "Tiếp",
    },
    {
      id: "nav-agent",
      title: "Cấu hình Agent",
      content:
        "Đây là nơi bạn quyết định agent là ai và làm việc ra sao: tên gọi, cách xưng hô với khách, khi nào bàn giao cho bạn.",
      side: "right",
      previousRoute: "/products",
      previousLabel: "Quay lại",
      nextRoute: "/playground",
      nextLabel: "Tiếp",
    },
    {
      id: "nav-playground",
      title: "Đào tạo Agent",
      content:
        "Nơi bạn thử chat với agent và liên tục đào tạo lại agent",
      side: "right",
      previousRoute: "/agent-config",
      previousLabel: "Quay lại",
      nextRoute: "/shop-info",
      nextLabel: "Tiếp",
    },
    {
      id: "nav-shop",
      title: "Thông tin shop",
      content:
        "Nơi bạn cập nhật thông tin shop: giới thiệu, chính sách và giờ mở cửa. Agent dựa vào thông tin này để tư vấn và trả lời khách hàng",
      side: "right",
      previousRoute: "/playground",
      previousLabel: "Quay lại",
      nextLabel: "Xong",
    },
  ],
};

const TOURS: Tour[] = [GUIDE_TOUR];

// Đọc cờ pendingTourId (đặt từ Onboarding / nút "Xem hướng dẫn") → start() rồi xoá cờ.
function TourLauncher() {
  const { start } = useTour();
  const pendingTourId = useUiStore((s) => s.pendingTourId);
  const clearPendingTour = useUiStore((s) => s.clearPendingTour);

  useEffect(() => {
    if (!pendingTourId) return;
    // Đợi 1 frame cho route mới + SideNav render xong rồi mới định vị overlay.
    const id = requestAnimationFrame(() => {
      start(pendingTourId);
      clearPendingTour();
    });
    return () => cancelAnimationFrame(id);
  }, [pendingTourId, start, clearPendingTour]);

  return null;
}

export function AppTour({ children }: { children: React.ReactNode }) {
  return (
    <TourProvider tours={TOURS}>
      <TourLauncher />
      {children}
    </TourProvider>
  );
}
