import { redirect } from "next/navigation";
import paymentsRaw from "@/data/payments.json";
import type { PaymentSeed } from "@/components/payments/meta";

// Màn "Giao dịch" đã gộp vào "Quản lý đơn" — thu tiền (duyệt gửi QR, đánh dấu đã nhận, xem QR, diễn biến)
// sống trong panel đơn. Giữ route để khỏi vỡ deep-link cũ: tra orderId từ id khoản thu (?p=) rồi chuyển về /orders.
export default async function PaymentsPage({
  searchParams,
}: {
  searchParams: Promise<{ p?: string }>;
}) {
  const { p } = await searchParams;
  const orderId = p ? (paymentsRaw.queue as PaymentSeed[]).find((s) => s.id === p)?.orderId : undefined;
  redirect(orderId ? `/orders?o=${orderId}` : "/orders");
}
