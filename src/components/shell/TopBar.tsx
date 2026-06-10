"use client";

import { usePathname } from "next/navigation";
import { BarChart3, ClipboardList, Menu, MessageSquare, Package, Settings, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { PENDING_COUNTS } from "@/data/counts";
import { useUiStore } from "@/store/uiStore";
import { useAgentConfig } from "@/store/agentConfigStore";
import { AGENT_CONFIG_SECTIONS, type AgentConfigTab } from "@/components/agent-config/sections";
import { PRIMARY_NAV, SETTINGS_NAV } from "./nav";
import { TOPBAR_BANNER_SLOT_ID } from "./TopbarBannerSlot";

// Tiêu đề màn suy từ route (PRIMARY_NAV + SETTINGS_NAV) — §2 design.md.
function pageTitle(pathname: string): string {
  const all = [...PRIMARY_NAV, ...SETTINGS_NAV];
  const match = all
    .filter((i) => (i.href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(i.href)))
    .sort((a, b) => b.href.length - a.href.length)[0];
  return match?.label ?? "Fanpage AI Agent";
}

export function TopBar() {
  const pathname = usePathname();
  const agentEnabled = useAgentConfig((s) => s.config.agentEnabled);
  const toggleMobile = useUiStore((s) => s.toggleMobile);
  const toggleAgentChat = useUiStore((s) => s.toggleAgentChat);
  const ordersTab = useUiStore((s) => s.ordersTab);
  const setOrdersTab = useUiStore((s) => s.setOrdersTab);
  const productsTab = useUiStore((s) => s.productsTab);
  const setProductsTab = useUiStore((s) => s.setProductsTab);
  const paymentsTab = useUiStore((s) => s.paymentsTab);
  const setPaymentsTab = useUiStore((s) => s.setPaymentsTab);
  const agentConfigTab = useUiStore((s) => s.agentConfigTab);
  const setAgentConfigTab = useUiStore((s) => s.setAgentConfigTab);

  // Màn Quản lý đơn (M2) tách 2 tab ngay trên topbar: "Chỉ số" (đọc) ↔ "Quản lý" (thao tác).
  const isOrders = pathname.startsWith("/orders");
  // Màn Sản phẩm (M3) tách 2 tab ngay trên topbar: "Tổng quan" (đọc) ↔ "Sản phẩm" (thao tác).
  const isProducts = pathname.startsWith("/products");
  // Màn Thanh toán (M5) tách 2 tab ngay trên topbar: "Chỉ số" (đọc) ↔ "Thu tiền" (thao tác HITL + thu).
  const isPayments = pathname.startsWith("/payments");
  // Màn Cấu hình Agent (M6): 5 nhóm cấu hình tách thành segmented tabs ngay trên topbar; cuộn ngang khi hẹp.
  const isAgentConfig = pathname.startsWith("/agent-config");

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
              <TabsTrigger value="metrics" className="flex-none gap-1.5 px-0">
                <BarChart3 aria-hidden />
                Chỉ số
              </TabsTrigger>
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
              <TabsTrigger value="overview" className="flex-none gap-1.5 px-0">
                <BarChart3 aria-hidden />
                Tổng quan
              </TabsTrigger>
              <TabsTrigger value="products" className="flex-none gap-1.5 px-0">
                <Package aria-hidden />
                Sản phẩm
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      ) : isPayments ? (
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <h1 className="sr-only">{pageTitle(pathname)}</h1>
          <Tabs value={paymentsTab} onValueChange={(v) => setPaymentsTab(v as "metrics" | "collect" | "settings")}>
            <TabsList variant="line" className="gap-3 px-0">
              <TabsTrigger value="metrics" className="flex-none gap-1.5 px-0">
                <BarChart3 aria-hidden />
                Chỉ số
              </TabsTrigger>
              <TabsTrigger value="collect" className="flex-none gap-1.5 px-0">
                <Wallet aria-hidden />
                Thu tiền
                {PENDING_COUNTS.payments > 0 ? (
                  <span className="ml-0.5 inline-flex min-w-4 items-center justify-center rounded-full bg-amber-100 px-1 text-[10px] font-semibold tabular-nums text-amber-700">
                    {PENDING_COUNTS.payments}
                  </span>
                ) : null}
              </TabsTrigger>
              <TabsTrigger value="settings" className="flex-none gap-1.5 px-0">
                <Settings aria-hidden />
                Cài đặt
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      ) : (
        <h1 className="min-w-0 flex-1 truncate text-sm font-semibold sm:text-base">{pageTitle(pathname)}</h1>
      )}

      <div className="ml-auto flex shrink-0 items-center gap-2">
        {/* Mở side panel trò chuyện với Agent */}
        <Button
          variant="outline"
          size="sm"
          onClick={toggleAgentChat}
          className="gap-1.5"
          title="Trò chuyện với trợ lý của bạn"
        >
          <span className="relative flex">
            <MessageSquare className="size-4" aria-hidden />
            <span
              className={cn(
                "absolute -right-0.5 -top-0.5 size-1.5 rounded-full ring-2 ring-card",
                agentEnabled ? "animate-pulse bg-emerald-500" : "bg-muted-foreground",
              )}
              aria-hidden
            />
          </span>
          <span className="hidden sm:inline">Talk to Agent</span>
        </Button>
      </div>
    </header>
    {/* Slot banner dưới topbar — màn đẩy nội dung vào qua TopbarBannerSlot (§6.7). Rỗng thì không chiếm chỗ. */}
    <div id={TOPBAR_BANNER_SLOT_ID} className="shrink-0 empty:hidden" />
    </>
  );
}
