"use client";

import { useEffect, useId, useRef, useState } from "react";
import { ArrowUp, Mic, Paperclip, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";
import { cn } from "@/lib/utils";

export type ComposerModel = { id: string; label: string };

// Tùy chọn "khung chat thật" — bật rời cho từng nơi (side panel bật đủ; Inbox/onboarding để mặc định gọn).
export type ComposerOptions = {
  enableAttachments?: boolean; // đính kèm tệp (prototype: chip UI, không thực sự gửi lên API)
  enableVoice?: boolean; // nhập bằng giọng nói (Web Speech API — tự ẩn nếu trình duyệt không hỗ trợ)
  models?: ComposerModel[]; // danh sách model để chọn
  modelId?: string; // model đang chọn
  onModelChange?: (id: string) => void;
};

// Typings tối thiểu cho Web Speech API (không có sẵn trong lib dom mặc định).
type SpeechRecognitionLike = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  start: () => void;
  stop: () => void;
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
};

function getSpeechRecognitionCtor(): (new () => SpeechRecognitionLike) | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: new () => SpeechRecognitionLike;
    webkitSpeechRecognition?: new () => SpeechRecognitionLike;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

const MAX_TEXTAREA_H = 160; // px — quá ngưỡng thì cuộn trong ô thay vì giãn vô hạn.

