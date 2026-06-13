"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Link2Off, Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FacebookIcon, ZaloIcon } from "@/components/icons/channel";
import { useAgentConfig } from "@/store/agentConfigStore";
import { useUiStore } from "@/store/uiStore";
import { ShopInfoForm } from "./ShopInfoForm";

// Thông tin shop — hồ sơ nghiệp vụ để agent đọc và tư vấn khách.
// Form hồ sơ tách sang ShopInfoForm (dùng chung với Playground). Màn này lo header + điều hướng tab + kênh kết nối.
// Tách 2 tab trên TopBar (SegmentView §6.11): "info" = hồ sơ shop · "channels" = kênh kết nối.

export function ShopInfoScreen({ initialTab }: { initialTab?: string }) {
  const router = useRouter();
  const config = useAgentConfig((s) => s.config);

  // Tab nằm trên topbar (TopBar) — đồng bộ qua uiStore.
  const tab = useUiStore((s) => s.shopTab);
  const setShopTab = useUiStore((s) => s.setShopTab);

  // Deep-link ?tab= khi vào màn → set vào store (§6.11).
  useEffect(() => {
    if (initialTab === "info" || initialTab === "channels") setShopTab(initialTab);
  }, [initialTab, setShopTab]);

  // …và đổi tab thì ghi ngược lên thanh địa chỉ (replace, không nhảy cuộn).
  // Đọc tab SỐNG từ store (getState), KHÔNG dùng closure: lúc mount deep-link vừa set store theo ?tab= nên
  // không ghi đè ngược về tab mặc định → không bounce. An toàn cả khi Strict Mode gọi effect 2 lần.
  useEffect(() => {
    const liveTab = useUiStore.getState().shopTab;
    const current = new URLSearchParams(window.location.search).get("tab");
    if (current !== liveTab) router.replace(`/shop-info?tab=${liveTab}`, { scroll: false });
  }, [tab, router]);

  // Tab "Kênh kết nối" — chỉ danh sách kênh, tách riêng khỏi hồ sơ shop.
  if (tab === "channels") {
    return (
      <div className="mx-auto max-w-3xl space-y-5 pb-4">
        <header className="space-y-1">
          <p className="text-sm text-muted-foreground">
            Kết nối Facebook hoặc Zalo để agent nhận và trả lời tin nhắn của khách
          </p>
          <h1 className="text-pretty text-xl font-semibold sm:text-2xl">Kênh kết nối</h1>
        </header>
        <ChannelsSection />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-5 pb-4">
      <header className="space-y-1">
        <p className="text-sm text-muted-foreground">
          Điền thông tin cửa hàng để agent tư vấn khách chính xác.
        </p>
        <h1 className="text-pretty text-xl font-semibold sm:text-2xl">
          <span className="text-foreground">{config.shopName || "Chưa đặt Tên cửa hàng"}</span>
        </h1>
      </header>

      <ShopInfoForm />
    </div>
  );
}

type ChannelKey = "fb" | "zalo";

// Mục "Kênh kết nối" — danh sách trang FB / Zalo OA đã nối. Đọc/ghi chung nguồn
// `config.channels` với Onboarding (O1) và Cấu hình Agent. Mock OAuth (setTimeout 900ms).
function ChannelsSection() {
  const config = useAgentConfig((s) => s.config);
  const setConfig = useAgentConfig((s) => s.setConfig);
  const { fbConnected, zaloConnected, pageName } = config.channels;
  const [loading, setLoading] = useState<ChannelKey | null>(null);

  const label = pageName || config.shopName || "Trang của bạn";

  const connect = (channel: ChannelKey) => {
    setLoading(channel);
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
    <Card size="sm">
      <CardContent className="space-y-2">
        <ChannelRow
          icon={<FacebookIcon className="size-9" />}
          name="Facebook Page"
          connected={fbConnected}
          connectedLabel={label}
          loading={loading === "fb"}
          onConnect={() => connect("fb")}
          onDisconnect={() => disconnect("fb")}
        />
        <ChannelRow
          icon={<ZaloIcon className="size-9 rounded-xl" />}
          name="Zalo OA"
          connected={zaloConnected}
          connectedLabel={label}
          loading={loading === "zalo"}
          onConnect={() => connect("zalo")}
          onDisconnect={() => disconnect("zalo")}
        />
      </CardContent>
    </Card>
  );
}

// Một hàng kênh — icon + tên + trạng thái nối, nút Kết nối / Ngắt kết nối.
function ChannelRow({
  icon,
  name,
  connected,
  connectedLabel,
  loading,
  onConnect,
  onDisconnect,
}: {
  icon: React.ReactNode;
  name: string;
  connected: boolean;
  connectedLabel: string;
  loading: boolean;
  onConnect: () => void;
  onDisconnect: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg p-3 ring-1 ring-foreground/10">
      <div className="flex min-w-0 items-center gap-3">
        <span className="shrink-0">{icon}</span>
        <div className="min-w-0">
          <p className="text-sm font-medium">{name}</p>
          {connected ? (
            <span className="mt-0.5 inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
              <CheckCircle2 className="size-3" aria-hidden />
              Đã nối · {connectedLabel}
            </span>
          ) : (
            <p className="mt-0.5 truncate text-xs text-muted-foreground">Chưa kết nối</p>
          )}
        </div>
      </div>

      {connected ? (
        <Button variant="ghost" size="sm" onClick={onDisconnect} className="shrink-0 text-muted-foreground hover:text-destructive">
          <Link2Off className="size-4" aria-hidden />
          Ngắt kết nối
        </Button>
      ) : (
        <Button variant="outline" size="sm" onClick={onConnect} disabled={loading} className="shrink-0">
          {loading ? <Loader2 className="size-4 motion-safe:animate-spin" aria-hidden /> : <Plus className="size-4" aria-hidden />}
          {loading ? "Đang kết nối…" : "Kết nối"}
        </Button>
      )}
    </div>
  );
}
