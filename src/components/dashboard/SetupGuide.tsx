"use client";

import { useRouter } from "next/navigation";
import { ArrowRight, Check, CreditCard, GraduationCap, Package, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useUiStore } from "@/store/uiStore";
import { useSetupStore } from "@/store/setupStore";
import productsData from "@/data/products.json";

// Guide "Hoàn tất thiết lập" trên Dashboard empty state — một block lớn, 3 bước nằm ngang.
// Trạng thái "xong" suy từ state thật (catalog / cổng đã nối / đã chat thử); bước kế tiếp được làm nổi.
// Chỉ hiện khi Dashboard chưa có hoạt động (DashboardScreen tự ẩn khi đã có dữ liệu).
export function SetupGuide() {
  const router = useRouter();
  const setAgentConfigTab = useUiStore((s) => s.setAgentConfigTab);
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
      action: () => router.push("/products"),
    },
    {
      key: "payment",
      icon: CreditCard,
      label: "Kết nối thanh toán",
      hint: "Để agent gửi QR và ghi nhận doanh thu",
      done: Object.values(gateways).some(Boolean),
      action: () => router.push("/payment-gateway"),
    },
    {
      key: "agent",
      icon: GraduationCap,
      label: "Đào tạo Agent",
      hint: "Tinh chỉnh cách agent tư vấn cho khách",
      done: agentTested,
      action: () => {
        setAgentConfigTab("identity");
        router.push("/agent-config?tab=identity");
        setAgentChatOpen(true);
      },
    },
  ];

  const doneCount = items.filter((i) => i.done).length;
  const total = items.length;
  const remaining = total - doneCount;
  const allDone = remaining === 0;
  const nextIndex = items.findIndex((i) => !i.done);

  // Đã hoàn tất + chủ shop bấm đóng → ẩn hẳn guide khỏi empty state.
  if (dismissed) return null;

  return (
    <section aria-labelledby="setup-h" className="rounded-xl bg-card p-5 ring-1 ring-foreground/10 sm:p-6">
      {/* Header — mục tiêu + tiến trình trên một hàng */}
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <div className="min-w-0">
          <h2 id="setup-h" className="text-base font-semibold sm:text-lg">Hoàn tất thiết lập</h2>
          <p className="text-sm text-muted-foreground">
            {remaining > 0 ? `Còn ${remaining} bước để shop sẵn sàng nhận đơn.` : "Shop đã sẵn sàng bán hàng."}
          </p>
        </div>
        {allDone ? (
          // Xong cả 3 → thanh tiến trình nhường chỗ cho nút đóng (chủ shop chủ động ẩn).
          <Button variant="outline" size="sm" onClick={dismiss}>
            <X className="size-4" aria-hidden />
            Đóng
          </Button>
        ) : (
          <div className="flex items-center gap-2.5">
            <div className="h-1.5 w-28 overflow-hidden rounded-full bg-primary/15">
              <div
                className="h-full w-full rounded-full bg-primary transition-transform duration-500 motion-reduce:transition-none"
                style={{ transform: `scaleX(${doneCount / total})`, transformOrigin: "left" }}
              />
            </div>
            <span className="text-sm font-medium tabular-nums text-muted-foreground">{doneCount}/{total}</span>
          </div>
        )}
      </div>

      {/* 3 bước nằm ngang */}
      <div className="mt-5 grid gap-4 sm:grid-cols-3">
        {items.map((item, i) => {
          const isNext = i === nextIndex;
          const Icon = item.icon;
          return (
            <button
              key={item.key}
              type="button"
              onClick={item.action}
              aria-label={`${item.label}${item.done ? " — đã xong" : ""}`}
              className={cn(
                "group flex cursor-pointer flex-col gap-3 rounded-xl p-4 text-left ring-1 transition duration-200",
                "focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 motion-safe:hover:-translate-y-0.5",
                item.done
                  ? "bg-muted/30 ring-foreground/10"
                  : isNext
                    ? "bg-primary/5 ring-primary/40 hover:ring-primary/60 hover:shadow-sm"
                    : "ring-foreground/10 hover:ring-foreground/20",
              )}
            >
              <div className="flex items-center justify-between">
                <span
                  className={cn(
                    "flex size-9 items-center justify-center rounded-lg",
                    item.done
                      ? "bg-emerald-100 text-emerald-700"
                      : isNext
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground",
                  )}
                >
                  {item.done ? <Check className="size-4.5" aria-hidden /> : <Icon className="size-4.5" aria-hidden />}
                </span>
                {!item.done ? (
                  <span className="text-xs font-medium tabular-nums text-muted-foreground/60">{i + 1}/{total}</span>
                ) : null}
              </div>
              <div>
                <p className="text-sm font-medium">{item.label}</p>
                <p className="text-xs text-muted-foreground">{item.hint}</p>
              </div>
              <span
                className={cn(
                  "flex items-center gap-1 text-xs font-medium transition-colors",
                  item.done ? "text-emerald-600" : "text-muted-foreground group-hover:text-foreground",
                )}
              >
                {item.done ? (
                  "Đã xong"
                ) : (
                  <>
                    Bắt đầu
                    <ArrowRight className="size-3.5 transition-transform duration-200 motion-safe:group-hover:translate-x-0.5" aria-hidden />
                  </>
                )}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
