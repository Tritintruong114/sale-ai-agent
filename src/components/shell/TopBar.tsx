"use client";

import { usePathname } from "next/navigation";
import { BarChart3, ClipboardList, FlaskConical, Menu, MessageSquare, Package, Radio, ScrollText, Sparkles, Store } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PENDING_COUNTS } from "@/data/counts";
import { useUiStore } from "@/store/uiStore";
import { AGENT_CONFIG_SECTIONS, type AgentConfigTab } from "@/components/agent-config/sections";
import { PLAYGROUND_HIDE_AGENT_CHAT } from "@/components/agent-config/playgroundMeta";
import { NAV_ITEMS, isNavItemActive } from "./nav";
import { PRODUCTS_OVERVIEW_ENABLED } from "@/components/products/meta";
import { ORDERS_METRICS_ENABLED } from "@/components/orders/meta";
import { DASHBOARD_MORE_INSIGHTS_ENABLED, MORE_INSIGHTS } from "@/components/dashboard/meta";
import { TOPBAR_BANNER_SLOT_ID } from "./TopbarBannerSlot";

// Prefix route tạm ẩn nút "Talk to Agent": Cấu hình Agent, Thông tin shop, các màn kết nối (Integrations).
const HIDE_AGENT_CHAT_PREFIXES = ["/agent-config", "/shop-info", "/payment-gateway", "/crm", "/products", "/orders", "/inbox"];

// Tiêu đề màn suy từ route (NAV_ITEMS — danh sách phẳng mọi mục nav) — §2 design.md.
function pageTitle(pathname: string): string {
  const match = NAV_ITEMS
    .filter((i) => isNavItemActive(i, pathname))
    .sort((a, b) => b.href.length - a.href.length)[0];
  return match?.label ?? "Sale AI Agent";
}

