"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, ChevronRight, CreditCard, MessageSquare, Package, PartyPopper, Rocket, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUiStore } from "@/store/uiStore";
import { useSetupStore } from "@/store/setupStore";
import productsData from "@/data/products.json";

// Checklist "Bắt đầu nhanh" trên SideNav — 3 việc để shop chạy được sau Onboarding.
// Trạng thái "xong" lấy từ dữ liệu/state thật: có sản phẩm (catalog), đã nối cổng (setupStore),
// đã chat thử agent (setupStore). Bước kế tiếp được làm nổi; xong cả 3 → thẻ chúc mừng rồi tự ẩn.
export function SetupChecklist() {
  const router = useRouter();
  const collapsed = useUiStore((s) => s.collapsed);
  const setMobileOpen = useUiStore((s) => s.setMobileOpen);
  const setPaymentsTab = useUiStore((s) => s.setPaymentsTab);
  const setAgentChatOpen = useUiStore((s) => s.setAgentChatOpen);
  const gateways = useSetupStore((s) => s.gateways);
  const agentTested = useSetupStore((s) => s.agentTested);
  const dismissed = useSetupStore((s) => s.dismissed);
  const dismiss = useSetupStore((s) => s.dismiss);

  const items = [
    {
      key: "product",
      icon: Package,
      label: "Thêm sản phẩm",
      hint: "Để agent tư vấn và báo giá cho khách",
      done: productsData.catalog.length > 0,
      action: () => {
        setMobileOpen(false);
        router.push("/products");
      },
    },
    {
      key: "payment",
      icon: CreditCard,
      label: "Kết nối cổng thanh toán",
      hint: "Để agent gửi QR và thu tiền tự động",
      done: Object.values(gateways).some(Boolean),
      action: () => {
        setMobileOpen(false);
        setPaymentsTab("settings");
        router.push("/payments");
      },
    },
    {
      key: "agent",
      icon: MessageSquare,
      label: "Chat thử với agent",
      hint: "Xem trước cách agent trả lời khách",
      done: agentTested,
      action: () => {
        setMobileOpen(false);
        setAgentChatOpen(true);
      },
    },
  ];

  const doneCount = items.filter((i) => i.done).length;
  const total = items.length;
  const remaining = total - doneCount;
  const allDone = remaining === 0;
  const nextIndex = items.findIndex((i) => !i.done);

  // Xong cả 3 → khoe thẻ chúc mừng vài giây rồi tự ẩn.
  useEffect(() => {
    if (!allDone || dismissed || collapsed) return;
    const id = setTimeout(() => dismiss(), 4000);
    return () => clearTimeout(id);
  }, [allDone, dismissed, collapsed, dismiss]);

  // Thu gọn sidebar hoặc đã ẩn → không chiếm chỗ.
  if (collapsed || dismissed) return null;

  if (allDone) {
    return (
      <div className="mx-2 mb-1 flex items-center gap-2 rounded-lg bg-emerald-50 p-2.5 ring-1 ring-emerald-200 motion-safe:animate-in motion-safe:fade-in motion-safe:zoom-in-95">
        <PartyPopper className="size-4 shrink-0 text-emerald-600" aria-hidden />
        <span className="text-xs font-medium text-emerald-800">Tuyệt vời! Shop đã sẵn sàng bán hàng.</span>
      </div>
    );
  }

  return (
    <div className="mx-2 mb-1 rounded-xl bg-primary/5 p-2.5 ring-1 ring-primary/15">
      {/* Header — mục tiêu + nút ẩn */}
      <div className="flex items-center gap-1.5">
        <Rocket className="size-3.5 shrink-0 text-primary" aria-hidden />
        <span className="flex-1 text-xs font-semibold">Sẵn sàng bán hàng</span>
        <button
          type="button"
          onClick={dismiss}
          aria-label="Ẩn hướng dẫn bắt đầu"
          title="Ẩn"
          className="flex size-5 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <X className="size-3.5" aria-hidden />
        </button>
      </div>

      {/* Tiến trình — thanh fill + số bước */}
      <div className="mt-2 flex items-center gap-2">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-primary/15">
          <div
            className="h-full w-full rounded-full bg-primary transition-transform duration-500 motion-reduce:transition-none"
            style={{ transform: `scaleX(${doneCount / total})`, transformOrigin: "left" }}
          />
        </div>
        <span className="text-[11px] font-medium tabular-nums text-muted-foreground">{doneCount}/{total}</span>
      </div>
      <p className="mt-1 text-[11px] text-muted-foreground">
        {doneCount === 0 ? "Vài bước để shop bắt đầu bán" : `Còn ${remaining} bước nữa thôi!`}
      </p>

      {/* Các bước — bước kế tiếp được làm nổi */}
      <ul className="mt-2 space-y-1">
        {items.map((item, i) => {
          const isNext = i === nextIndex;
          if (item.done) {
            return (
              <li key={item.key}>
                <button
                  type="button"
                  onClick={item.action}
                  className="flex w-full items-center gap-2 rounded-md px-1.5 py-1 text-left transition-colors hover:bg-muted/60"
                >
                  <CheckCircle2 className="size-4 shrink-0 text-emerald-600" aria-hidden />
                  <span className="text-xs text-muted-foreground">{item.label}</span>
                </button>
              </li>
            );
          }
          return (
            <li key={item.key}>
              <button
                type="button"
                onClick={item.action}
                className={cn(
                  "flex w-full items-center gap-2 text-left transition-colors",
                  isNext
                    ? "rounded-lg bg-card px-2 py-2 ring-1 ring-primary/40 hover:ring-primary/60"
                    : "rounded-md px-1.5 py-1 hover:bg-muted/60",
                )}
              >
                <span
                  className={cn(
                    "flex size-4 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold tabular-nums",
                    isNext ? "bg-primary text-primary-foreground" : "text-muted-foreground ring-1 ring-foreground/25",
                  )}
                >
                  {i + 1}
                </span>
                <span className="min-w-0 flex-1">
                  <span className={cn("block text-xs", isNext ? "font-medium" : "text-muted-foreground")}>
                    {item.label}
                  </span>
                  {isNext ? <span className="mt-0.5 block text-[11px] text-muted-foreground">{item.hint}</span> : null}
                </span>
                {isNext ? <ChevronRight className="size-4 shrink-0 text-primary" aria-hidden /> : null}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
