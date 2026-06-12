"use client";

import { useState } from "react";
import { Check, Eye, EyeOff, Loader2, Send, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ZaloIcon } from "@/components/icons/channel";
import { cn } from "@/lib/utils";

// Kênh nhận thông báo (M6 Thông báo). Mỗi kênh nối qua bot token riêng:
//   • Telegram — tạo bot bằng @BotFather, dán bot token.
//   • Zalo — tạo bot ở Zalo Bot Creator, dán access token.
// Prototype: "Xác minh & kết nối" giả lập kiểm tra token (delay) rồi lưu, không gọi backend thật.

export type NotifyChannelKey = "telegram" | "zalo";

type SetupStep = { before: string; link?: { label: string; href: string }; after?: string };

const SETUP: Record<
  NotifyChannelKey,
  { name: string; blurb: string; steps: SetupStep[]; placeholder: string }
> = {
  telegram: {
    name: "Telegram",
    blurb: "Trao đổi và nhận thông báo từ trợ lý ngay trên Telegram.",
    steps: [
      { before: "Mở chat với ", link: { label: "@BotFather", href: "https://t.me/BotFather" }, after: " trên Telegram" },
      { before: "Gõ /newbot và làm theo hướng dẫn" },
      { before: "Copy bot token mà BotFather trả về" },
      { before: "Dán token vào đây và kết nối" },
    ],
    placeholder: "1234567890:ABCdef…",
  },
  zalo: {
    name: "Zalo",
    blurb: "Trao đổi và nhận thông báo từ trợ lý ngay trên Zalo.",
    steps: [
      { before: "Truy cập ", link: { label: "Zalo Bot", href: "https://bot.zalo.me" } },
      { before: "Quét mã Zalo Bot Creator QR" },
      { before: "Thiết lập thông tin Bot" },
      { before: "Dán Access Token vào đây và kết nối" },
    ],
    placeholder: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9…",
  },
};

function ChannelIcon({ channel, className }: { channel: NotifyChannelKey; className?: string }) {
  return channel === "telegram" ? (
    <Send className={cn("text-sky-500", className)} aria-hidden />
  ) : (
    <ZaloIcon className={className} />
  );
}

// Nội dung modal — keyed theo channel ở parent để reset state mỗi lần mở.
function DialogBody({
  channel,
  initialValue,
  onConnect,
}: {
  channel: NotifyChannelKey;
  initialValue?: string;
  onConnect: (value: string) => void;
}) {
  const meta = SETUP[channel];
  const [value, setValue] = useState(initialValue ?? "");
  const [show, setShow] = useState(false);
  const [verifying, setVerifying] = useState(false);

  const verifyAndConnect = () => {
    if (!value.trim() || verifying) return;
    setVerifying(true);
    // Mock: giả lập xác minh token rồi lưu kết nối.
    setTimeout(() => onConnect(value.trim()), 900);
  };

  return (
    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <ChannelIcon channel={channel} className="size-5" />
          {meta.name}
        </DialogTitle>
        <DialogDescription>{meta.blurb}</DialogDescription>
      </DialogHeader>

      <div className="space-y-4">
        <ol className="space-y-2.5">
          {meta.steps.map((s, i) => (
            <li key={i} className="flex items-center gap-2.5 text-sm">
              <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-muted text-[11px] font-semibold text-muted-foreground tabular-nums">
                {i + 1}
              </span>
              <span className="text-foreground/90">
                {s.before}
                {s.link ? (
                  <a
                    href={s.link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-primary underline-offset-2 hover:underline"
                  >
                    {s.link.label}
                  </a>
                ) : null}
                {s.after}
              </span>
            </li>
          ))}
        </ol>

        {/* Token — nhập dạng bí mật, bấm mắt để xem */}
        <div className="relative">
          <Input
            type={show ? "text" : "password"}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={meta.placeholder}
            autoFocus
            className="pr-9 font-mono"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                verifyAndConnect();
              }
            }}
          />
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            aria-label={show ? "Ẩn token" : "Hiện token"}
            className="absolute right-1.5 top-1/2 flex size-7 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
          >
            {show ? <EyeOff className="size-4" aria-hidden /> : <Eye className="size-4" aria-hidden />}
          </button>
        </div>

        <Button className="w-full" onClick={verifyAndConnect} disabled={!value.trim() || verifying}>
          {verifying ? (
            <Loader2 className="size-4 motion-safe:animate-spin" aria-hidden />
          ) : (
            <Zap className="size-4" aria-hidden />
          )}
          Xác minh & kết nối
        </Button>
      </div>
    </DialogContent>
  );
}

export function NotifyChannelDialog({
  channel,
  initialValue,
  onClose,
  onConnect,
}: {
  channel: NotifyChannelKey | null;
  initialValue?: string;
  onClose: () => void;
  onConnect: (channel: NotifyChannelKey, value: string) => void;
}) {
  return (
    <Dialog open={!!channel} onOpenChange={(o) => !o && onClose()}>
      {channel ? (
        <DialogBody
          key={channel}
          channel={channel}
          initialValue={initialValue}
          onConnect={(value) => onConnect(channel, value)}
        />
      ) : null}
    </Dialog>
  );
}

// Hàng trạng thái kênh trong tab Thông báo: đã nối → tên + trạng thái cùng hàng, nút gửi tin thử + Ngắt kết nối;
// chưa nối → nút Kết nối. Gửi tin thử là mock (giả lập độ trễ rồi báo đã gửi).
export function NotifyChannelRow({
  channel,
  connected,
  onConnect,
  onDisconnect,
}: {
  channel: NotifyChannelKey;
  connected: boolean;
  onConnect: () => void;
  onDisconnect: () => void;
}) {
  const meta = SETUP[channel];
  const [test, setTest] = useState<"idle" | "sending" | "sent">("idle");

  const sendTest = () => {
    if (test === "sending") return;
    setTest("sending");
    setTimeout(() => {
      setTest("sent");
      setTimeout(() => setTest("idle"), 2000);
    }, 900);
  };

  return (
    <div className="flex items-center justify-between gap-3 rounded-lg px-3 py-2.5 ring-1 ring-foreground/10">
      <span className="flex min-w-0 flex-wrap items-center gap-x-2.5 gap-y-0.5">
        <span className="flex items-center gap-2 text-sm font-medium">
          <ChannelIcon channel={channel} className="size-4 shrink-0" />
          {meta.name}
        </span>
        {connected ? (
          <span className="flex items-center gap-1 text-xs text-emerald-600">
            <Check className="size-3 shrink-0" aria-hidden />
            Đang nhận thông báo
          </span>
        ) : null}
      </span>

      {connected ? (
        <div className="flex shrink-0 items-center gap-1">
          {test === "sent" ? (
            <span className="text-xs font-medium text-emerald-600">Đã gửi tin thử</span>
          ) : null}
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={sendTest}
            disabled={test === "sending"}
            aria-label={`Gửi tin thử qua ${meta.name}`}
            title="Gửi tin thử"
          >
            {test === "sending" ? (
              <Loader2 className="size-4 motion-safe:animate-spin" aria-hidden />
            ) : test === "sent" ? (
              <Check className="size-4 text-emerald-600" aria-hidden />
            ) : (
              <Send className="size-4" aria-hidden />
            )}
          </Button>
          <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={onDisconnect}>
            Ngắt kết nối
          </Button>
        </div>
      ) : (
        <Button variant="outline" size="sm" className="shrink-0" onClick={onConnect}>
          Kết nối
        </Button>
      )}
    </div>
  );
}
