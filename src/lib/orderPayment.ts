// Nguồn CHUNG nối Đơn ↔ Thanh toán (1 khoản thu / 1 đơn, khoá theo orderId).
// Mục tiêu: "diễn biến thanh toán" và trạng thái thu tiền hiển thị GIỐNG NHAU ở cả
// panel Quản lý đơn lẫn panel Thanh toán — một nguồn, không để hai nơi tự kể khác nhau.

import paymentsRaw from "@/data/payments.json";
import {
  payState,
  paymentTimeline,
  toPayment,
  type Payment,
  type PaymentSeed,
  type PayState,
} from "@/components/payments/meta";

// Map orderId → khoản thu (runtime, đã gắn gate). Tất định, dựng 1 lần.
const PAYMENT_BY_ORDER: Record<string, Payment> = Object.fromEntries(
  (paymentsRaw.queue as PaymentSeed[]).map((s) => [s.orderId, toPayment(s)]),
);

// Khoản thu của một đơn — null khi đơn chưa sinh khoản thanh toán nào.
export const paymentForOrder = (orderId: string): Payment | null => PAYMENT_BY_ORDER[orderId] ?? null;

// Trạng thái thu tiền của đơn (pending/sent/paid/rejected) — cùng thang với màn Thanh toán.
export const orderPayState = (orderId: string): PayState | null => {
  const p = PAYMENT_BY_ORDER[orderId];
  return p ? payState(p) : null;
};

export { payState, paymentTimeline };
