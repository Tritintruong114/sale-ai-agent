import { cn } from "@/lib/utils";
import { formatVND } from "@/lib/format";
import { PAY_STATE_META, PAY_STATE_ORDER, payState, type PayState, type Payment } from "./meta";

// Tab Chỉ số — hai khối đọc số liệu: (1) Dòng tiền (đã thu vs còn phải thu) và (2) Phân bổ theo trạng thái.
// Bar tô theo dot màu §5; mọi con số tabular-nums. Tất định, suy từ queue.

export function PaymentBreakdown({ queue }: { queue: Payment[] }) {
  const byState = queue.reduce(
    (acc, p) => {
      const s = payState(p);
      acc[s] = { count: (acc[s]?.count ?? 0) + 1, amount: (acc[s]?.amount ?? 0) + p.amount };
      return acc;
    },
    {} as Record<PayState, { count: number; amount: number }>,
  );

  const collected = byState.paid?.amount ?? 0;
  const outstanding = (byState.pending?.amount ?? 0) + (byState.sent?.amount ?? 0);
  const relevant = collected + outstanding;
  const rate = relevant > 0 ? Math.round((collected / relevant) * 100) : 0;

  // Các bước hiển thị trong phân bổ: luôn 4 bước phễu; "Từ chối" chỉ khi có.
  const stages = PAY_STATE_ORDER.filter((s) => s !== "rejected" || (byState.rejected?.count ?? 0) > 0);
  const maxCount = Math.max(1, ...stages.map((s) => byState[s]?.count ?? 0));

  return (
    <>
      <section className="space-y-3" aria-labelledby="cashflow-h">
        <h2 id="cashflow-h" className="text-lg font-semibold">
          Dòng tiền
        </h2>
        <div className="space-y-4 rounded-xl bg-card p-4 ring-1 ring-foreground/10">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">Đã thu</p>
              <p className="text-2xl font-semibold tabular-nums text-emerald-600">{formatVND(collected)}</p>
            </div>
            <div className="min-w-0 text-right">
              <p className="text-xs text-muted-foreground">Còn phải thu</p>
              <p className="text-lg font-semibold tabular-nums text-orange-600">{formatVND(outstanding)}</p>
            </div>
          </div>
          {/* Tỉ lệ thu — phần emerald trên nền orange (còn phải thu). Màu kèm nhãn chữ %. */}
          <div>
            <div className="flex h-2.5 overflow-hidden rounded-full bg-orange-100" role="img" aria-label={`Đã thu ${rate}% trên tổng cần thu`}>
              <div className="bg-emerald-500 transition-[width] duration-300" style={{ width: `${rate}%` }} />
            </div>
            <div className="mt-1 flex justify-between text-[11px] text-muted-foreground">
              <span className="tabular-nums font-medium text-emerald-600">{rate}% đã thu</span>
              <span className="tabular-nums">Tổng {formatVND(relevant)}</span>
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-3" aria-labelledby="funnel-h">
        <h2 id="funnel-h" className="text-lg font-semibold">
          Theo trạng thái
        </h2>
        <div className="space-y-3 rounded-xl bg-card p-4 ring-1 ring-foreground/10">
          {stages.map((s) => {
            const m = PAY_STATE_META[s];
            const Icon = m.icon;
            const count = byState[s]?.count ?? 0;
            const amount = byState[s]?.amount ?? 0;
            return (
              <div key={s} className="space-y-1.5">
                <div className="flex items-center gap-2 text-sm">
                  <span className={cn("flex size-6 shrink-0 items-center justify-center rounded-md", m.chip)} aria-hidden>
                    <Icon className="size-3.5" />
                  </span>
                  <span className="font-medium">{m.label}</span>
                  <span className="ml-auto tabular-nums text-muted-foreground">{formatVND(amount)}</span>
                  <span className="w-10 shrink-0 text-right font-semibold tabular-nums">{count}</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                  <div
                    className={cn("h-full rounded-full transition-[width] duration-300", m.dot)}
                    style={{ width: `${(count / maxCount) * 100}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </>
  );
}
