"use client";

import { useRouter } from "next/navigation";
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  CreditCard,
  GraduationCap,
  Inbox,
  MessageSquare,
  Package,
  PieChart,
  ShoppingCart,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Users,
} from "lucide-react";
import { useEffect, useRef, useState, type ComponentType } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AgentAvatar } from "@/components/shared/AgentAvatar";
import { cn } from "@/lib/utils";
import { formatVND } from "@/lib/format";
import { useAgentConfig } from "@/store/agentConfigStore";
import defaultData from "@/data/dashboard.json";

export type DashboardData = typeof defaultData;

// M4 Dashboard — tab mặc định sau onboarding. Đọc mock data/dashboard.json.
// Tối ưu theo ui-ux-pro-max "Data-Dense Dashboard": lede scannable, status màu + icon (không
// chỉ màu), hover 150–300ms tôn trọng reduced-motion, chart có nhãn trực tiếp + tooltip + aria.

const TODO_ITEMS = [
  { key: "handoff" as const, label: "Hội thoại cần người", hint: "Agent đã chuyển cho bạn", href: "/inbox", icon: Inbox },
  { key: "bigOrders" as const, label: "Đơn lớn chờ duyệt", hint: "Vượt ngưỡng tự chốt", href: "/orders", icon: ShoppingCart },
  { key: "payments" as const, label: "Thanh toán chờ duyệt", hint: "Khâu nhạy cảm cần bạn duyệt", href: "/payments", icon: CreditCard },
];

// Mỗi KPI một icon + tint chip riêng để quét nhanh (màu chỉ hỗ trợ, nhãn vẫn là chính).
const KPI_META: Record<string, { icon: typeof Inbox; chip: string }> = {
  chats: { icon: MessageSquare, chip: "bg-sky-100 text-sky-700" },
  new_customers: { icon: Users, chip: "bg-violet-100 text-violet-700" },
  closed_orders: { icon: ShoppingCart, chip: "bg-emerald-100 text-emerald-700" },
  revenue: { icon: TrendingUp, chip: "bg-amber-100 text-amber-700" },
};

// Palette phân loại cho "Khách hỏi về gì" — 5 nhóm, mỗi nhóm một hue dịu, luôn kèm nhãn.
const INTENT_COLORS = ["bg-sky-500", "bg-violet-500", "bg-emerald-500", "bg-rose-500", "bg-slate-400"];

// Empty state dùng chung cho các card thiếu dữ liệu (G: empty-states) — nền dashed dịu,
// icon trong vòng tròn muted + tiêu đề + một dòng hướng dẫn việc cần làm để có dữ liệu.
function SectionEmpty({
  icon: Icon,
  title,
  description,
}: {
  icon: ComponentType<{ className?: string }>;
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-foreground/15 px-4 py-8 text-center">
      <span className="flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <Icon className="size-5" />
      </span>
      <p className="text-sm font-medium">{title}</p>
      <p className="max-w-xs text-xs text-muted-foreground">{description}</p>
    </div>
  );
}

// Avatar agent + chấm "đang trực" (xanh) ở header empty state.
// Avatar dùng chung component shared (cùng nguồn config.identity với Onboarding bước 2).
function AgentAvatarLive({ name, src }: { name: string; src?: string }) {
  return (
    <span className="relative shrink-0">
      <AgentAvatar name={name} src={src} size={48} className="ring-1 ring-foreground/10" />
      <span
        className="absolute -bottom-0.5 -right-0.5 size-3.5 rounded-full border-2 border-background bg-emerald-500"
        title="Đang trực"
        aria-label="Đang trực"
      />
    </span>
  );
}

