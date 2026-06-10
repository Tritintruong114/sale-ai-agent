"use client";

import { useState } from "react";
import { Check, CheckCircle2, CreditCard, Link2Off, Loader2, Plus, QrCode } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { MoMoIcon, SePayIcon, VNPayIcon } from "@/components/icons/payment";
import { useSetupStore } from "@/store/setupStore";

// Tab Cài đặt (M5 §6.14) — cấu hình thu tiền của shop, tách khỏi luồng Chỉ số/Thu tiền:
//   • Tự động tạo mã QR — agent tự sinh QR khi khách đặt hàng (mặc định bật).
//   • Chọn cổng thanh toán — tile chọn cổng + nối tài khoản (mock OAuth bằng setTimeout).
// Cổng "Sắp ra mắt" chỉ trưng bày, không chọn được. Trạng thái sống tại màn (prototype, mock).

type GatewayKey = "sepay" | "vnpay" | "momo";

type Gateway = {
  key: GatewayKey;
  name: string;
  hint: string;
  icon: (props: { className?: string }) => React.ReactNode;
  comingSoon?: boolean;
};

const GATEWAYS: Gateway[] = [
  { key: "sepay", name: "SePay", hint: "Cổng thanh toán QR ngân hàng", icon: SePayIcon },
  { key: "vnpay", name: "VNPay", hint: "Cổng thanh toán điện tử phổ biến", icon: VNPayIcon },
  { key: "momo", name: "MoMo", hint: "Ví điện tử MoMo", icon: MoMoIcon, comingSoon: true },
];

function GatewayTile({
  gateway,
  selected,
  connected,
  loading,
  onSelect,
}: {
  gateway: Gateway;
  selected: boolean;
  connected: boolean;
  loading: boolean;
  onSelect: () => void;
}) {
  const { name, hint, icon: Icon, comingSoon } = gateway;
  return (
    <button
      type="button"
      onClick={comingSoon ? undefined : onSelect}
      disabled={comingSoon}
      aria-pressed={selected}
      className={cn(
        "group relative flex flex-col gap-3 rounded-xl border bg-card p-4 text-left transition-colors",
        comingSoon
          ? "cursor-not-allowed border-foreground/10 opacity-60"
          : "cursor-pointer hover:border-primary/40",
        selected ? "border-primary ring-1 ring-primary" : "border-foreground/10",
      )}
    >
      {/* Góc phải: badge "Sắp ra mắt" hoặc tick khi đang chọn. */}
      {comingSoon ? (
        <span className="absolute right-3 top-3 rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
          Sắp ra mắt
        </span>
      ) : selected ? (
        <span className="absolute right-3 top-3 inline-flex size-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
          <Check className="size-3.5" aria-hidden />
        </span>
      ) : null}

      <Icon className="size-11" />

      <div className="min-w-0">
        <p className="font-semibold">{name}</p>
        <p className="mt-0.5 text-sm text-muted-foreground">{hint}</p>
      </div>

      {/* Trạng thái nối tài khoản — chỉ cho cổng chọn được. */}
      {!comingSoon ? (
        connected ? (
          <span className="inline-flex w-fit items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
            <CheckCircle2 className="size-3" aria-hidden />
            Đã kết nối
          </span>
        ) : (
          <span className="inline-flex w-fit items-center gap-1 text-[11px] font-medium text-muted-foreground">
            {loading ? (
              <>
                <Loader2 className="size-3 motion-safe:animate-spin" aria-hidden />
                Đang kết nối…
              </>
            ) : (
              <>
                <Plus className="size-3" aria-hidden />
                Chưa kết nối
              </>
            )}
          </span>
        )
      ) : null}
    </button>
  );
}

export function PaymentSettings() {
  const [autoQr, setAutoQr] = useState(true);
  const [selected, setSelected] = useState<GatewayKey>("sepay");
  // Trạng thái nối cổng sống ở setupStore (persist) để checklist "Bắt đầu nhanh" phản ánh đúng.
  const connected = useSetupStore((s) => s.gateways);
  const setGateway = useSetupStore((s) => s.setGateway);
  const [loadingKey, setLoadingKey] = useState<GatewayKey | null>(null);

  const active = GATEWAYS.find((g) => g.key === selected)!;
  const isActiveConnected = connected[selected];

  const connect = () => {
    setLoadingKey(selected);
    // Mock OAuth — nối xong sau 1.1s (đồng bộ cách ChannelsScreen giả lập).
    setTimeout(() => {
      setGateway(selected, true);
      setLoadingKey(null);
    }, 1100);
  };

  const disconnect = () => setGateway(selected, false);

  return (
    <div className="space-y-6">
      <header className="min-w-0">
        <p className="text-xs text-muted-foreground sm:text-sm">
          Cấu hình cách agent nhận thanh toán — bật tự tạo QR và chọn cổng thanh toán.
        </p>
        <h1 className="text-pretty text-base font-semibold sm:text-lg">Cài đặt thanh toán</h1>
      </header>

      {/* Tự động tạo mã QR */}
      <div className="flex items-center justify-between gap-4 rounded-xl bg-card p-4 ring-1 ring-foreground/10">
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-emerald-500/10 text-emerald-600">
            <QrCode className="size-5" aria-hidden />
          </span>
          <div className="min-w-0">
            <p className="font-medium">Tự động tạo mã QR</p>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Agent tự tạo mã QR thanh toán ngay khi khách đặt hàng
            </p>
          </div>
        </div>
        <Switch
          checked={autoQr}
          onCheckedChange={setAutoQr}
          aria-label="Tự động tạo mã QR"
          className="shrink-0"
        />
      </div>

      {/* Chọn cổng thanh toán */}
      <section className="space-y-4 rounded-xl bg-card p-4 ring-1 ring-foreground/10">
        <div className="flex items-center gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
            <CreditCard className="size-5" aria-hidden />
          </span>
          <div className="min-w-0">
            <p className="font-medium">Chọn cổng thanh toán</p>
            <p className="mt-0.5 text-sm text-muted-foreground">Kết nối cổng để nhận tiền khi khách thanh toán</p>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {GATEWAYS.map((g) => (
            <GatewayTile
              key={g.key}
              gateway={g}
              selected={selected === g.key}
              connected={!!connected[g.key]}
              loading={loadingKey === g.key}
              onSelect={() => setSelected(g.key)}
            />
          ))}
        </div>

        {/* Hành động nối / ngắt tài khoản cho cổng đang chọn. */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-4">
          <p className="text-sm text-muted-foreground">
            Cổng đang chọn: <span className="font-medium text-foreground">{active.name}</span>
          </p>
          {isActiveConnected ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={disconnect}
              className="text-muted-foreground hover:text-destructive"
            >
              <Link2Off className="size-4" aria-hidden />
              Ngắt kết nối
            </Button>
          ) : (
            <Button size="sm" onClick={connect} disabled={loadingKey !== null}>
              {loadingKey === selected ? (
                <Loader2 className="size-4 motion-safe:animate-spin" aria-hidden />
              ) : (
                <Plus className="size-4" aria-hidden />
              )}
              {loadingKey === selected ? "Đang kết nối…" : `Kết nối ${active.name}`}
            </Button>
          )}
        </div>
      </section>
    </div>
  );
}
