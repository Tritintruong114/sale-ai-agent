// Kịch bản "Gợi ý ví dụ khách nói" cho một tình huống bàn giao — tất định, mock (không random).
// Manager Agent suy nghĩ → đề xuất vài câu khách thường nói → gắn nút Apply để chủ shop áp thẳng
// vào tình huống bàn giao. KHÔNG sửa dữ liệu thật ở đây; việc ghi xảy ra khi bấm Apply (agentConfigStore).

import type { ApplyAction } from "@/components/shared/chat/types";
import type { RetrainTurn } from "./retrainFlow";

// Câu mẫu theo từ khoá trong nhãn/mô tả tình huống — bám các tình huống bàn giao hay gặp ở shop bán hàng.
const PHRASE_BANK: { match: RegExp; phrases: string[] }[] = [
  {
    match: /bảo hành|warranty/i,
    phrases: [
      "Sản phẩm này bảo hành bao lâu vậy shop?",
      "Bị lỗi thì bảo hành thế nào ạ?",
      "Cho mình hỏi điều kiện bảo hành với",
      "Hết hạn bảo hành có sửa được không?",
    ],
  },
  {
    match: /đổi|trả|hoàn|refund/i,
    phrases: [
      "Mình muốn đổi sang sản phẩm khác được không?",
      "Hàng không vừa ý trả lại được không ạ?",
      "Quy định đổi trả của shop thế nào?",
      "Mua rồi đổi mẫu khác có được không?",
    ],
  },
  {
    match: /giao|ship|vận chuyển|tỉnh|đơn hàng/i,
    phrases: [
      "Ship về tỉnh mất bao lâu vậy shop?",
      "Phí giao hàng bao nhiêu ạ?",
      "Có giao trong ngày không shop?",
      "Đơn của mình giờ tới đâu rồi ạ?",
    ],
  },
  {
    match: /giá|sỉ|chiết khấu|số lượng|khuyến mãi|giảm/i,
    phrases: [
      "Lấy số lượng nhiều có giá sỉ không ạ?",
      "Đơn này được giảm thêm không shop?",
      "Có chương trình khuyến mãi nào không?",
      "Mua nhiều bớt chút được không ạ?",
    ],
  },
  {
    match: /khiếu nại|phàn nàn|hư|hỏng|dập|lỗi/i,
    phrases: [
      "Hàng mình nhận bị hư rồi shop ơi",
      "Sản phẩm bị lỗi, shop xử lý giúp mình với",
      "Mình không hài lòng về đơn này",
      "Đồ giao tới bị dập một phần ạ",
    ],
  },
];

// Không khớp từ khoá nào → câu chung bám nhãn tình huống, để chủ shop chỉnh lại cho sát.
const generic = (label: string): string[] => {
  const it = (label || "vấn đề này").toLowerCase();
  return [
    `Mình cần hỏi về ${it}`,
    `Shop tư vấn giúp mình vụ ${it} với`,
    `Cho mình gặp người phụ trách ${it} ạ`,
    "Mình có việc cần shop hỗ trợ trực tiếp",
  ];
};

// Sinh ví dụ câu khách thường nói cho một tình huống — tất định theo nhãn + mô tả.
export function suggestedPhrasesFor(label: string, description?: string): string[] {
  const hay = `${label} ${description ?? ""}`;
  return PHRASE_BANK.find((b) => b.match.test(hay))?.phrases ?? generic(label);
}

// Một lượt: Manager suy nghĩ rồi đề xuất danh sách câu mẫu, kèm nút Apply (ApplyAction) ở tin cuối.
export function buildSuggestFlow(opts: {
  ruleKey: string;
  label: string;
  description?: string;
  agentName: string;
}): RetrainTurn[] {
  const phrases = suggestedPhrasesFor(opts.label, opts.description);
  const apply: ApplyAction = {
    kind: "handoffPhrases",
    ruleKey: opts.ruleKey,
    label: opts.label,
    description: opts.description,
    phrases,
  };
  const list = phrases.map((p) => `• ${p}`).join("\n");
  return [
    {
      emissions: [
        {
          kind: "reasoning",
          text: `Đang xem tình huống "${opts.label}" và các câu khách thường nói tương tự…`,
          steps: ["Đọc mô tả tình huống", "Tham khảo hội thoại tương tự", "Soạn ví dụ câu khách nói"],
        },
        {
          kind: "agent",
          text: `Mình gợi ý vài câu khách thường nói cho tình huống **${opts.label}**:\n\n${list}\n\nBấm Apply để thêm vào tình huống này, rồi bạn chỉnh thêm nếu cần nhé.`,
          apply,
        },
      ],
    },
  ];
}
