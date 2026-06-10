"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useUiStore } from "@/store/uiStore";
import { Pagination } from "@/components/ui/pagination";
import raw from "@/data/payments.json";
import { PaymentApprovalQueue } from "./PaymentApprovalQueue";
import { PaymentBreakdown } from "./PaymentBreakdown";
import { PaymentKpis } from "./PaymentKpis";
import {
  PaymentTable,
  PAY_SORT_DEFAULT_DIR,
  sortPayments,
  type PaySortDir,
  type PaySortKey,
} from "./PaymentTable";
import { PaymentsToolbar, type PayStateFilter } from "./PaymentsToolbar";
import { PaymentDetailPanel } from "./PaymentDetailPanel";
import { PaymentSettings } from "./PaymentSettings";
import { payState, toPayment, type PaymentSeed, type Payment } from "./meta";

// M5 Thanh toán (HITL) — tách 3 góc nhìn (SegmentView §6.11, đồng bộ Orders/Products):
//   • Chỉ số (metrics) — đọc: KPI phễu + dòng tiền + phân bổ trạng thái. Căn giữa max-w-6xl (§6.11).
//   • Thu tiền (collect) — thao tác: zone duyệt HITL (hoàn tiền/khoản cần xác nhận) + bảng §6.12 (lọc/sắp/phân trang). Full-width.
//   • Cài đặt (settings) — cấu hình: tự tạo QR + chọn cổng thanh toán. Căn giữa max-w-4xl (§6.14).
// needsApproval phải qua bước Duyệt; duyệt xong agent tự gửi QR. Đọc mock payments.json. Bám design.md §5/§6.

const INITIAL: Payment[] = (raw.queue as PaymentSeed[]).map(toPayment);

