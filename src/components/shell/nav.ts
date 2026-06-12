import {
  Bot,
  CreditCard,
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
// "Quản lý": việc vận hành hằng ngày. "Cài đặt": cấu hình shop & agent (ngoài luồng demo chính).
// Kênh kết nối đã gộp vào "Thông tin shop" (mục Kênh kết nối) nên không còn mục nav riêng.
export const NAV_GROUPS: NavGroup[] = [
  {
    label: "Quản lý",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, tour: "nav-dashboard" },
      { href: "/inbox", label: "Inbox hội thoại", icon: Inbox, badge: PENDING_COUNTS.handoff, tour: "nav-inbox" },
      { href: "/orders", label: "Quản lý đơn", icon: ShoppingCart, badge: PENDING_COUNTS.bigOrders, tour: "nav-orders" },
      { href: "/products", label: "Sản phẩm", icon: Package, tour: "nav-products" },
      { href: "/payments", label: "Giao dịch", icon: CreditCard, badge: PENDING_COUNTS.payments, tour: "nav-payments" },
    ],
  },
  {
    label: "Cài đặt",
    items: [
      { href: "/shop-info", label: "Thông tin shop", icon: Store, tour: "nav-shop" },
      { href: "/agent-config", label: "Cấu hình Agent", icon: Bot, tour: "nav-agent" },
      { href: "/payment-gateway", label: "Cổng thanh toán", icon: Wallet },
    ],
  },
];

// Danh sách phẳng mọi mục nav — TopBar dùng để suy tiêu đề màn từ route.
export const NAV_ITEMS: NavItem[] = NAV_GROUPS.flatMap((g) => g.items);