// Nhấn nháy nền nhẹ khi giá trị đổi — chỉ bật ở chế độ thời gian thực. Bg hiện nhanh rồi
// transition-colors làm mờ dần; không đổi layout (px bù bằng -mx).
function FlashOnChange({ value, active }: { value: string | number; active?: boolean }) {
  const [flash, setFlash] = useState(false);
  const prev = useRef(value);
  useEffect(() => {
    if (!active || prev.current === value) {
      prev.current = value;
      return;
    }
    prev.current = value;
    setFlash(true);
    const id = setTimeout(() => setFlash(false), 150);
    return () => clearTimeout(id);
  }, [value, active]);
  return (
    <span
      className={cn(
        "-mx-1 rounded px-1 transition-colors duration-700 motion-reduce:transition-none",
        flash && "bg-emerald-100",
      )}
    >
      {value}
    </span>
  );
}

// Badge LIVE ở header khi đang chạy thời gian thực.
function LiveBadge() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 ring-1 ring-emerald-200">
      <span className="size-1.5 rounded-full bg-emerald-500 motion-safe:animate-pulse" aria-hidden />
      LIVE
    </span>
  );
}

export function DashboardScreen({ data = defaultData, live = false }: { data?: DashboardData; live?: boolean }) {
  const router = useRouter();
  const shopName = useAgentConfig((s) => s.config.shopName);
  const agentName = useAgentConfig((s) => s.config.identity.name);
  const agentAvatar = useAgentConfig((s) => s.config.identity.avatar);
  const maxVolume = data.hourlyVolume.length ? Math.max(...data.hourlyVolume.map((h) => h.count)) : 0;
  const totalIntent = data.intentBreakdown.reduce((s, i) => s + i.count, 0);
  const totalTodo = data.todo.handoff + data.todo.bigOrders + data.todo.payments;
  const maxUnits = data.topProducts.length ? Math.max(...data.topProducts.map((p) => p.units)) : 0;
  // Shop vừa onboarding: chưa có hoạt động nào → đổi giọng từ "báo cáo" sang "mời bắt đầu".
  const hasActivity =
    data.dailyReport.newChats > 0 || totalTodo > 0 || data.notableConversations.length > 0;

  return (
    <div className="mx-auto max-w-6xl space-y-8 pb-4">
      {/* Lede — header thống nhất: avatar agent đứng đầu ở mọi trạng thái, chỉ đổi phần nội dung. */}
      <header className="flex items-center gap-3.5">
        <AgentAvatarLive name={agentName} src={agentAvatar} />
        <div className="min-w-0 space-y-1">
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>{shopName} · hôm nay {data.dailyReport.date}</span>
            {live && <LiveBadge />}
          </p>
          {hasActivity ? (
            <h1 className="text-pretty text-lg font-semibold sm:text-xl">
              <span className="text-foreground">{agentName}</span> đã tư vấn{" "}
              <span className="text-foreground">{data.dailyReport.newChats} hội thoại</span>, chốt{" "}
              <span className="text-foreground">{data.kpis.find((k) => k.key === "closed_orders")?.value ?? 0} đơn</span>.{" "}
              {totalTodo > 0 ? (
                <>Bạn có <span className="text-amber-600">{totalTodo} việc</span> cần xử lý.</>
              ) : (
                <>Không có việc nào cần bạn lúc này.</>
              )}
            </h1>
          ) : (
            <>
              <h1 className="text-pretty text-lg font-semibold sm:text-xl">
                <span className="text-foreground">{agentName}</span> đang trực kênh, sẵn sàng trả lời khách
              </h1>
              <p className="text-sm text-muted-foreground">
                Chưa có hội thoại nào hôm nay. Số liệu sẽ hiện ngay khi có khách nhắn.
              </p>
            </>
          )}
        </div>
      </header>

      {/* 1 — Cần làm hôm nay */}
      <section className="space-y-3" aria-labelledby="todo-h">
        <h2 id="todo-h" className="text-lg font-semibold">Cần làm hôm nay</h2>
        {totalTodo === 0 ? (
          hasActivity ? (
            <div className="flex items-center gap-3 rounded-xl bg-emerald-50 px-4 py-5 text-emerald-800 ring-1 ring-emerald-200">
              <CheckCircle2 className="size-5 shrink-0" aria-hidden />
              <p className="text-sm font-medium">Tất cả đã xử lý xong — agent đang chạy tốt.</p>
            </div>
          ) : (
            <SectionEmpty
              icon={Inbox}
              title="Chưa có việc nào cần bạn"
              description="Agent đang tự xử lý hội thoại. Gặp ca cần bạn — chuyển máy, đơn lớn, thanh toán — nó sẽ đưa lên đây."
            />
          )
        ) : (
          <div className="grid gap-4 sm:grid-cols-3">
            {TODO_ITEMS.map((item) => {
              const count = data.todo[item.key];
              const Icon = item.icon;
              const active = count > 0;
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => router.push(item.href)}
                  aria-label={`${item.label}: ${count} việc — xử lý ngay`}
                  className={cn(
                    "group flex cursor-pointer flex-col gap-3 rounded-xl bg-card p-4 text-left ring-1 transition duration-200",
                    "focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 motion-safe:hover:-translate-y-0.5",
                    active
                      ? "ring-amber-300/70 hover:ring-amber-400 hover:shadow-sm"
                      : "ring-foreground/10 hover:ring-foreground/20",
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={cn(
                        "flex size-9 items-center justify-center rounded-lg",
                        active ? "bg-amber-100 text-amber-700" : "bg-muted text-muted-foreground",
                      )}
                    >
                      <Icon className="size-4.5" aria-hidden />
                    </span>
                    <span className={cn("text-2xl font-semibold tabular-nums", active ? "text-foreground" : "text-muted-foreground")}>
                      {count}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium">{item.label}</p>
                    <p className="text-xs text-muted-foreground">{item.hint}</p>
                  </div>
                  <span className="flex items-center gap-1 text-xs font-medium text-muted-foreground transition-colors group-hover:text-foreground">
                    Xử lý ngay
                    <ArrowRight className="size-3.5 transition-transform duration-200 motion-safe:group-hover:translate-x-0.5" aria-hidden />
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </section>

      {/* 2 — Báo cáo trong ngày: KPI */}
      <section className="space-y-3" aria-labelledby="kpi-h">
        <h2 id="kpi-h" className="text-lg font-semibold">Báo cáo trong ngày</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {data.kpis.map((kpi) => {
            const meta = KPI_META[kpi.key] ?? { icon: TrendingUp, chip: "bg-muted text-muted-foreground" };
            const Icon = meta.icon;
            const value = kpi.key === "revenue" ? formatVND(kpi.value) : kpi.value.toLocaleString("vi-VN");
            const up = kpi.deltaPct >= 0;
            const Delta = up ? TrendingUp : TrendingDown;
            return (
              <Card key={kpi.key} size="sm">
                <CardContent className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">{kpi.label}</span>
                    <span className={cn("flex size-7 items-center justify-center rounded-lg", meta.chip)}>
                      <Icon className="size-4" aria-hidden />
                    </span>
                  </div>
                  <p className="text-xl font-semibold tabular-nums">
                    <FlashOnChange value={value} active={live} />
                  </p>
                  {hasActivity ? (
                    <p className={cn("flex items-center gap-1 text-xs font-medium", up ? "text-emerald-600" : "text-destructive")}>
                      <Delta className="size-3.5" aria-hidden />
                      {Math.abs(kpi.deltaPct)}% <span className="text-muted-foreground">so với hôm qua</span>
                    </p>
                  ) : (
                    <p className="text-xs text-muted-foreground">Chưa đủ dữ liệu để so sánh</p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* 3 — Ba biểu đồ trong ngày: volume theo giờ · phân loại nhu cầu · sản phẩm bán chạy */}
      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card size="sm">
          <CardHeader>
            <CardTitle>Hội thoại theo giờ</CardTitle>
            <CardDescription>Số hội thoại agent tiếp nhận trong ngày</CardDescription>
          </CardHeader>
          <CardContent>
            {data.hourlyVolume.length === 0 ? (
              <SectionEmpty
                icon={BarChart3}
                title="Chưa có hội thoại nào hôm nay"
                description="Biểu đồ theo giờ sẽ hiện khi có hội thoại đầu tiên trong ngày."
              />
            ) : (
            <div
              className="flex items-end gap-2"
              role="img"
              aria-label={`Hội thoại theo giờ: ${data.hourlyVolume.map((h) => `${h.hour} có ${h.count}`).join(", ")}`}
            >
              {data.hourlyVolume.map((h) => {
                const peak = h.count === maxVolume;
                return (
                  <div key={h.hour} className="group/bar relative flex flex-1 flex-col items-center gap-1.5">
                    {/* Tooltip hover (bổ trợ — số vẫn in thẳng phía trên cột) */}
                    <span className="pointer-events-none absolute -top-1 z-10 -translate-y-full rounded-md bg-foreground px-2 py-1 text-[11px] font-medium whitespace-nowrap text-background opacity-0 shadow-sm transition-opacity duration-150 group-hover/bar:opacity-100">
                      {h.hour} · {h.count} hội thoại
                    </span>
                    <span className={cn("text-[11px] font-medium tabular-nums", peak ? "text-sky-700" : "text-muted-foreground")}>
                      {h.count}
                    </span>
                    <div
                      className={cn(
                        "w-full rounded-t transition-[height] duration-300 motion-reduce:transition-none",
                        peak ? "bg-sky-600" : "bg-sky-400 group-hover/bar:bg-sky-500",
                      )}
                      style={{ height: `${Math.max(6, Math.round((h.count / maxVolume) * 120))}px` }}
                    />
                    <span className="text-[10px] text-muted-foreground">{h.hour.slice(0, 2)}h</span>
                  </div>
                );
              })}
            </div>
            )}
          </CardContent>
        </Card>

        <Card size="sm">
          <CardHeader>
            <CardTitle>Khách hỏi về gì</CardTitle>
            <CardDescription>Phân loại nhu cầu hội thoại</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2.5">
            {data.intentBreakdown.length === 0 ? (
              <SectionEmpty
                icon={PieChart}
                title="Chưa đủ hội thoại để phân loại"
                description="Agent sẽ tự gom nhóm khách hỏi gì nhiều nhất khi có hội thoại."
              />
            ) : null}
            {data.intentBreakdown.map((i, idx) => {
              const pct = Math.round((i.count / totalIntent) * 100);
              return (
                <div key={i.intent} className="space-y-1" title={`${i.intent}: ${i.count} (${pct}%)`}>
                  <div className="flex justify-between text-xs">
                    <span className="flex items-center gap-1.5">
                      <span className={cn("size-2 shrink-0 rounded-full", INTENT_COLORS[idx % INTENT_COLORS.length])} aria-hidden />
                      {i.intent}
                    </span>
                    <span className="tabular-nums text-muted-foreground">{i.count} · {pct}%</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-muted">
                    <div className={cn("h-full rounded-full", INTENT_COLORS[idx % INTENT_COLORS.length])} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Sản phẩm bán chạy — cùng hàng với hai biểu đồ trên */}
        <Card size="sm">
          <CardHeader>
            <CardTitle>Sản phẩm bán chạy</CardTitle>
            <CardDescription>Xếp theo số lượng đã bán hôm nay</CardDescription>
          </CardHeader>
          <CardContent className="space-y-1">
            {data.topProducts.length === 0 ? (
              <SectionEmpty
                icon={Package}
                title="Chưa bán được sản phẩm nào"
                description="Khi agent chốt đơn, sản phẩm bán chạy sẽ được xếp hạng ở đây."
              />
            ) : null}
            {data.topProducts.map((p, idx) => {
              const pct = maxUnits ? Math.round((p.units / maxUnits) * 100) : 0;
              const top = idx === 0;
              return (
                <button
                  key={p.productId}
                  type="button"
                  onClick={() => router.push("/products")}
                  aria-label={`${p.name}: đã bán ${p.units}, doanh thu ${formatVND(p.revenue)}`}
                  className={cn(
                    "group flex w-full cursor-pointer items-center gap-3 rounded-lg px-2 py-2 text-left transition-colors duration-150 hover:bg-muted focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                    live && "motion-safe:animate-in motion-safe:fade-in motion-safe:duration-300",
                  )}
                >
                  <span
                    className={cn(
                      "flex size-7 shrink-0 items-center justify-center rounded-lg text-sm font-semibold tabular-nums",
                      top ? "bg-emerald-100 text-emerald-700" : "bg-muted text-muted-foreground",
                    )}
                  >
                    {idx + 1}
                  </span>
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-center justify-between gap-2 text-sm">
                      <span className="truncate font-medium">{p.name}</span>
                      <span className="shrink-0 tabular-nums text-muted-foreground">
                        <FlashOnChange value={`${p.units} đã bán`} active={live} />
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                        <div
                          className={cn("h-full rounded-full transition-[width] duration-300 motion-reduce:transition-none", top ? "bg-emerald-600" : "bg-emerald-400")}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="shrink-0 text-xs tabular-nums text-muted-foreground">{formatVND(p.revenue)}</span>
                    </div>
                  </div>
                </button>
              );
            })}
          </CardContent>
        </Card>
      </section>

      {/* 4 — Hội thoại đáng chú ý + Card học (G2) */}
      <section className="grid gap-4 lg:grid-cols-3">
        <Card size="sm" className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Hội thoại đáng chú ý</CardTitle>
            <CardDescription>Trường hợp nên xem lại trong hôm nay</CardDescription>
          </CardHeader>
          <CardContent className="space-y-1">
            {data.notableConversations.length === 0 ? (
              <SectionEmpty
                icon={MessageSquare}
                title="Chưa có hội thoại nào đáng chú ý"
                description="Agent sẽ ghim các ca cần xem lại — đơn lớn, khiếu nại, khách trả giá — ngay khi xuất hiện."
              />
            ) : null}
            {data.notableConversations.map((c) => (
              <button
                key={c.conversationId}
                type="button"
                onClick={() => router.push(`/inbox?c=${c.conversationId}`)}
                className={cn(
                  "flex w-full cursor-pointer items-center justify-between gap-3 rounded-lg px-2 py-2 text-left transition-colors duration-150 hover:bg-muted focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                  live && "motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-top-1 motion-safe:duration-300",
                )}
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{c.customerName}</p>
                  <p className="truncate text-xs text-muted-foreground">{c.note}</p>
                </div>
                <ArrowRight className="size-4 shrink-0 text-muted-foreground" aria-hidden />
              </button>
            ))}
          </CardContent>
        </Card>

        {/* G2 — Agent đã học N điều hôm nay */}
        <button
          type="button"
          onClick={() => router.push("/agent-config?tab=learning")}
          aria-label={`Agent đã học ${data.learnedToday} điều hôm nay — xem nhật ký học`}
          className="group flex cursor-pointer flex-col justify-between gap-4 rounded-xl bg-card p-4 text-left ring-1 ring-foreground/10 transition duration-200 hover:ring-foreground/20 hover:shadow-sm focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 motion-safe:hover:-translate-y-0.5"
        >
          <span className="flex size-9 items-center justify-center rounded-lg bg-violet-100 text-violet-700">
            {data.learnedToday > 0 ? (
              <GraduationCap className="size-4.5" aria-hidden />
            ) : (
              <Sparkles className="size-4.5" aria-hidden />
            )}
          </span>
          <div>
            <p className="text-2xl font-semibold tabular-nums">{data.learnedToday}</p>
            <p className="text-sm font-medium">điều agent học được hôm nay</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {data.learnedToday > 0
                ? "Cần bạn duyệt trước khi áp dụng"
                : "Agent sẽ ghi lại điều mới học và xin bạn duyệt"}
            </p>
          </div>
          <span className="flex items-center gap-1 text-xs font-medium text-muted-foreground transition-colors group-hover:text-foreground">
            Xem nhật ký học
            <ArrowRight className="size-3.5 transition-transform duration-200 motion-safe:group-hover:translate-x-0.5" aria-hidden />
          </span>
        </button>
      </section>
    </div>
  );
}