export function PaymentsScreen({ initialTab, initialId }: { initialTab?: string; initialId?: string }) {
  const router = useRouter();
  const [queue, setQueue] = useState<Payment[]>(INITIAL);

  const [query, setQuery] = useState("");
  const [state, setState] = useState<PayStateFilter>("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortKey, setSortKey] = useState<PaySortKey>("createdAt");
  const [sortDir, setSortDir] = useState<PaySortDir>("desc");
  const [selectedId, setSelectedId] = useState<string | null>(
    initialId && INITIAL.some((p) => p.id === initialId) ? initialId : null,
  );

  // Tab nằm trên topbar (TopBar) — đồng bộ qua uiStore.
  const tab = useUiStore((s) => s.paymentsTab);
  const setPaymentsTab = useUiStore((s) => s.setPaymentsTab);

  // Deep-link ?tab= khi vào màn → set vào store (§6.11). Có ?p= (1 khoản thu) → panel sống ở tab Thu tiền.
  useEffect(() => {
    if (initialTab === "metrics" || initialTab === "collect" || initialTab === "settings")
      setPaymentsTab(initialTab);
    else if (initialId) setPaymentsTab("collect");
  }, [initialTab, initialId, setPaymentsTab]);

  // …và đổi tab / khoản đang mở thì ghi ngược lên thanh địa chỉ (replace, không nhảy cuộn).
  useEffect(() => {
    const qs = new URLSearchParams({ tab });
    if (tab === "collect" && selectedId) qs.set("p", selectedId);
    router.replace(`/payments?${qs.toString()}`, { scroll: false });
  }, [tab, selectedId, router]);

  const patch = (id: string, next: Partial<Payment>) =>
    setQueue((prev) => prev.map((p) => (p.id === id ? { ...p, ...next } : p)));

  const pending = useMemo(() => queue.filter((p) => p.needsApproval && p.gate === "pending"), [queue]);

  const selected = queue.find((p) => p.id === selectedId) ?? null;
  const toggleSelect = (id: string) => setSelectedId((cur) => (cur === id ? null : id));
  const openOrder = (orderId: string) => router.push(`/orders?o=${orderId}`);

  // Đếm theo trạng thái thu cho bộ lọc (toàn tập, không phụ thuộc tìm kiếm).
  const stateCounts = useMemo(() => {
    const m: Record<string, number> = { all: queue.length };
    for (const p of queue) {
      const s = payState(p);
      m[s] = (m[s] ?? 0) + 1;
    }
    return m;
  }, [queue]);

  const hasFilters = query.trim() !== "" || state !== "all";

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return queue.filter((p) => {
      if (state !== "all" && payState(p) !== state) return false;
      if (!q) return true;
      return p.customerName.toLowerCase().includes(q) || p.orderId.toLowerCase().includes(q);
    });
  }, [queue, query, state]);

  // Sắp xếp toàn bộ tập đã lọc TRƯỚC khi phân trang (sort toàn cục §6.12).
  const sorted = useMemo(() => sortPayments(visible, sortKey, sortDir), [visible, sortKey, sortDir]);
  const onSort = (key: PaySortKey) => {
    if (key === sortKey) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir(PAY_SORT_DEFAULT_DIR[key]);
    }
  };

  // Về trang 1 khi tập kết quả đổi.
  useEffect(() => {
    setPage(1);
  }, [query, state, pageSize, sortKey, sortDir]);
  const pageCount = Math.max(1, Math.ceil(sorted.length / pageSize));
  const safePage = Math.min(page, pageCount);
  const paged = useMemo(
    () => sorted.slice((safePage - 1) * pageSize, safePage * pageSize),
    [sorted, safePage, pageSize],
  );

  return (
    // Tab Chỉ số: căn giữa max-w-6xl (§6.11). Tab Cài đặt: căn giữa max-w-4xl. Tab Thu tiền: full-width, cao bằng vùng main.
    <div
      className={cn(
        "flex w-full flex-col gap-6",
        tab === "metrics" && "mx-auto max-w-6xl",
        tab === "settings" && "mx-auto max-w-4xl",
        tab === "collect" && "h-full min-h-0 gap-4",
      )}
    >
      {tab === "settings" ? (
        /* Tab Cài đặt — cấu hình thu tiền: tự tạo QR + chọn cổng thanh toán. */
        <PaymentSettings />
      ) : tab === "metrics" ? (
        /* Tab Chỉ số — đọc số liệu, chỉ xem. */
        <>
          <header className="min-w-0">
            <p className="text-xs text-muted-foreground sm:text-sm">
              Theo dõi thanh toán theo đơn, duyệt hoàn tiền và khoản cần xác nhận.
            </p>
            <h1 className="text-pretty text-base font-semibold sm:text-lg">
              {pending.length > 0 ? (
                <>
                  {queue.length} khoản thanh toán,{" "}
                  <span className="text-amber-600">{pending.length} khoản cần bạn duyệt.</span>
                </>
              ) : (
                <span className="text-emerald-600">Không còn khoản nào chờ duyệt — agent đang tự gửi QR cho khách.</span>
              )}
            </h1>
          </header>

          <section className="space-y-3" aria-labelledby="payments-overview-h">
            <h2 id="payments-overview-h" className="text-lg font-semibold">
              Tổng quan thanh toán
            </h2>
            <PaymentKpis queue={queue} />
          </section>

          <PaymentBreakdown queue={queue} />
        </>
      ) : (
        /* Tab Thanh toán — zone duyệt HITL + bảng thao tác + panel chi tiết docked. */
        <>
          <PaymentApprovalQueue
            pending={pending}
            onView={() => setState("pending")}
            viewing={state === "pending"}
          />

          {/* Vùng làm việc — bảng + panel chi tiết docked phải (lg+). Không overlay (đồng bộ Orders/Products). */}
          <div
            className={cn(
              "flex min-h-0 flex-1 flex-col",
              selected && "lg:grid lg:grid-cols-[1fr_24rem] lg:gap-4",
            )}
          >
            {/* Container chung: toolbar cố định (border-b) + bảng cuộn + footer phân trang. Ẩn trên mobile khi mở chi tiết. */}
            <section
              aria-labelledby="collect-h"
              className={cn(
                "flex min-h-0 flex-1 flex-col rounded-xl bg-card ring-1 ring-foreground/10",
                selected && "hidden lg:flex",
              )}
            >
              <h2 id="collect-h" className="sr-only">
                Danh sách khoản thanh toán
              </h2>
              <div className="shrink-0 rounded-t-xl border-b bg-card p-2">
                <PaymentsToolbar
                  query={query}
                  onQuery={setQuery}
                  state={state}
                  onState={setState}
                  stateCounts={stateCounts}
                  hasFilters={hasFilters}
                  onReset={() => {
                    setQuery("");
                    setState("all");
                  }}
                />
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto p-2.5">
                <PaymentTable
                  rows={paged}
                  selectedId={selectedId}
                  onOpen={toggleSelect}
                  onMarkPaid={(id) => patch(id, { status: "paid" })}
                  sortKey={sortKey}
                  sortDir={sortDir}
                  onSort={onSort}
                />
              </div>

              {sorted.length > 0 ? (
                <div className="shrink-0 border-t px-2.5 py-2">
                  <Pagination
                    page={safePage}
                    pageSize={pageSize}
                    total={sorted.length}
                    onPageChange={setPage}
                    onPageSizeChange={setPageSize}
                    unitLabel="khoản"
                  />
                </div>
              ) : null}
            </section>

            {/* Panel chi tiết — docked phải (lg+), full-width thay bảng trên mobile. border (không ring) để
                viền không bị ancestor overflow-hidden cắt. */}
            {selected ? (
              <div className="min-h-0 flex-1 overflow-hidden rounded-xl border border-foreground/10 bg-card lg:h-full lg:flex-none">
                <PaymentDetailPanel
                  payment={selected}
                  onClose={() => setSelectedId(null)}
                  onApprove={(id) => patch(id, { gate: "approved" })}
                  onReject={(id) => patch(id, { gate: "rejected" })}
                  onMarkPaid={(id) => patch(id, { status: "paid" })}
                  onOpenOrder={openOrder}
                />
              </div>
            ) : null}
          </div>
        </>
      )}
    </div>
  );
}
