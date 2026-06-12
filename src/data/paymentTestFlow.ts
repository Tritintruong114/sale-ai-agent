// Kịch bản "Kiểm tra với Agent" — tất định, mock (§nguyên tắc 4, không random).
// Đóng vai khách chốt đơn → agent tổng hợp đơn, gửi mã QR thanh toán thật (kèm thông tin shop),
// chờ khách xác nhận đã chuyển → agent đối soát và báo đã nhận tiền. KHÔNG phát sinh giao dịch thật.
// Driver ở AgentChatContent phát từng emission theo thứ tự (giống re-train).

import type { RetrainTurn } from "./retrainFlow";
import { SHOP_BANK } from "@/components/payments/meta";
import { formatVND } from "@/lib/format";

// Tin khách mở màn (chủ shop bấm "Mở chat kiểm tra" → gửi giúp tin này).
export const PAYMENT_TEST_MESSAGE = "Mình chốt đơn này nhé, gửi mình thông tin thanh toán với ạ";

// Câu khách xác nhận đã chuyển — cũng là chip trả lời nhanh ở lượt giữa.
export const PAYMENT_TEST_PAID_REPLY = "Mình chuyển khoản rồi nhé";

// Đơn mẫu cho luồng kiểm tra — cố định để tất định.
const SAMPLE_ITEMS = "Cam sành 2kg · 1 phần";
const SAMPLE_AMOUNT = 150_000;
const SAMPLE_MEMO = "TT DH TEST";

export function buildPaymentTestFlow(agentName: string, pronoun: string): RetrainTurn[] {
  const p = pronoun || "em";
  const amount = SAMPLE_AMOUNT;
  return [
    // Lượt 0 — tổng hợp đơn, gửi mã QR, chờ khách chuyển khoản.
    {
      emissions: [
        {
          kind: "reasoning",
          text: "Đang tổng hợp đơn và tạo mã QR thanh toán…",
          steps: ["Xác nhận sản phẩm & số lượng", "Tính tổng tiền (đã gồm phí ship)", "Tạo mã QR theo tài khoản shop"],
        },
        {
          kind: "agent",
          text: `Dạ ${p} xác nhận đơn của mình gồm:\n**${SAMPLE_ITEMS}**\nTổng thanh toán: **${formatVND(amount)}** (đã gồm phí ship)\n\n${p} gửi mã QR để mình chuyển khoản nhé ạ:`,
        },
        {
          kind: "payment",
          payment: {
            seed: `agent-test-${amount}-${SAMPLE_MEMO}`,
            items: SAMPLE_ITEMS,
            amount,
            bank: SHOP_BANK.bank,
            accountNo: SHOP_BANK.accountNo,
            holder: SHOP_BANK.holder,
            memo: SAMPLE_MEMO,
            status: "pending",
          },
        },
        {
          kind: "agent",
          text: `Mình quét mã hoặc chuyển theo thông tin trên giúp ${p} nhé. Chuyển xong mình nhắn ${p} để ${p} đối soát và xác nhận ngay ạ.`,
        },
      ],
      quickReplies: [PAYMENT_TEST_PAID_REPLY],
    },
    // Lượt 1 (cuối) — đối soát giao dịch, báo đã nhận tiền, xác nhận đơn.
    {
      emissions: [
        { kind: "tool", label: "Đối soát giao dịch", target: SAMPLE_MEMO },
        {
          kind: "agent",
          text: `Dạ ${p} đã nhận được thanh toán **${formatVND(amount)}** rồi ạ. Cảm ơn anh/chị, ${p} chuyển đơn cho bộ phận đóng gói và giao ngay. Khi hàng được gửi ${p} sẽ báo mã vận đơn cho mình nhé ạ.`,
        },
      ],
    },
  ];
}
