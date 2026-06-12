"use client";

import { useState } from "react";
import { Bot, Check, CheckCircle2, CreditCard, FlaskConical, Link2Off, Loader2, Plus, QrCode, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { formatVND } from "@/lib/format";
import { MoMoIcon, SePayIcon, VNPayIcon } from "@/components/icons/payment";
import { useSetupStore } from "@/store/setupStore";
import { useUiStore } from "@/store/uiStore";
import { QrGlyph } from "./QrGlyph";
import { SHOP_BANK } from "./meta";

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

// Mức tiền gợi ý sẵn để bấm nhanh khi chạy thử.
const TEST_AMOUNTS = [10_000, 50_000, 200_000];

// Mã nội dung chuyển khoản cho giao dịch thử — đủ để phân biệt, không cần khớp thật.
function genTestCode() {
  return Math.random().toString(36).slice(2, 6).toUpperCase();
}

function TestRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 text-sm">
      <span className="shrink-0 text-muted-foreground">{label}</span>
      <span className="min-w-0 truncate text-right font-medium tabular-nums">{value}</span>
    </div>
  );
}

// Thử nhận tiền — chủ shop nhập số tiền, tạo mã QR thử rồi giả lập khách chuyển để xem cổng báo nhận đúng chưa.
// Chỉ chạy được khi cổng đang chọn đã kết nối. Trạng thái mock, sống tại màn (prototype).
function TestPaymentSection({ gatewayName, connected }: { gatewayName: string; connected: boolean }) {
  const startAgentChatTest = useUiStore((s) => s.startAgentChatTest);
  const [amount, setAmount] = useState(50_000);
  const [phase, setPhase] = useState<"idle" | "qr" | "checking" | "done">("idle");
  const [code, setCode] = useState("");

  const generate = () => {
    if (amount <= 0) return;
    setCode(genTestCode());
    setPhase("qr");
  };
  const simulate = () => {
    setPhase("checking");
    setTimeout(() => setPhase("done"), 1000);
  };
  // Sửa số tiền giữa chừng → quay lại bước tạo mã (mã cũ không còn đúng).
  const onAmountChange = (raw: string) => {
    const digits = raw.replace(/\D/g, "");
    setAmount(digits ? Number(digits) : 0);
    if (phase !== "idle") setPhase("idle");
  };

  const grouped = amount ? amount.toLocaleString("vi-VN") : "";
  const memo = code ? `THU NGHIEM ${code}` : "";

  return (
    <section className="space-y-4 rounded-xl bg-card p-4 ring-1 ring-foreground/10">
      <div className="flex items-center gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
          <FlaskConical className="size-5" aria-hidden />
        </span>
        <div className="min-w-0">
          <p className="font-medium">Kiểm tra công thanh toán</p>
          {/* <p className="mt-0.5 text-sm text-muted-foreground">
            Tạo mã QR thử để kiểm tra {gatewayName} nhận tiền đúng chưa — không tính vào doanh thu.
          </p> */}
        </div>
      </div>

      {!connected ? (
        <p className="rounded-lg border border-dashed border-foreground/15 px-3 py-6 text-center text-sm text-muted-foreground">
          Kết nối {gatewayName} trước để chạy thử nhận tiền.
        </p>
      ) : (
        <div className="flex flex-col gap-4 sm:flex-row sm:items-stretch">
          {/* Cột trái — cấu hình số tiền thử */}
          <div className="space-y-3 sm:w-56 sm:shrink-0">
            <div>
              <label htmlFor="test-amount" className="mb-1.5 block text-sm font-medium">
                Nhập số tiền
              </label>
              <div className="relative">
                <Input
                  id="test-amount"
                  inputMode="numeric"
                  value={grouped}
                  onChange={(e) => onAmountChange(e.target.value)}
                  placeholder="0"
                  className="pr-7 text-right tabular-nums"
                />
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">đ</span>
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {TEST_AMOUNTS.map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => onAmountChange(String(v))}
                    className={cn(
                      "cursor-pointer rounded-full border px-2.5 py-1 text-xs tabular-nums transition-colors",
                      amount === v
                        ? "border-primary bg-primary/5 text-foreground"
                        : "border-foreground/15 text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {v.toLocaleString("vi-VN")}đ
                  </button>
                ))}
              </div>
            </div>
            <Button size="sm" className="w-full" onClick={generate} disabled={!amount || phase === "checking"}>
              {phase === "idle" ? (
                <>
                  <QrCode className="size-4" aria-hidden />
                  Tạo mã thử
                </>
              ) : (
                <>
                  <RotateCcw className="size-4" aria-hidden />
                  {phase === "done" ? "Thử lại" : "Tạo mã khác"}
                </>
              )}
            </Button>

            {/* Cách 2: để agent gửi mã QR chốt đơn ngay trong chat như với khách thật. */}
            <div className="border-t pt-3">
              <Button variant="outline" size="sm" className="w-full" onClick={() => startAgentChatTest("payment")}>
                <Bot className="size-4" aria-hidden />
                Kiểm tra với Agent
              </Button>
            </div>
          </div>

          {/* Cột phải — xem trước mã QR / kết quả */}
          <div className="flex-1 rounded-lg border border-foreground/10 bg-muted/30 p-4">
            {phase === "idle" ? (
              <div className="flex h-full min-h-[11rem] flex-col items-center justify-center gap-2 text-center">
                <QrCode className="size-8 text-muted-foreground/40" aria-hidden />
                <p className="text-sm text-muted-foreground">Bấm Tạo mã thử để xem QR và chi tiết chuyển khoản.</p>
              </div>
            ) : phase === "done" ? (
              <div className="flex h-full min-h-[11rem] flex-col items-center justify-center gap-3 text-center">
                <span className="grid size-12 place-items-center rounded-full bg-emerald-100 text-emerald-700">
                  <CheckCircle2 className="size-6" aria-hidden />
                </span>
                <div>
                  <p className="font-medium">Đã nhận {formatVND(amount)} qua {gatewayName}</p>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    Cổng nhận tiền hoạt động bình thường. Đây là giao dịch thử, không tính vào doanh thu.
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                <div className="mx-auto shrink-0 sm:mx-0">
                  <QrGlyph seed={`test-${gatewayName}-${amount}-${code}`} />
                </div>
                <div className="min-w-0 flex-1 space-y-3">
                  <div className="space-y-1.5">
                    <TestRow label="Ngân hàng" value={SHOP_BANK.bank} />
                    <TestRow label="Số tài khoản" value={SHOP_BANK.accountNo} />
                    <TestRow label="Chủ tài khoản" value={SHOP_BANK.holder} />
                    <TestRow label="Số tiền" value={formatVND(amount)} />
                    <TestRow label="Nội dung CK" value={memo} />
                  </div>
                  <Button size="sm" onClick={simulate} disabled={phase === "checking"}>
                    {phase === "checking" ? (
                      <Loader2 className="size-4 motion-safe:animate-spin" aria-hidden />
                    ) : (
                      <CheckCircle2 className="size-4" aria-hidden />
                    )}
                    {phase === "checking" ? "Đang kiểm tra…" : "Giả lập đã chuyển khoản"}
                  </Button>
                  <p className="text-[11px] text-muted-foreground">
                    Quét thử bằng app ngân hàng, hoặc bấm Giả lập đã chuyển khoản để xem cổng báo nhận tiền.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
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
    // Mock OAuth — nối xong sau 1.1s (đồng bộ cách mục Kênh kết nối giả lập).
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
          Kết nối cổng nhận tiền và để agent tự gửi mã QR cho khách.
        </p>
        <h1 className="text-pretty text-base font-semibold sm:text-lg">Cổng thanh toán</h1>
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
            {/* <p className="mt-0.5 text-sm text-muted-foreground">Kết nối cổng để nhận tiền khi khách thanh toán</p> */}
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

      {/* Thử nhận tiền — remount theo cổng đang chọn để reset trạng thái thử khi đổi cổng. */}
      <TestPaymentSection key={selected} gatewayName={active.name} connected={isActiveConnected} />
    </div>
  );
}
