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
        "Nơi bạn nắm nhanh tình hình trong ngày: agent đã tư vấn bao nhiêu khách, chốt được bao nhiêu đơn, và còn việc gì đang chờ bạn.",
      side: "right",
      nextRoute: "/inbox",
      nextLabel: "Tiếp",
    },
    {
      id: "nav-inbox",
      title: "Inbox hội thoại",
      content:
        "Tất cả hội thoại agent đang trò chuyện với khách đều nằm ở đây. Khi thấy nhãn “Cần bạn trả lời”, đó là lúc agent nhường để bạn trực tiếp nói với khách.",
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
        "Mọi đơn agent tạo từ hội thoại với khách đều ở đây. Những đơn gắn nhãn “Đơn cần duyệt” đang chờ bạn xác nhận trước khi chốt.",
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
        "Đây là nguồn hàng agent dựa vào để tư vấn và báo giá cho khách. Bạn cập nhật sản phẩm và giá ở đây, agent sẽ trả lời khách theo đúng như vậy.",
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
        "Đây là nơi bạn theo dõi doanh thu theo từng đơn. Khoản gắn nhãn “Thanh toán cần duyệt” đang chờ bạn xác nhận trước khi agent gửi mã QR cho khách.",
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
        "Nơi bạn cập nhật thông tin shop: giới thiệu, chính sách và giờ mở cửa. Agent dựa vào đây để trả lời khách cho đúng và sát với shop.",
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
        "Đây là nơi bạn quyết định agent là ai và làm việc ra sao: tên gọi, cách xưng hô với khách, khi nào nhường lại cho bạn, và duyệt điều agent học được mỗi ngày.",
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
