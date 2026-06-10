import {
  Bot,
  CreditCard,
  Inbox,
  LayoutDashboard,
  Package,
  Radio,
  ShoppingCart,
  Store,
  type LucideIcon,
} from "lucide-react";
import { PENDING_COUNTS } from "@/data/counts";

export type NavItem = {
  href: string;
  label: string; // nhãn tiếng Việt đầy đủ — dùng cho drawer mobile
  short: string; // nhãn tiếng Anh 1 từ — dùng cho top-bar
  code: string; // mã màn theo roadmap (M1–M6)
  icon: LucideIcon;
  badge?: number;
  tour?: string; // id bước tour (data-tour-step-id) để overlay highlight mục nav này
};

// 6 màn V0 theo roadmap. Dashboard là tab mặc định.
export const PRIMARY_NAV: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", short: "Dashboard", code: "M4", icon: LayoutDashboard, tour: "nav-dashboard" },
  { href: "/inbox", label: "Inbox hội thoại", short: "Inbox", code: "M1", icon: Inbox, badge: PENDING_COUNTS.handoff, tour: "nav-inbox" },
  { href: "/orders", label: "Quản lý đơn", short: "Orders", code: "M2", icon: ShoppingCart, badge: PENDING_COUNTS.bigOrders, tour: "nav-orders" },
  { href: "/products", label: "Sản phẩm", short: "Products", code: "M3", icon: Package, tour: "nav-products" },
  { href: "/payments", label: "Thanh toán", short: "Payments", code: "M5", icon: CreditCard, badge: PENDING_COUNTS.payments, tour: "nav-payments" },
  { href: "/shop-info", label: "Thông tin shop", short: "Shop", code: "—", icon: Store, tour: "nav-shop" },
  { href: "/agent-config", label: "Cấu hình Agent", short: "Agent", code: "M6", icon: Bot, tour: "nav-agent" },
];

// Nhóm "Cài đặt" — ngoài luồng demo chính, không xoá.
export const SETTINGS_NAV: NavItem[] = [
  { href: "/settings/channels", label: "Kênh", short: "Channels", code: "—", icon: Radio },
];