export function TopBar() {
  const pathname = usePathname();
  const toggleMobile = useUiStore((s) => s.toggleMobile);
  const toggleAgentChat = useUiStore((s) => s.toggleAgentChat);
  const setAgentChatOpen = useUiStore((s) => s.setAgentChatOpen);
  const pushAgentChatDraft = useUiStore((s) => s.pushAgentChatDraft);
  const ordersTab = useUiStore((s) => s.ordersTab);
  const setOrdersTab = useUiStore((s) => s.setOrdersTab);
  const productsTab = useUiStore((s) => s.productsTab);
  const setProductsTab = useUiStore((s) => s.setProductsTab);
  const agentConfigTab = useUiStore((s) => s.agentConfigTab);
  const setAgentConfigTab = useUiStore((s) => s.setAgentConfigTab);
  const shopTab = useUiStore((s) => s.shopTab);
  const setShopTab = useUiStore((s) => s.setShopTab);
  const playgroundTab = useUiStore((s) => s.playgroundTab);
  const setPlaygroundTab = useUiStore((s) => s.setPlaygroundTab);

  // Màn Quản lý đơn (M2) tách 2 tab ngay trên topbar: "Chỉ số" (đọc) ↔ "Quản lý" (thao tác).
  const isOrders = pathname.startsWith("/orders");
  // Màn Sản phẩm (M3) tách 2 tab ngay trên topbar: "Tổng quan" (đọc) ↔ "Sản phẩm" (thao tác).
  const isProducts = pathname.startsWith("/products");
  // Màn Cấu hình Agent (M6): 5 nhóm cấu hình tách thành segmented tabs ngay trên topbar; cuộn ngang khi hẹp.
  const isAgentConfig = pathname.startsWith("/agent-config");
  // Màn Thông tin shop: tách 2 tab — "Thông tin shop" (hồ sơ) ↔ "Kênh kết nối".
  const isShopInfo = pathname.startsWith("/shop-info");
  // Màn Đào tạo Agent (Playground) — tách riêng khỏi Cấu hình Agent; topbar hiển thị tab "Playground".
  const isPlayground = pathname.startsWith("/playground");
  // Dashboard: nút chat đổi thành "More Insights" — mở chat + điền sẵn prompt xin agent phân tích số liệu.
  const showMoreInsights = pathname === "/dashboard" && DASHBOARD_MORE_INSIGHTS_ENABLED;
  // Các màn tạm ẩn nút "Talk to Agent" trên topbar: Cấu hình Agent, Thông tin shop, các màn kết nối (Integrations).
  const hideAgentChat =
    (isPlayground && PLAYGROUND_HIDE_AGENT_CHAT) ||
    HIDE_AGENT_CHAT_PREFIXES.some((p) => pathname.startsWith(p));

  // Bấm "More Insights": mở panel chat rồi đẩy prompt vào ô nhập (chủ shop tự gửi).
  const openMoreInsights = () => {
    setAgentChatOpen(true);
    pushAgentChatDraft(MORE_INSIGHTS.prompt);
  };

  return (
    <>
    <header className="flex h-14 shrink-0 items-center gap-2 border-b bg-card px-4 md:px-6">
      {/* Mở drawer trên mobile */}
      <Button
        variant="ghost"
        size="icon-sm"
        className="md:hidden"
        onClick={toggleMobile}
        aria-label="Mở menu điều hướng"
      >
        <Menu />
      </Button>

      {/* Màn Cấu hình: 5 nhóm = segmented tabs. Màn Orders: Chỉ số / Quản lý. Màn khác: tiêu đề suy từ route. */}
      {isAgentConfig ? (
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <h1 className="sr-only">{pageTitle(pathname)}</h1>
          {/* Nhiều nhánh → wrapper min-w-0 + overflow-x-auto để cuộn ngang gọn trên màn hẹp thay vì tràn.
              py-2: overflow-x ép overflow-y=auto → chừa chỗ cho gạch chân (after:bottom-[-5px]) khỏi bị cắt. */}
          <div className="min-w-0 flex-1 overflow-x-auto py-2">
            <Tabs value={agentConfigTab} onValueChange={(v) => setAgentConfigTab(v as AgentConfigTab)}>
              <TabsList variant="line" className="gap-3 px-0">
                {AGENT_CONFIG_SECTIONS.map((s) => {
                  const Icon = s.icon;
                  return (
                    <TabsTrigger key={s.key} value={s.key} className="flex-none gap-1.5 px-0">
                      <Icon aria-hidden />
                      {s.label}
                    </TabsTrigger>
                  );
                })}
              </TabsList>
            </Tabs>
          </div>
        </div>
      ) : isOrders ? (
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <h1 className="sr-only">{pageTitle(pathname)}</h1>
          <Tabs value={ordersTab} onValueChange={(v) => setOrdersTab(v as "metrics" | "manage")}>
            <TabsList variant="line" className="gap-3 px-0">
              {/* Tab Chỉ số tạm ẩn — bật lại bằng ORDERS_METRICS_ENABLED (orders/meta.ts). */}
              {ORDERS_METRICS_ENABLED ? (
                <TabsTrigger value="metrics" className="flex-none gap-1.5 px-0">
                  <BarChart3 aria-hidden />
                  Chỉ số
                </TabsTrigger>
              ) : null}
              <TabsTrigger value="manage" className="flex-none gap-1.5 px-0">
                <ClipboardList aria-hidden />
                Quản lý
                {PENDING_COUNTS.bigOrders > 0 ? (
                  <span className="ml-0.5 inline-flex min-w-4 items-center justify-center rounded-full bg-amber-100 px-1 text-[10px] font-semibold tabular-nums text-amber-700">
                    {PENDING_COUNTS.bigOrders}
                  </span>
                ) : null}
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      ) : isProducts ? (
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <h1 className="sr-only">{pageTitle(pathname)}</h1>
          <Tabs value={productsTab} onValueChange={(v) => setProductsTab(v as "overview" | "products")}>
            <TabsList variant="line" className="gap-3 px-0">
              {/* Tab Tổng quan tạm ẩn — bật lại bằng PRODUCTS_OVERVIEW_ENABLED (products/meta.ts). */}
              {PRODUCTS_OVERVIEW_ENABLED ? (
                <TabsTrigger value="overview" className="flex-none gap-1.5 px-0">
                  <BarChart3 aria-hidden />
                  Tổng quan
                </TabsTrigger>
              ) : null}
              <TabsTrigger value="products" className="flex-none gap-1.5 px-0">
                <Package aria-hidden />
                Sản phẩm
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      ) : isShopInfo ? (
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <h1 className="sr-only">{pageTitle(pathname)}</h1>
          <Tabs value={shopTab} onValueChange={(v) => setShopTab(v as "info" | "channels")}>
            <TabsList variant="line" className="gap-3 px-0">
              <TabsTrigger value="info" className="flex-none gap-1.5 px-0">
                <Store aria-hidden />
                Thông tin shop
              </TabsTrigger>
              <TabsTrigger value="channels" className="flex-none gap-1.5 px-0">
                <Radio aria-hidden />
                Kênh kết nối
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      ) : isPlayground ? (
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <h1 className="sr-only">{pageTitle(pathname)}</h1>
          <Tabs value={playgroundTab} onValueChange={(v) => setPlaygroundTab(v as "train" | "history")}>
            <TabsList variant="line" className="gap-3 px-0">
              <TabsTrigger value="train" className="flex-none gap-1.5 px-0">
                <FlaskConical aria-hidden />
                Đào tạo
              </TabsTrigger>
              <TabsTrigger value="history" className="flex-none gap-1.5 px-0">
                <ScrollText aria-hidden />
                Lịch sử
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      ) : (
        <h1 className="min-w-0 flex-1 truncate text-sm font-semibold sm:text-base">{pageTitle(pathname)}</h1>
      )}

      <div className="ml-auto flex shrink-0 items-center gap-2">
        {showMoreInsights ? (
          // Dashboard: mở chat + đẩy sẵn prompt xin agent phân tích sâu số liệu trong ngày.
          <Button
            variant="outline"
            size="sm"
            onClick={openMoreInsights}
            className="gap-1.5"
            title="Hỏi agent phân tích sâu số liệu hôm nay"
          >
            <Sparkles className="size-4" aria-hidden />
            <span className="hidden sm:inline">{MORE_INSIGHTS.label}</span>
          </Button>
        ) : hideAgentChat ? null : (
          // Mở side panel trò chuyện với Agent
          <Button
            variant="outline"
            size="sm"
            onClick={toggleAgentChat}
            className="gap-1.5"
            title="Trò chuyện với trợ lý của bạn"
          >
            <MessageSquare className="size-4" aria-hidden />
            <span className="hidden sm:inline">Talk to Agent</span>
          </Button>
        )}
      </div>
    </header>
    {/* Slot banner dưới topbar — màn đẩy nội dung vào qua TopbarBannerSlot (§6.7). Rỗng thì không chiếm chỗ. */}
    <div id={TOPBAR_BANNER_SLOT_ID} className="shrink-0 empty:hidden" />
    </>
  );
}
