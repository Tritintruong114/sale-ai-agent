"use client";

import { useEffect } from "react";
import { type Tour, TourProvider, useTour } from "@/components/ui/tour";
import { useUiStore } from "@/store/uiStore";

// Tour hướng dẫn sau onboarding — đi qua 7 màn theo thứ tự SideNav.
// Mỗi bước spotlight một mục trên SideNav (luôn hiển thị ở mọi trang) qua data-tour-step-id,
// nextRoute/previousRoute đổi nội dung trang phía sau. Nhãn nút + nội dung tiếng Việt.
const GUIDE_TOUR: Tour = {
  id: "guide",
  steps: [
    {
      id: "nav-dashboard",
      title: "Dashboard",
      content:
        "Tổng quan trong ngày: agent tư vấn được bao nhiêu hội thoại, chốt bao nhiêu đơn, và việc nào đang cần bạn.",
      side: "right",
      nextRoute: "/inbox",
      nextLabel: "Tiếp",
    },
    {
      id: "nav-inbox",
      title: "Inbox hội thoại",
      content:
        "Mọi hội thoại agent đang trả lời khách. Ca “Hội thoại cần người” là lúc agent nhường bạn vào tiếp lời.",
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
        "Mọi đơn agent tạo từ hội thoại. “Đơn cần duyệt” chờ bạn xác nhận trước khi chốt.",
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
        "Kho hàng agent dùng để tư vấn và báo giá. Bạn cập nhật ở đây, agent trả lời khách theo đó.",
      side: "right",
      previousRoute: "/orders",
      previousLabel: "Quay lại",
      nextRoute: "/payments",
      nextLabel: "Tiếp",
    },
    {
      id: "nav-payments",
      title: "Thanh toán",
      content:
        "Tiền thu theo từng đơn. “Thanh toán cần duyệt” chờ bạn xác nhận trước khi agent gửi QR cho khách.",
      side: "right",
      previousRoute: "/products",
      previousLabel: "Quay lại",
      nextRoute: "/shop-info",
      nextLabel: "Tiếp",
    },
    {
      id: "nav-shop",
      title: "Thông tin shop",
      content:
        "Hồ sơ, chính sách và giờ giấc của shop — kiến thức nền agent dựa vào khi trả lời khách.",
      side: "right",
      previousRoute: "/payments",
      previousLabel: "Quay lại",
      nextRoute: "/agent-config",
      nextLabel: "Tiếp",
    },
    {
      id: "nav-agent",
      title: "Cấu hình Agent",
      content:
        "Chỉnh danh tính, cách bàn giao, tự học và thông báo — bạn quyết định agent làm việc thế nào.",
      side: "right",
      previousRoute: "/shop-info",
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
