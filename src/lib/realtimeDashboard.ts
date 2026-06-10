"use client";

import { useEffect, useState } from "react";
import type { DashboardData } from "@/components/dashboard/DashboardScreen";
import emptyData from "@/data/dashboard.empty.json";
import convData from "@/data/conversations.json";

// Engine mô phỏng "thời gian thực" cho Dashboard nguyên mẫu: bắt đầu từ rỗng, mỗi nhịp
// cộng dồn số liệu như đang có khách nhắn. Thuần dữ liệu — không chạm backend.

const HOURS = ["08:00", "09:00", "10:00", "11:00", "12:00", "13:00"];
const INTENTS = ["Hỏi giá", "Tư vấn sản phẩm", "Chốt đơn", "Khiếu nại", "Khác"];
const MAX_CHATS = 42;

// Catalog rút gọn (bám products.json) — mỗi đơn chốt cộng 1 sản phẩm vào bảng bán chạy.
const PRODUCT_POOL = [
  { productId: "fr-sau-rieng-musanking", name: "Sầu riêng Musanking", price: 120_000 },
  { productId: "gio-gio-tinh-khoi", name: "Giỏ Tinh Khôi", price: 550_000 },
  { productId: "mam-mam-thanh-tan", name: "Mâm thanh tân", price: 450_000 },
];

// Pool hội thoại đáng chú ý — tái dùng khách hàng thật từ conversations.json.
const NOTABLE_POOL: DashboardData["notableConversations"] = convData.conversations.map((c) => ({
  conversationId: c.id,
  customerName: c.customerName,
  note: c.handoff?.reason ?? "Hội thoại mới agent vừa tiếp nhận",
}));

const clone = (d: DashboardData): DashboardData => JSON.parse(JSON.stringify(d)) as DashboardData;

// Baseline rỗng (cùng shape dashboard.empty.json) — điểm khởi đầu của realtime.
export function makeBaseline(): DashboardData {
  return clone(emptyData as unknown as DashboardData);
}

function addToHourly(next: DashboardData, add: number) {
  const hv = next.hourlyVolume;
  if (hv.length === 0) hv.push({ hour: HOURS[0], count: 0 });
  if (hv.length < HOURS.length && Math.random() < 0.4) hv.push({ hour: HOURS[hv.length], count: 0 });
  hv[hv.length - 1].count += add;
}

function addToIntent(next: DashboardData, add: number) {
  const ib = next.intentBreakdown;
  if (ib.length === 0) ib.push({ intent: INTENTS[0], count: 0 });
  if (ib.length < INTENTS.length && Math.random() < 0.5) ib.push({ intent: INTENTS[ib.length], count: 0 });
  ib[Math.floor(Math.random() * ib.length)].count += add;
}

const kpi = (next: DashboardData, key: string) => next.kpis.find((k) => k.key === key)!;

function addTopProduct(next: DashboardData, p: (typeof PRODUCT_POOL)[number]) {
  const tp = next.topProducts;
  let row = tp.find((r) => r.productId === p.productId);
  if (!row) {
    row = { productId: p.productId, name: p.name, units: 0, revenue: 0 };
    tp.push(row);
  }
  row.units += 1;
  row.revenue += p.price;
  tp.sort((a, b) => b.units - a.units);
}

// Một nhịp cập nhật — nhận trạng thái trước, trả trạng thái mới (không sửa tại chỗ).
export function tick(prev: DashboardData): DashboardData {
  const next = clone(prev);

  if (next.dailyReport.newChats < MAX_CHATS) {
    const add = 1 + Math.floor(Math.random() * 3); // 1..3 hội thoại mới
    next.dailyReport.newChats += add;
    kpi(next, "chats").value = next.dailyReport.newChats;
    addToHourly(next, add);
    addToIntent(next, add);
  }

  if (Math.random() < 0.5) {
    next.dailyReport.newCustomers += 1;
    kpi(next, "new_customers").value = next.dailyReport.newCustomers;
  }

  if (Math.random() < 0.35) {
    kpi(next, "closed_orders").value += 1;
    const product = PRODUCT_POOL[Math.floor(Math.random() * PRODUCT_POOL.length)];
    next.dailyReport.revenue += product.price;
    kpi(next, "revenue").value = next.dailyReport.revenue;
    addTopProduct(next, product);
  }

  if (Math.random() < 0.3 && next.notableConversations.length < 5) {
    const used = new Set(next.notableConversations.map((c) => c.conversationId));
    const pick = NOTABLE_POOL.find((p) => !used.has(p.conversationId));
    if (pick) next.notableConversations = [pick, ...next.notableConversations];
  }

  if (Math.random() < 0.15) next.learnedToday += 1;

  if (Math.random() < 0.2) {
    const keys = ["handoff", "bigOrders", "payments"] as const;
    const which = keys[Math.floor(Math.random() * keys.length)];
    if (next.todo[which] < 4) next.todo[which] += 1;
  }

  // Delta giả định "so với hôm qua" — dương nhẹ để dòng so sánh có nghĩa.
  for (const k of next.kpis) {
    k.deltaPct = k.value > 0 ? Math.min(40, 5 + (k.value % 17)) : 0;
  }

  return next;
}

// Hook: khi active chạy nhịp mỗi 2s (bắt đầu từ rỗng). restartKey đổi → chạy lại từ đầu.
// Reset baseline làm trong lúc render (đổi session key) thay vì trong effect — tránh
// setState-in-effect và đúng pattern "điều chỉnh state khi prop đổi" của React.
export function useRealtimeDashboard(active: boolean, restartKey = 0): DashboardData {
  const sessionKey = `${active}:${restartKey}`;
  const [snap, setSnap] = useState(() => ({ key: sessionKey, data: makeBaseline() }));

  if (snap.key !== sessionKey) {
    setSnap({ key: sessionKey, data: makeBaseline() });
  }

  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => {
      setSnap((prev) => ({ key: prev.key, data: tick(prev.data) }));
    }, 2000);
    return () => clearInterval(id);
  }, [active, restartKey]);

  return snap.data;
}
