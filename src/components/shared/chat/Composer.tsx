"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function Composer({
  onSend,
  disabled,
  placeholder = "Nhập tin nhắn…",
  draft,
}: {
  onSend: (text: string) => void;
  disabled?: boolean;
  placeholder?: string;
  // Tin nhắn soạn sẵn đẩy từ ngoài vào (vd "Train with Manager") — điền vào ô để người dùng xem rồi gửi.
  draft?: { text: string; nonce: number } | null;
}) {
  const [text, setText] = useState("");

  // Có lần đẩy draft mới (nonce khác) thì điền vào ô — chỉnh state khi prop đổi, không dùng effect (React pattern).
  const [seenNonce, setSeenNonce] = useState(0);
  if (draft && draft.nonce !== seenNonce) {
    setSeenNonce(draft.nonce);
    setText(draft.text);
  }

  const send = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    onSend(trimmed);
    setText("");
  };

  return (
    <div className="flex items-center gap-2 border-t p-2">
      <Input
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            send();
          }
        }}
        placeholder={placeholder}
        disabled={disabled}
      />
      <Button onClick={send} disabled={disabled || !text.trim()}>
        Gửi
      </Button>
    </div>
  );
}
