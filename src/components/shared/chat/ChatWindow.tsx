"use client";

import { useEffect, useRef } from "react";
import { MessageBubble } from "./MessageBubble";
import type { ChatMessage } from "./types";
import { Composer } from "./Composer";

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
}) {
  const endRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const pickQuickReply = onQuickReply ?? onSend;

  return (
    <div className="flex h-full flex-col">
      {header}
      <div className="flex-1 space-y-2 overflow-auto p-3">
        {messages.map((m) => (
          <MessageBubble key={m.id} message={m} ownRole={ownRole} />
        ))}
        <div ref={endRef} />
      </div>
      {quickReplies && quickReplies.length > 0 ? (
        <div className="flex flex-wrap gap-1.5 border-t bg-muted/40 px-3 py-2">
          {quickReplies.map((q) => (
            <button
              key={q}
              type="button"
              onClick={() => pickQuickReply(q)}
              disabled={disabled}
              className="rounded-full border border-dashed px-2.5 py-1 text-xs text-muted-foreground/80 transition-colors hover:border-solid hover:bg-background hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
            >
              {q}
            </button>
          ))}
        </div>
      ) : null}
      <Composer onSend={onSend} disabled={disabled} placeholder={placeholder} draft={draft} />
    </div>
  );
}
