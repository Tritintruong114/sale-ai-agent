"use client";

import { useState } from "react";
import { Bot } from "lucide-react";
import { ChatWindow } from "@/components/shared/chat/ChatWindow";
import type { ChatMessage } from "@/components/shared/chat/MessageBubble";
import { useAgentConfig } from "@/store/agentConfigStore";
import type { DraftProduct } from "@/data/onboarding";

let seq = 0;
const nextId = () => `tc-${seq++}`;
const TYPING_ID = "tc-typing";

// Câu dự phòng khi API lỗi (chưa cấu hình key / hết quota) — giữ bản thử không gãy.
const FALLBACK_REPLIES = [
  "Dạ em cảm ơn anh/chị đã quan tâm ạ. Anh/chị cho em xin nhu cầu cụ thể để em tư vấn kỹ hơn nhé ạ.",
  "Dạ bên em luôn ưu tiên hàng tươi mới về ạ. Anh/chị ở khu vực nào để em báo phí ship giúp ạ?",
];

// Bản chat thử nội tuyến (inline) ở màn "Agent đã sẵn sàng" — chủ shop đóng vai khách nhắn thử.
// Gọi thẳng /api/chat (persona "assistant" — tư vấn viên đọc hồ sơ shop), GIỐNG khung "Talk to Agent".
// Không có kịch bản/bàn giao mock: agent trả lời thật theo cấu hình vừa tạo.
export function TestChatPanel({
  agentName,
  pronoun,
  product,
}: {
  agentName: string;
  pronoun: string;
  product?: DraftProduct;
}) {
  const config = useAgentConfig((s) => s.config);
  const me = pronoun || "em";
  const greeting =
    config.identity.greeting?.trim() ||
    `Dạ ${me} chào anh/chị ạ, ${me} là ${agentName}. Anh/chị cần ${me} tư vấn gì ạ?`;

  // Gợi ý đúng kiểu tin khách hay nhắn fanpage — bám TÊN sản phẩm cho cụ thể.
  const item = product?.name ?? "loại này";
  const suggestions = [
    `${item} bao nhiêu 1kg shop ơi?`,
    `${item} còn hàng giao nay không shop?`,
    `Đặt 2kg ${item} giao chiều nay nha shop`,
  ];

  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: nextId(), role: "agent", text: greeting },
  ]);
  const [sent, setSent] = useState(false);
  const [typing, setTyping] = useState(false);
  const [fallbackStep, setFallbackStep] = useState(0);

  // Model có thể tách câu trả lời bằng [NEXT] → phát từng tin, kèm hiệu ứng "đang gõ" cho tự nhiên.
  const pushReply = (reply: string) => {
    const chunks = reply.split(/\n*\s*\[NEXT\]\s*\n*/i).map((c) => c.trim()).filter(Boolean);
    const playChunk = (i: number) => {
      if (i >= chunks.length) {
        setTyping(false);
        setMessages((m) => m.filter((x) => x.id !== TYPING_ID));
        return;
      }
      setTyping(true);
      setMessages((m) => (m.some((x) => x.id === TYPING_ID) ? m : [...m, { id: TYPING_ID, role: "typing", text: "" }]));
      const delay = Math.min(1300, 450 + chunks[i].length * 10);
      setTimeout(() => {
        setMessages((m) => [...m.filter((x) => x.id !== TYPING_ID), { id: nextId(), role: "agent", text: chunks[i] }]);
        playChunk(i + 1);
      }, delay);
    };
    playChunk(0);
  };

  const handleSend = async (text: string) => {
    setSent(true);

    // Lịch sử gửi cho model — chỉ lấy tin agent/khách, map sang role chuẩn.
    const history = messages
      .filter((m) => m.role === "agent" || m.role === "customer")
      .map((m) => ({ role: m.role === "agent" ? ("assistant" as const) : ("user" as const), content: m.text }));

    setTyping(true);
    setMessages((m) => [
      ...m,
      { id: nextId(), role: "customer", text },
      { id: TYPING_ID, role: "typing", text: "" },
    ]);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...history, { role: "user", content: text }],
          agent: {
            name: agentName,
            pronoun,
            tone: config.identity.tone,
            shopName: config.shopName,
            shopType: config.shopType,
            shopAddress: config.shopAddress,
            shopPhone: config.shopPhone,
            bannedWords: config.identity.bannedWords,
            businessProfile: config.businessProfile,
            persona: "assistant",
          },
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.reply) throw new Error(data.error || "Lỗi gọi API");
      pushReply(data.reply);
    } catch {
      // Dự phòng: API lỗi (chưa có key, hết quota…) → câu mẫu để luồng không gãy.
      pushReply(FALLBACK_REPLIES[fallbackStep % FALLBACK_REPLIES.length]);
      setFallbackStep((s) => s + 1);
    }
  };

  return (
    <div className="flex flex-col overflow-hidden rounded-xl border">
      <div className="flex flex-row items-center gap-3 border-b px-4 py-3">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Bot className="size-4" aria-hidden />
        </span>
        <div className="min-w-0">
          <p className="truncate text-base font-semibold leading-tight">{agentName}</p>
        </div>
      </div>
      <div className="h-[28rem]">
        <ChatWindow
          messages={messages}
          onSend={handleSend}
          disabled={typing}
          placeholder="Hỏi thử về giá, còn hàng, cách đặt…"
          quickReplies={!sent ? suggestions : undefined}
          onQuickReply={handleSend}
        />
      </div>
    </div>
  );
}
