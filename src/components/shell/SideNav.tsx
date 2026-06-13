"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Compass, PanelLeftClose, PanelLeftOpen, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUiStore } from "@/store/uiStore";
import { useSetupStore } from "@/store/setupStore";
import { PrototypeSwitcher } from "./PrototypeSwitcher";
import { NAV_GROUPS, isNavItemActive, type NavItem } from "./nav";

// §2 design.md — SideNav: điều hướng chính dạng dọc bên trái.
// Desktop: cột cố định, thu gọn được (useUiStore.collapsed → icon-only).
// Mobile: drawer trượt từ trái (mobileOpen) + scrim (MobileScrim).

function NavLink({
  item,
  active,
  collapsed,
  onNavigate,
}: {
  item: NavItem;
  active: boolean;
  collapsed: boolean;
  onNavigate: () => void;
}) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      data-tour-step-id={item.tour}
      aria-current={active ? "page" : undefined}
      title={collapsed ? item.label : undefined}
      className={cn(
        "relative flex items-center rounded-md text-sm transition-colors",
        collapsed ? "justify-center px-0 py-2" : "gap-3 px-3 py-2",
        active
          ? "bg-muted font-medium text-foreground"
          : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
      )}
    >
      {/* Chỉ báo mục đang chọn — thanh dọc bên trái */}
      <span
        className={cn(
          "absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-r-full bg-primary transition-opacity",
          active ? "opacity-100" : "opacity-0",
        )}
      />
      <span className="relative shrink-0">
        <Icon className="size-[18px]" strokeWidth={active ? 2.25 : 2} />
        {/* Khi thu gọn: badge số việc chờ rút thành chấm đỏ trên icon */}
        {collapsed && item.badge ? (
          <span className="absolute -right-1.5 -top-1.5 size-2 rounded-full bg-destructive ring-2 ring-card" />
        ) : null}
      </span>
      {!collapsed ? (
        <>
          <span className="flex-1 truncate">{item.label}</span>
          {item.badge ? (
            <span className="min-w-5 rounded-full bg-destructive px-1.5 py-0.5 text-center text-[11px] font-semibold tabular-nums text-white">
              {item.badge}
            </span>
          ) : null}
        </>
      ) : null}
    </Link>
  );
}

export function SideNav() {
  const pathname = usePathname();
  const router = useRouter();
  const collapsed = useUiStore((s) => s.collapsed);
  const toggleCollapsed = useUiStore((s) => s.toggleCollapsed);
  const mobileOpen = useUiStore((s) => s.mobileOpen);
  const setMobileOpen = useUiStore((s) => s.setMobileOpen);
  const requestTour = useUiStore((s) => s.requestTour);
  const resetSetup = useSetupStore((s) => s.reset);

  const isActive = (item: NavItem) => isNavItemActive(item, pathname);

  const closeMobile = () => setMobileOpen(false);

  // Xem lại tour: về Dashboard (bước đầu) rồi đặt cờ để TourLauncher khởi động.
  const startGuide = () => {
    closeMobile();
    router.push("/dashboard");
    requestTour("guide");
  };

  return (
    <aside
      className={cn(
        "z-50 flex shrink-0 flex-col border-r bg-card",
        // Mobile: drawer cố định trượt vào/ra
        "fixed inset-y-0 left-0 w-56 transition-transform duration-200 ease-out",
        mobileOpen ? "translate-x-0" : "-translate-x-full",
        // Desktop: cột tĩnh, không trượt, rộng đổi theo collapsed
        "md:static md:translate-x-0 md:transition-[width]",
        collapsed ? "md:w-16" : "md:w-56",
      )}
    >
      {/* Thương hiệu + nút thu gọn (icon-only, đưa từ TopBar về đây) */}
      <div className={cn("flex h-14 shrink-0 items-center border-b", collapsed ? "justify-center px-2" : "gap-2.5 px-4")}>
        {collapsed ? (
          // Thu gọn: nút mở rộng thế chỗ logo (desktop). Mobile luôn ở dạng mở rộng nên không gặp nhánh này.
          <button
            type="button"
            onClick={toggleCollapsed}
            aria-label="Mở rộng thanh điều hướng"
            title="Mở rộng thanh điều hướng"
            className="flex size-8 items-center justify-center rounded-md text-muted-foreground outline-none transition-colors hover:bg-muted/60 hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <PanelLeftOpen className="size-[18px]" />
          </button>
        ) : (
          <>
            <img
              src="/logo.webp"
              alt="Sale AI Agent"
              width={32}
              height={32}
              className="size-8 shrink-0 rounded-lg ring-1 ring-foreground/10"
            />
            <p className="min-w-0 flex-1 truncate text-sm font-semibold">Sale AI Agent</p>
            <button
              type="button"
              onClick={toggleCollapsed}
              aria-label="Thu gọn thanh điều hướng"
              title="Thu gọn thanh điều hướng"
              className="hidden size-7 shrink-0 items-center justify-center rounded-md text-muted-foreground outline-none transition-colors hover:bg-muted/60 hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 md:flex"
            >
              <PanelLeftClose className="size-[18px]" />
            </button>
          </>
        )}
      </div>

      <nav className={cn("flex-1 space-y-1 overflow-y-auto p-2")}>
        {NAV_GROUPS.map((group, gi) => (
          <div key={group.label} className={cn(gi > 0 && "pt-1")}>
            {/* Tiêu đề category — khi mở rộng là nhãn chữ, khi thu gọn là gạch ngăn (trừ nhóm đầu). */}
            {!collapsed ? (
              <div className="px-3 pb-1 pt-3 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                {group.label}
              </div>
            ) : gi > 0 ? (
              <div className="mx-2 my-2 border-t border-foreground/10" aria-hidden />
            ) : null}
            <div className="space-y-1">
              {group.items.map((item) => (
                <NavLink key={item.href} item={item} active={isActive(item)} collapsed={collapsed} onNavigate={closeMobile} />
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div className="space-y-1 border-t p-2">
        {/* Công cụ prototype — chuyển trạng thái dữ liệu demo (đưa từ Dashboard lên đây) */}
        <PrototypeSwitcher />
        <button
          type="button"
          onClick={startGuide}
          title={collapsed ? "Xem hướng dẫn" : undefined}
          className={cn(
            "flex w-full items-center rounded-md text-sm text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground",
            collapsed ? "justify-center px-0 py-2" : "gap-3 px-3 py-2",
          )}
        >
          <Compass className="size-[18px] shrink-0" />
          {!collapsed ? <span className="truncate">Xem hướng dẫn</span> : null}
        </button>
        <Link
          href="/onboarding"
          onClick={() => {
            closeMobile();
            resetSetup();
          }}
          title={collapsed ? "Chạy lại Onboarding" : undefined}
          className={cn(
            "flex items-center rounded-md text-sm text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground",
            collapsed ? "justify-center px-0 py-2" : "gap-3 px-3 py-2",
          )}
        >
          <RotateCcw className="size-[18px] shrink-0" />
          {!collapsed ? <span className="truncate">Chạy lại Onboarding</span> : null}
        </Link>
      </div>
    </aside>
  );
}
