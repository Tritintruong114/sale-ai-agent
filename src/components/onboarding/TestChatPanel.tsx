"use client";

import { useState } from "react";
import { Bot } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ChatWindow } from "@/components/shared/chat/ChatWindow";
import type { ChatMessage } from "@/components/shared/chat/MessageBubble";
import { buildTestReplies, type DraftProduct } from "@/data/onboarding";

let seq = 0;
const nextId = () => `tc-${seq++}`;
const TYPING_ID = "tc-typing";

// Bản chat thử nội tuyến (inline) — không còn là pop-up. Hiển thị ngay trong card
// onboarding để chủ shop thấy agent vừa học được gì, liền mạch với luồng training.
export function TestChatPanel({
  agentName,
  pronoun,
  product,
}: {
  agentName: string;
  pronoun: string;
  product?: DraftProduct;
}) {
  const replies = buildTestReplies({ agentName, pronoun, product });
  const greeting = `Dạ ${pronoun || "em"} chào anh/chị, ${pronoun || "em"} là ${agentName}, anh/chị cần tư vấn gì ạ?`;

  // Gợi ý câu khách hay nhắn để chủ shop test nhanh thông tin sản phẩm.
  const suggestions = [
    product ? `${product.name} giá bao nhiêu?` : "Sản phẩm này giá bao nhiêu?",
    "Còn hàng không shop?",
    "Tư vấn giúp mình với",
  ];

  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: nextId(), role: "agent", text: greeting },
  ]);
  const [step, setStep] = useState(0);
  const [typing, setTyping] = useState(false);

  const handleSend = (text: string) => {
    const reply = replies[Math.min(step, replies.length - 1)];
    setStep((s) => s + 1);
    setTyping(true);
    setMessages((m) => [
      ...m,
      { id: nextId(), role: "customer", text },
      { id: TYPING_ID, role: "typing", text: "" },
    ]);
    setTimeout(() => {
      setTyping(false);
      setMessages((m) => {
        const base = m.filter((x) => x.id !== TYPING_ID);
        if (reply.kind === "agent") {
          return [...base, { id: nextId(), role: "agent", text: reply.text }];
        }
        return [
          ...base,
          { id: nextId(), role: "system", text: `Cần người: ${reply.reason} — đã chuyển cho bạn` },
        ];
      });
    }, 800);
  };

  return (
    <div className="flex flex-col overflow-hidden rounded-xl border">
      <div className="flex flex-row items-center gap-3 border-b px-4 py-3">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Bot className="size-4" aria-hidden />
        </span>
        <div className="min-w-0">
          <p className="truncate text-base font-semibold leading-tight">{agentName}</p>
          <Badge variant="secondary" className="mt-0.5 font-normal">
            Bản thử · không gửi cho khách thật
          </Badge>
        </div>
      </div>
      <div className="h-[28rem]">
        <ChatWindow
          messages={messages}
          onSend={handleSend}
          disabled={typing}
          placeholder="Hỏi thử về giá, tồn kho, cách dùng…"
          header={
            <div className="space-y-2 border-b bg-muted/40 px-3 py-2">
              <p className="text-xs text-muted-foreground">
                Nhắn thử như khách hỏi về sản phẩm — xem agent tư vấn đã đúng chưa.
              </p>
              {step === 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {suggestions.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => handleSend(s)}
                      disabled={typing}
                      className="rounded-full border border-dashed px-2.5 py-1 text-xs text-muted-foreground/70 transition-colors hover:border-solid hover:bg-background hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>
          }
        />
      </div>
    </div>
  );
}
