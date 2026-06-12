"use client";

import { useState } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FacebookIcon, ZaloIcon } from "@/components/icons/channel";
import type { StepProps } from "../types";

type ChannelKey = "fb" | "zalo";

function ChannelCard({
  icon,
  name,
  connected,
  connectedLabel,
  loading,
  onConnect,
}: {
  icon: React.ReactNode;
  name: string;
  connected: boolean;
  connectedLabel: string;
  loading: boolean;
  onConnect: () => void;
}) {
  return (
    <div className="flex items-center justify-between rounded-xl border p-4">
      <div className="flex items-center gap-3">
        <span className="shrink-0">{icon}</span>
        <div>
          <p className="font-medium">{name}</p>
          {connected ? (
            <p className="text-sm text-emerald-600">Đã nối: {connectedLabel}</p>
          ) : (
            <p className="text-sm text-muted-foreground">Chưa kết nối</p>
          )}
        </div>
      </div>
      {connected ? (
        <span className="flex items-center gap-1.5 text-sm font-medium text-emerald-600" role="status">
          <CheckCircle2 className="size-4" aria-hidden />
          Đã nối
        </span>
      ) : (
        <Button variant="outline" size="lg" onClick={onConnect} disabled={loading}>
          {loading && <Loader2 className="size-4 motion-safe:animate-spin" aria-hidden />}
          {loading ? "Đang kết nối…" : "Kết nối"}
        </Button>
      )}
    </div>
  );
}

export function StepConnectChannel({ draft, update }: StepProps) {
  const [loading, setLoading] = useState<ChannelKey | null>(null);
  const { fbConnected, zaloConnected } = draft.channels;
  const pageName = draft.channels.pageName || draft.shopName || "Trang của bạn";

  const connect = (channel: ChannelKey) => {
    setLoading(channel);
    // Mock OAuth — giả lập độ trễ kết nối.
    setTimeout(() => {
      setLoading(null);
      update({
        channels: {
          ...draft.channels,
          pageName,
          ...(channel === "fb" ? { fbConnected: true } : { zaloConnected: true }),
        },
      });
    }, 900);
  };

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Kết nối kênh để agent nhận và trả lời tin nhắn của khách.
      </p>

      <ChannelCard
        icon={<FacebookIcon className="size-10" />}
        name="Facebook Page"
        connected={fbConnected}
        connectedLabel={pageName}
        loading={loading === "fb"}
        onConnect={() => connect("fb")}
      />

      <ChannelCard
        icon={<ZaloIcon className="size-10 rounded-xl" />}
        name="Zalo OA"
        connected={zaloConnected}
        connectedLabel={pageName}
        loading={loading === "zalo"}
        onConnect={() => connect("zalo")}
      />
    </div>
  );
}
