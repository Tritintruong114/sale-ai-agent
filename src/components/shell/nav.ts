import {
  Bot,
  Database,
  GraduationCap,
  Inbox,
  LayoutDashboard,
  Package,
  ShoppingCart,
  Store,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { PENDING_COUNTS } from "@/data/counts";

export type NavItem = {
  href: string;
  label: string; // nhãn tiếng Việt đầy đủ
  icon: LucideIcon;
  badge?: number;
  tour?: string; // id bước tour (data-tour-step-id) để overlay highlight mục nav này
};

export type NavGroup = {
  label: string; // tiêu đề category trên SideNav
  items: NavItem[];
};

// Điều hướng gom theo category — §2 design.md.
// "Quản lý": việc vận hành hằng ngày. "Kết nối": nối hệ thống ngoài (cổng thanh toán, CRM bán hàng).
// "Cài đặt": cấu hình shop & agent (ngoài luồng demo chính).
// Kênh mạng xã hội (FB/Zalo) vẫn nằm trong "Thông tin shop" (mục Kênh kết nối) — đó là kênh hội thoại,
// khác với nhóm "Kết nối" ở đây (tích hợp backend bán hàng/thu tiền).
export const NAV_GROUPS: NavGroup[] = [
  {
    label: "Quản lý",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, tour: "nav-dashboard" },
      { href: "/inbox", label: "Inbox", icon: Inbox, badge: PENDING_COUNTS.handoff, tour: "nav-inbox" },
      { href: "/orders", label: "Đơn hàng", icon: ShoppingCart, badge: PENDING_COUNTS.bigOrders, tour: "nav-orders" },
      { href: "/products", label: "Sản phẩm", icon: Package, tour: "nav-products" },
      // "Giao dịch" đã gộp vào "Quản lý đơn" (thu tiền sống trong panel đơn) — bỏ mục nav riêng.
    ],
  },
  {
    label: "Agent",
    items: [
      { href: "/agent-config", label: "Cấu hình Agent", icon: Bot, tour: "nav-agent" },
      { href: "/playground", label: "Đào tạo Agent", icon: GraduationCap, tour: "nav-playground" },
    ],
  },
  {
    label: "Cài đặt",
    items: [
      { href: "/shop-info", label: "Thông tin shop", icon: Store, tour: "nav-shop" },
    ],
  },
  {
    label: "Kết nối",
    items: [
      { href: "/payment-gateway", label: "Cổng thanh toán", icon: Wallet },
      { href: "/crm", label: "Hệ thống CRM", icon: Database },
    ],
  },
];

// Danh sách phẳng mọi mục nav — TopBar dùng để suy tiêu đề màn từ route.
export const NAV_ITEMS: NavItem[] = NAV_GROUPS.flatMap((g) => g.items);

// Mục nav có khớp route hiện tại không (Dashboard khớp tuyệt đối, còn lại theo prefix).
export function isNavItemActive(item: NavItem, pathname: string): boolean {
  return item.href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(item.href);
}
