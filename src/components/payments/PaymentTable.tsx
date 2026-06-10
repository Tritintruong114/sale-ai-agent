import { ArrowDown, ArrowUp, ChevronsUpDown, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatVND } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { ChannelMark, channelTitle } from "@/components/orders/bits";
import { dateTime } from "@/components/orders/meta";
import { PAY_STATE_META, PAY_STATE_ORDER, payState, type Payment } from "./meta";

// Chế độ Bảng §6.12 — quét nhanh nhiều khoản: header cột sắp xếp được (aria-sort), tiền canh phải tabular,
// hàng chọn được mở panel chi tiết docked (timeline + QR), không rời màn. Sort do cha quản (controlled) →
// sắp toàn bộ tập rồi mới phân trang. Trạng thái thu = chip màu+nhãn; action "Đã nhận tiền" (khi đã gửi QR) ở cột cuối.

export type PaySortKey = "customer" | "createdAt" | "amount" | "state";
export type PaySortDir = "asc" | "desc";

export const PAY_SORT_DEFAULT_DIR: Record<PaySortKey, PaySortDir> = {
  customer: "asc",
  createdAt: "desc",
  amount: "desc",
  state: "asc",
};

export function sortPayments(rows: Payment[], key: PaySortKey, dir: PaySortDir): Payment[] {
  const sign = dir === "asc" ? 1 : -1;
  const stateRank = (p: Payment) => PAY_STATE_ORDER.indexOf(payState(p));
  return [...rows].sort((a, b) => {
    switch (key) {
      case "customer":
        return sign * a.customerName.localeCompare(b.customerName, "vi");
      case "amount":
        return sign * (a.amount - b.amount);
      case "state":
        return sign * (stateRank(a) - stateRank(b) || b.createdAt.localeCompare(a.createdAt));
      default:
        return sign * a.createdAt.localeCompare(b.createdAt);
    }
  });
}

const COLUMNS: { key: PaySortKey; label: string; align: "left" | "right"; className?: string }[] = [
  { key: "customer", label: "Khách hàng", align: "left" },
  { key: "createdAt", label: "Thời gian", align: "left", className: "hidden md:table-cell" },
  { key: "amount", label: "Số tiền", align: "right" },
  { key: "state", label: "Trạng thái thanh toán", align: "left" },
];

function StateChip({ p }: { p: Payment }) {
  const m = PAY_STATE_META[payState(p)];
  const Icon = m.icon;
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium", m.chip)}>
      <Icon className="size-3" aria-hidden />
      {m.label}
    </span>
  );
}

export function PaymentTable({
  rows,
  selectedId,
  onOpen,
  onMarkPaid,
  sortKey,
  sortDir,
  onSort,
}: {
  rows: Payment[];
  selectedId: string | null;
  onOpen: (id: string) => void;
  onMarkPaid: (id: string) => void;
  sortKey: PaySortKey;
  sortDir: PaySortDir;
  onSort: (key: PaySortKey) => void;
}) {
  if (rows.length === 0) {
    return (
      <div className="flex flex-col items-center gap-1.5 rounded-xl border border-dashed py-12 text-center">
        <Wallet className="size-6 text-muted-foreground" aria-hidden />
        <p className="text-sm text-muted-foreground">Không có khoản thanh toán nào khớp bộ lọc</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg ring-1 ring-foreground/10">
      <table className="w-full min-w-[44rem] border-collapse text-left">
        <caption className="sr-only">
          Danh sách khoản thanh toán — bấm tiêu đề cột để sắp xếp, bấm một hàng để mở chi tiết.
        </caption>
        <thead>
          <tr className="border-b bg-muted/40 [&_th]:h-9 [&_th]:px-3 [&_th]:align-middle">
            <th scope="col" className="w-10">
              <span className="sr-only">Kênh</span>
            </th>
            {COLUMNS.map((col) => {
              const active = sortKey === col.key;
              const SortIcon = !active ? ChevronsUpDown : sortDir === "asc" ? ArrowUp : ArrowDown;
              return (
                <th
                  key={col.key}
                  scope="col"
                  aria-sort={active ? (sortDir === "asc" ? "ascending" : "descending") : "none"}
                  className={col.className}
                >
                  <button
                    type="button"
                    onClick={() => onSort(col.key)}
                    className={cn(
                      "group inline-flex w-full cursor-pointer items-center gap-1 rounded-md text-[11px] font-semibold uppercase tracking-wide outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50",
                      col.align === "right" && "justify-end",
                      active ? "text-foreground" : "text-muted-foreground",
                    )}
                    title={`Sắp xếp theo ${col.label.toLowerCase()}`}
                  >
                    {col.label}
                    <SortIcon
                      className={cn(
                        "size-3 shrink-0 transition-opacity",
                        active ? "opacity-100" : "opacity-0 group-hover:opacity-50",
                      )}
                      aria-hidden
                    />
                  </button>
                </th>
              );
            })}
            <th scope="col" className="w-px">
              <span className="sr-only">Thao tác</span>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {rows.map((p) => {
            const state = payState(p);
            const selected = p.id === selectedId;
            return (
              <tr
                key={p.id}
                onClick={() => onOpen(p.id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onOpen(p.id);
                  }
                }}
                tabIndex={0}
                aria-selected={selected}
                aria-label={`Khoản thanh toán của ${p.customerName}, ${formatVND(p.amount)} — mở chi tiết`}
                className={cn(
                  "cursor-pointer outline-none transition-colors [&>td]:px-3 [&>td]:py-2.5 [&>td]:align-middle",
                  "hover:bg-muted/50 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring/50",
                  selected && "bg-muted/60",
                )}
              >
                <td className={cn("border-l-2", selected ? "border-primary" : "border-transparent")}>
                  <ChannelMark channel={p.channel} className="shrink-0" />
                  <span className="sr-only">{channelTitle(p.channel)}</span>
                </td>

                <td>
                  <p className="truncate text-sm font-medium">{p.customerName}</p>
                  <p className="font-mono text-[11px] text-muted-foreground">{p.orderId}</p>
                </td>

                <td className="hidden whitespace-nowrap text-xs tabular-nums text-muted-foreground md:table-cell">
                  {dateTime(p.createdAt)}
                </td>

                <td className="text-right text-sm font-semibold tabular-nums">{formatVND(p.amount)}</td>

                <td>
                  <StateChip p={p} />
                </td>

                {/* Action tiến bước — chặn propagation để không mở đơn khi bấm. */}
                <td className="text-right">
                  <span
                    className="inline-flex"
                    onClick={(e) => e.stopPropagation()}
                    onKeyDown={(e) => e.stopPropagation()}
                  >
                    {state === "sent" ? (
                      <Button size="sm" onClick={() => onMarkPaid(p.id)}>
                        Đã nhận tiền
                      </Button>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
