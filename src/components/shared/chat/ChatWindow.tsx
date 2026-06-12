"use client";

import { useEffect, useRef } from "react";
import { MessageBubble } from "./MessageBubble";
import type { ApplyAction, ChatMessage } from "./types";
import { Composer, type ComposerOptions } from "./Composer";

export function ChatWindow({
  messages,
  onSend,
  disabled,
  header,
  placeholder,
  ownRole = "customer",
  draft,
  quickReplies,
  onQuickReply,
  onApply,
  composer,
}: {
  messages: ChatMessage[];
  onSend: (text: string) => void;
  disabled?: boolean;
  header?: React.ReactNode;
  placeholder?: string;
  // Phía "mình" để canh phải/màu primary — xem MessageBubble.
  ownRole?: "customer" | "agent";
  // Tin nhắn soạn sẵn đẩy vào ô nhập (xem Composer).
  draft?: { text: string; nonce: number } | null;
  // Chip trả lời nhanh hiện ngay trên ô nhập (vd agent hỏi → user chọn). Mặc định bấm = gửi.
  quickReplies?: string[];
  onQuickReply?: (text: string) => void;
  // Bấm nút "Apply" gắn dưới một tin agent (vd áp câu mẫu gợi ý vào tình huống bàn giao).
  onApply?: (messageId: string, action: ApplyAction) => void;
  // Bật tính năng "khung chat thật" cho ô nhập (đính kèm, chọn model, giọng nói). Xem Composer.
  composer?: ComposerOptions;
}) {
  const endRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const pickQuickReply = onQuickReply ?? onSend;

  return (
    <div className="flex h-full flex-col">
      {header}
      <div className="flex-1 space-y-2 overflow-auto p-3 scrollbar-hide">
        {messages.map((m) => (
          <MessageBubble key={m.id} message={m} ownRole={ownRole} onApply={onApply} />
        ))}
        <div ref={endRef} />
      </div>
      {quickReplies && quickReplies.length > 0 ? (
        <div className="flex flex-row gap-1.5 overflow-x-auto border-t bg-muted/40 px-3 py-2 scrollbar-hide">
          {quickReplies.map((q) => (
            <button
              key={q}
              type="button"
              onClick={() => pickQuickReply(q)}
              disabled={disabled}
              className="shrink-0 whitespace-nowrap rounded-full border px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:border-foreground/30 hover:bg-background hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
            >
              {q}
            </button>
          ))}
        </div>
      ) : null}
      <Composer onSend={onSend} disabled={disabled} placeholder={placeholder} draft={draft} {...composer} />
    </div>
  );
}