export function Composer({
  onSend,
  disabled,
  placeholder = "Nhập tin nhắn…",
  draft,
  enableAttachments,
  enableVoice,
  models,
  modelId,
  onModelChange,
}: {
  onSend: (text: string) => void;
  disabled?: boolean;
  placeholder?: string;
  // Tin nhắn soạn sẵn đẩy từ ngoài vào (vd "Train with Manager") — điền vào ô để người dùng xem rồi gửi.
  draft?: { text: string; nonce: number } | null;
} & ComposerOptions) {
  const [text, setText] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [listening, setListening] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(false);

  const taRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const voiceBaseRef = useRef(""); // text trước khi bắt đầu đọc — nối transcript vào sau.
  const fileInputId = useId();

  // Có lần đẩy draft mới (nonce khác) thì điền vào ô — chỉnh state khi prop đổi, không dùng effect (React pattern).
  const [seenNonce, setSeenNonce] = useState(0);
  if (draft && draft.nonce !== seenNonce) {
    setSeenNonce(draft.nonce);
    setText(draft.text);
  }

  // Chỉ hiện nút mic khi trình duyệt hỗ trợ — phát hiện ở client sau hydrate (tránh control "chết"
  // và lệch SSR). Đây là đồng bộ "khả năng trình duyệt" → React, nên setState trong effect là đúng chỗ.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (enableVoice) setVoiceSupported(getSpeechRecognitionCtor() !== null);
  }, [enableVoice]);

  // Tự giãn chiều cao ô nhập theo nội dung (đến ngưỡng thì cuộn).
  useEffect(() => {
    const el = taRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, MAX_TEXTAREA_H)}px`;
  }, [text]);

  // Dừng nhận giọng nói khi unmount.
  useEffect(() => () => recognitionRef.current?.stop(), []);

  const canSend = !disabled && (text.trim().length > 0 || files.length > 0);

  const send = () => {
    if (!canSend) return;
    const trimmed = text.trim();
    // Prototype: tệp đính kèm chỉ là UI — gói tên tệp vào tin để luồng đọc được khi không có chữ.
    const fileNote = files.length > 0 ? `[Đính kèm: ${files.map((f) => f.name).join(", ")}]` : "";
    onSend([trimmed, fileNote].filter(Boolean).join("\n"));
    setText("");
    setFiles([]);
  };

  const onPickFiles = (list: FileList | null) => {
    if (!list || list.length === 0) return;
    setFiles((prev) => [...prev, ...Array.from(list)]);
    if (fileRef.current) fileRef.current.value = ""; // cho phép chọn lại cùng tệp.
  };

  const toggleVoice = () => {
    const Ctor = getSpeechRecognitionCtor();
    if (!Ctor) return;
    if (listening) {
      recognitionRef.current?.stop();
      return;
    }
    const rec = new Ctor();
    rec.lang = "vi-VN";
    rec.interimResults = true;
    rec.continuous = false;
    voiceBaseRef.current = text ? `${text} ` : "";
    rec.onresult = (e) => {
      const transcript = Array.from(e.results)
        .map((r) => r[0]?.transcript ?? "")
        .join("");
      setText(voiceBaseRef.current + transcript);
    };
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);
    recognitionRef.current = rec;
    setListening(true);
    rec.start();
  };

  const activeModel = models?.find((m) => m.id === modelId) ?? models?.[0];

  return (
    <div className="border-t p-2">
      <div
        className={cn(
          "rounded-2xl border bg-background transition-shadow",
          "focus-within:ring-2 focus-within:ring-ring/50",
          disabled && "opacity-60",
        )}
      >
        {/* Tệp đính kèm — chip có tên + nút gỡ */}
        {files.length > 0 ? (
          <div className="flex flex-wrap gap-1.5 px-2.5 pt-2.5">
            {files.map((f, i) => (
              <span
                key={`${f.name}-${i}`}
                className="inline-flex max-w-44 items-center gap-1 rounded-md bg-muted px-2 py-1 text-xs"
              >
                <Paperclip className="size-3 shrink-0 text-muted-foreground" aria-hidden />
                <span className="truncate">{f.name}</span>
                <button
                  type="button"
                  onClick={() => setFiles((prev) => prev.filter((_, j) => j !== i))}
                  aria-label={`Gỡ tệp ${f.name}`}
                  className="shrink-0 rounded-sm text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <X className="size-3" aria-hidden />
                </button>
              </span>
            ))}
          </div>
        ) : null}

        <textarea
          ref={taRef}
          rows={1}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            // Enter gửi; Shift+Enter xuống dòng (chuẩn khung chat thật).
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
          placeholder={placeholder}
          disabled={disabled}
          className="block max-h-40 min-h-[52px] w-full resize-none bg-transparent px-3 py-2.5 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed"
        />

        {/* Thanh công cụ: đính kèm · model · giọng nói (trái) — nút gửi (phải) */}
        <div className="flex items-center gap-0.5 px-2 pb-2">
          {enableAttachments ? (
            <>
              <input
                ref={fileRef}
                id={fileInputId}
                type="file"
                multiple
                className="sr-only"
                onChange={(e) => onPickFiles(e.target.files)}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                disabled={disabled}
                onClick={() => fileRef.current?.click()}
                aria-label="Đính kèm tệp"
                title="Đính kèm tệp"
                className="text-muted-foreground"
              >
                <Paperclip className="size-[18px]" aria-hidden />
              </Button>
            </>
          ) : null}

          {models && models.length > 0 ? (
            <Select value={activeModel?.id} onValueChange={(v) => v && onModelChange?.(v)}>
              <SelectTrigger
                aria-label="Chọn model"
                title="Chọn model trả lời"
                className="h-7 w-auto gap-1 rounded-md border-0 bg-transparent px-2 text-xs font-medium text-muted-foreground shadow-none hover:bg-muted/60 focus-visible:ring-2 focus-visible:ring-ring dark:bg-transparent dark:hover:bg-muted/60"
              >
                <span className="truncate">{activeModel?.label ?? "Chọn model"}</span>
              </SelectTrigger>
              <SelectContent align="start" className="min-w-48">
                {models.map((m) => (
                  <SelectItem key={m.id} value={m.id} className="text-xs">
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : null}

          {enableVoice && voiceSupported ? (
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              disabled={disabled}
              onClick={toggleVoice}
              aria-label={listening ? "Dừng nhập giọng nói" : "Nhập bằng giọng nói"}
              aria-pressed={listening}
              title={listening ? "Đang nghe… bấm để dừng" : "Nhập bằng giọng nói"}
              className={cn(
                listening
                  ? "bg-destructive/10 text-destructive motion-safe:animate-pulse"
                  : "text-muted-foreground",
              )}
            >
              <Mic className="size-[18px]" aria-hidden />
            </Button>
          ) : null}

          <Button
            type="button"
            size="icon-sm"
            onClick={send}
            disabled={!canSend}
            aria-label="Gửi tin nhắn"
            title="Gửi"
            className="ml-auto rounded-full"
          >
            <ArrowUp className="size-[18px]" aria-hidden />
          </Button>
        </div>
      </div>
    </div>
  );
}
