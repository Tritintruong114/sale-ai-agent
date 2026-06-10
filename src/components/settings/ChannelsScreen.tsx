"use client";

import { useState } from "react";
import { CheckCircle2, Link2Off, Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FacebookIcon, ZaloIcon } from "@/components/icons/channel";
import { useAgentConfig } from "@/store/agentConfigStore";

type ChannelKey = "fb" | "zalo";

// Settings · Kênh — danh sách trang FB / Zalo OA đã nối. Đọc/ghi chung nguồn
// `config.channels` với Onboarding (O1) và Cấu hình Agent. Mock OAuth (setTimeout).
function ChannelRow({
  icon,
  name,
  hint,
  connected,
  connectedLabel,
  loading,
  onConnect,
  onDisconnect,
}: {
  icon: React.ReactNode;
  name: string;
  hint: string;
  connected: boolean;
  connectedLabel: string;
  loading: boolean;
  onConnect: () => void;
  onDisconnect: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl bg-card p-4 ring-1 ring-foreground/10">
      <div className="flex min-w-0 items-center gap-3">
        <span className="shrink-0">{icon}</span>
        <div className="min-w-0">
          <p className="font-medium">{name}</p>
          {connected ? (
            <span className="mt-0.5 inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
              <CheckCircle2 className="size-3" aria-hidden />
              Đã nối · {connectedLabel}
            </span>
          ) : (
            <p className="mt-0.5 truncate text-sm text-muted-foreground">{hint}</p>
          )}
        </div>
      </div>

      {connected ? (
        <Button
          variant="ghost"
          size="sm"
          onClick={onDisconnect}
          className="shrink-0 text-muted-foreground hover:text-destructive"
        >
          <Link2Off className="size-4" aria-hidden />
          Ngắt kết nối
        </Button>
      ) : (
        <Button variant="outline" size="sm" onClick={onConnect} disabled={loading} className="shrink-0">
          {loading ? (
            <Loader2 className="size-4 motion-safe:animate-spin" aria-hidden />
          ) : (
            <Plus className="size-4" aria-hidden />
          )}
          {loading ? "Đang kết nối…" : "Kết nối"}
        </Button>
      )}
    </div>
  );
}

export function ChannelsScreen() {
  const { config, setConfig } = useAgentConfig();
  const { fbConnected, zaloConnected, pageName } = config.channels;
  const [loading, setLoading] = useState<ChannelKey | null>(null);

  const label = pageName || config.shopName || "Trang của bạn";
  const connectedCount = Number(fbConnected) + Number(zaloConnected);

  const connect = (channel: ChannelKey) => {
    setLoading(channel);
    // Mock OAuth — giả lập độ trễ kết nối.
    setTimeout(() => {
      setLoading(null);
      setConfig({
        channels: {
          ...config.channels,
          pageName: label,
          ...(channel === "fb" ? { fbConnected: true } : { zaloConnected: true }),
        },
      });
    }, 900);
  };

  const disconnect = (channel: ChannelKey) => {
    setConfig({
      channels: {
        ...config.channels,
        ...(channel === "fb" ? { fbConnected: false } : { zaloConnected: false }),
      },
    });
  };

  return (
    <div className="mx-auto max-w-3xl space-y-8 pb-4">
      <header className="space-y-1">
        <p className="text-sm text-muted-foreground">Cài đặt · Kênh</p>
        <h1 className="text-pretty text-xl font-semibold sm:text-2xl">
          {connectedCount > 0 ? (
            <>
              Đang nhận tin từ <span className="text-emerald-600">{connectedCount} kênh</span>
            </>
          ) : (
            "Chưa nối kênh nào"
          )}
        </h1>
        <p className="text-sm text-muted-foreground">
          Nối Facebook Page hoặc Zalo OA để agent nhận và trả lời tin nhắn của khách. Nối kênh nào
          cũng được, có thể nối cả hai.
        </p>
      </header>

      <section className="space-y-3" aria-labelledby="channels-h">
        <h2 id="channels-h" className="sr-only">
          Danh sách kênh
        </h2>

        <ChannelRow
          icon={<FacebookIcon className="size-10" />}
          name="Facebook Page"
          hint="Chưa kết nối"
          connected={fbConnected}
          connectedLabel={label}
          loading={loading === "fb"}
          onConnect={() => connect("fb")}
          onDisconnect={() => disconnect("fb")}
        />

        <ChannelRow
          icon={<ZaloIcon className="size-10 rounded-xl" />}
          name="Zalo OA"
          hint="Chưa kết nối"
          connected={zaloConnected}
          connectedLabel={label}
          loading={loading === "zalo"}
          onConnect={() => connect("zalo")}
          onDisconnect={() => disconnect("zalo")}
        />
      </section>
    </div>
  );
}
