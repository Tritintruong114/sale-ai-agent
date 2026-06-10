"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Check, ChevronRight, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUiStore } from "@/store/uiStore";
import { useSetupStore } from "@/store/setupStore";
import productsData from "@/data/products.json";

// Checklist "Thiết lập" trên SideNav — 3 việc để shop chạy được sau Onboarding.
// Trạng thái "xong" lấy từ dữ liệu/state thật: có sản phẩm (catalog), đã nối cổng (setupStore),
// đã chat thử agent (setupStore). Gọn — một khối nhỏ: nhãn + tiến trình + 3 dòng một hàng.
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
  const allDone = doneCount === total;
  const nextIndex = items.findIndex((i) => !i.done);

  // Xong cả 3 → thẻ ghi nhận nhỏ vài giây rồi tự ẩn.
  useEffect(() => {
    if (!allDone || dismissed || collapsed) return;
    const id = setTimeout(() => dismiss(), 4000);
    return () => clearTimeout(id);
  }, [allDone, dismissed, collapsed, dismiss]);

  if (collapsed || dismissed) return null;

  if (allDone) {
    return (
      <div className="mx-2 mb-1 flex items-center gap-2 rounded-lg px-2 py-1.5 ring-1 ring-emerald-200 motion-safe:animate-in motion-safe:fade-in">
        <Check className="size-3.5 shrink-0 text-emerald-600" aria-hidden />
        <span className="text-xs font-medium text-emerald-700">Shop đã sẵn sàng bán hàng.</span>
      </div>
    );
  }

  return (
    <div className="mx-2 mb-1 rounded-lg px-2 py-1.5 ring-1 ring-foreground/10">
      {/* Nhãn + tiến trình + nút ẩn — tất cả trên một hàng cho gọn */}
      <div className="flex items-center gap-2">
        <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Thiết lập</span>
        <div className="h-1 flex-1 overflow-hidden rounded-full bg-foreground/10">
          <div
            className="h-full w-full rounded-full bg-primary transition-transform duration-500 motion-reduce:transition-none"
            style={{ transform: `scaleX(${doneCount / total})`, transformOrigin: "left" }}
          />
        </div>
        <span className="text-[11px] tabular-nums text-muted-foreground">{doneCount}/{total}</span>
        <button
          type="button"
          onClick={dismiss}
          aria-label="Ẩn hướng dẫn thiết lập"
          title="Ẩn"
          className="-mr-0.5 flex size-4 items-center justify-center rounded text-muted-foreground/70 transition-colors hover:text-foreground"
        >
          <X className="size-3" aria-hidden />
        </button>
      </div>

      {/* 3 dòng — mỗi dòng một hàng; bước kế tiếp đậm + chevron, hint qua tooltip */}
      <ul className="mt-1.5 space-y-0.5">
        {items.map((item, i) => {
          const isNext = i === nextIndex;
          return (
            <li key={item.key}>
              <button
                type="button"
                onClick={item.action}
                title={item.done ? undefined : item.hint}
                className="flex w-full items-center gap-2 rounded-md px-1 py-1 text-left transition-colors hover:bg-muted/60"
              >
                {item.done ? (
                  <Check className="size-3.5 shrink-0 text-emerald-600" aria-hidden />
                ) : (
                  <span
                    className={cn(
                      "size-1.5 shrink-0 rounded-full",
                      isNext ? "bg-primary" : "bg-foreground/25",
                    )}
                    aria-hidden
                  />
                )}
                <span
                  className={cn(
                    "flex-1 truncate text-xs",
                    item.done ? "text-muted-foreground" : isNext ? "font-medium" : "text-muted-foreground",
                  )}
                >
                  {item.label}
                </span>
                {isNext ? <ChevronRight className="size-3.5 shrink-0 text-muted-foreground/60" aria-hidden /> : null}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
