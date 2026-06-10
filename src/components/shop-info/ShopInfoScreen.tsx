"use client";

import { useId } from "react";
import {
  Clock,
  CreditCard,
  Globe,
  HelpCircle,
  Info,
  Plus,
  ShieldCheck,
  Sparkles,
  Store,
  Tag,
  Trash2,
  Truck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { formatVND } from "@/lib/format";
import { useAgentConfig } from "@/store/agentConfigStore";
import {
  DEFAULT_CONFIG,
  WEEKDAYS,
  type BusinessProfile,
  type FaqItem,
  type PromoItem,
} from "@/data/config";

// Thông tin shop — hồ sơ nghiệp vụ để agent đọc và tư vấn khách.
// Đọc/ghi agentConfigStore (nguồn sự thật chung). Tự lưu mỗi lần đổi (không nút Submit),
// gửi sang /api/chat → buildBusinessContext nạp vào system prompt (xem src/lib/shopContext.ts).

const SHOP_TYPES = [
  { key: "online", label: "Bán online", icon: Globe },
  { key: "store", label: "Có cửa hàng", icon: Store },
] as const;

// id cho item mới — crypto.randomUUID() có sẵn trên trình duyệt hiện đại.
const newId = () => (typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `id-${Math.random().toString(36).slice(2)}`);

export function ShopInfoScreen() {
  const config = useAgentConfig((s) => s.config);
  const setConfig = useAgentConfig((s) => s.setConfig);

  // Config cũ trong localStorage có thể thiếu businessProfile → fallback seed mặc định.
  const profile: BusinessProfile = config.businessProfile ?? DEFAULT_CONFIG.businessProfile!;
  const setProfile = (patch: Partial<BusinessProfile>) => setConfig({ businessProfile: { ...profile, ...patch } });

  const hasStore = config.shopType.includes("store");
  // Config cũ có thể thiếu deposit → mặc định tắt.
  const deposit = profile.payment.deposit ?? { enabled: false };

  return (
    <div className="mx-auto max-w-3xl space-y-5 pb-4">
      <header className="space-y-1">
        <p className="text-sm text-muted-foreground">
          Điền thông tin cửa hàng để agent tư vấn khách chính xác. Mọi thay đổi tự lưu, áp dụng ngay.
        </p>
        <h1 className="text-pretty text-xl font-semibold sm:text-2xl">
          <span className="text-foreground">{config.shopName || "Chưa đặt tên shop"}</span>
          {config.shopType.length > 0 ? (
            <> · {config.shopType.map((t) => SHOP_TYPES.find((x) => x.key === t)?.label).join(" + ")}</>
          ) : null}
        </h1>
      </header>

      {/* 1 — Thông tin cơ bản */}
      <Section icon={Store} title="Thông tin cơ bản">
        <Field label="Tên shop">
          <Input
            value={config.shopName}
            onChange={(e) => setConfig({ shopName: e.target.value })}
            placeholder="vd: Shop Trái Cây An An"
          />
        </Field>

        <Field label="Loại hình" hint="Chọn một hoặc cả hai">
          <div className="grid grid-cols-2 gap-2">
            {SHOP_TYPES.map((t) => {
              const Icon = t.icon;
              const active = config.shopType.includes(t.key);
              return (
                <button
                  key={t.key}
                  type="button"
                  onClick={() =>
                    setConfig({
                      shopType: active
                        ? config.shopType.filter((x) => x !== t.key)
                        : [...config.shopType, t.key],
                    })
                  }
                  aria-pressed={active}
                  className={cn(
                    "flex items-center gap-2 rounded-lg p-3 text-left ring-1 transition-colors",
                    "focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                    active ? "bg-primary/5 ring-primary" : "ring-foreground/10 hover:bg-muted/40 hover:ring-foreground/20",
                  )}
                >
                  <Icon className="size-5 shrink-0 text-muted-foreground" aria-hidden />
                  <span className="text-sm font-medium">{t.label}</span>
                </button>
              );
            })}
          </div>
        </Field>

        {hasStore ? (
          <div className="space-y-3 motion-safe:animate-in motion-safe:fade-in-0">
            <Field label="Địa chỉ cửa hàng">
              <Input
                value={config.shopAddress ?? ""}
                onChange={(e) => setConfig({ shopAddress: e.target.value })}
                placeholder="vd: 12 Nguyễn Huệ, Quận 1, TP.HCM"
              />
            </Field>
            <Field label="Điện thoại liên hệ">
              <Input
                type="tel"
                value={config.shopPhone ?? ""}
                onChange={(e) => setConfig({ shopPhone: e.target.value })}
                placeholder="vd: 0901 234 567"
              />
            </Field>
          </div>
        ) : null}
      </Section>

      {/* 2 — Giới thiệu & cam kết */}
      <Section icon={Info} title="Giới thiệu & cam kết">
        <Field label="Giới thiệu shop" hint="Một đoạn ngắn để agent hiểu shop bán gì, cho ai">
          <Textarea
            rows={3}
            value={profile.intro}
            onChange={(e) => setProfile({ intro: e.target.value })}
            placeholder="vd: Shop chuyên trái cây tươi, mâm ngũ quả và giỏ quà biếu tặng…"
          />
        </Field>
        <Field label="Cam kết / điểm mạnh" hint="Mỗi dòng một ý — agent dùng để tạo niềm tin với khách">
          <StringList
            items={profile.commitments}
            onChange={(commitments) => setProfile({ commitments })}
            placeholder="vd: 100% hàng chính hãng, có bill nhập"
            addLabel="Thêm cam kết"
            emptyHint="Chưa có cam kết nào."
          />
        </Field>
      </Section>

      {/* 3 — Giờ hoạt động */}
      <Section icon={Clock} title="Giờ hoạt động">
        <div className="space-y-1.5">
          {WEEKDAYS.map(({ key, label }) => {
            const day = profile.hours.weekly[key];
            return (
              <div key={key} className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-lg px-3 py-2 ring-1 ring-foreground/10">
                <span className="w-20 shrink-0 text-sm font-medium">{label}</span>
                <label className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Switch
                    checked={!day.closed}
                    onCheckedChange={(v) =>
                      setProfile({ hours: { ...profile.hours, weekly: { ...profile.hours.weekly, [key]: { ...day, closed: !v } } } })
                    }
                  />
                  {day.closed ? "Nghỉ" : "Mở cửa"}
                </label>
                <div className={cn("ml-auto flex items-center gap-2", day.closed && "pointer-events-none opacity-40")}>
                  <Input
                    type="time"
                    className="w-28"
                    value={day.open}
                    disabled={day.closed}
                    aria-label={`Giờ mở cửa ${label}`}
                    onChange={(e) =>
                      setProfile({ hours: { ...profile.hours, weekly: { ...profile.hours.weekly, [key]: { ...day, open: e.target.value } } } })
                    }
                  />
                  <span className="text-muted-foreground">–</span>
                  <Input
                    type="time"
                    className="w-28"
                    value={day.close}
                    disabled={day.closed}
                    aria-label={`Giờ đóng cửa ${label}`}
                    onChange={(e) =>
                      setProfile({ hours: { ...profile.hours, weekly: { ...profile.hours.weekly, [key]: { ...day, close: e.target.value } } } })
                    }
                  />
                </div>
              </div>
            );
          })}
        </div>
        <Field label="Ghi chú giờ giấc" hint="vd: nghỉ lễ Tết, giờ phản hồi tin nhắn">
          <Input
            value={profile.hours.note ?? ""}
            onChange={(e) => setProfile({ hours: { ...profile.hours, note: e.target.value } })}
            placeholder="vd: Lễ Tết nghỉ theo thông báo trên fanpage"
          />
        </Field>
      </Section>

      {/* 4 — Giao hàng & phí ship */}
      <Section icon={Truck} title="Giao hàng & phí ship">
        <div className="space-y-3">
          <Field label="Khu vực giao">
            <Input
              value={profile.shipping.areas}
              onChange={(e) => setProfile({ shipping: { ...profile.shipping, areas: e.target.value } })}
              placeholder="vd: Giao toàn quốc, nội thành giao nhanh trong ngày"
            />
          </Field>
          <Field label="Phí ship">
            <Input
              value={profile.shipping.fee}
              onChange={(e) => setProfile({ shipping: { ...profile.shipping, fee: e.target.value } })}
              placeholder="vd: Nội thành 20.000đ, tỉnh 30.000đ"
            />
          </Field>
          <Field
            label="Miễn phí ship cho đơn từ (đ)"
            hint="Để trống nếu không áp dụng"
            suffix={
              profile.shipping.freeshipThreshold && profile.shipping.freeshipThreshold > 0
                ? `= ${formatVND(profile.shipping.freeshipThreshold)}`
                : undefined
            }
          >
            <Input
              type="number"
              min={0}
              inputMode="numeric"
              value={profile.shipping.freeshipThreshold ?? ""}
              onChange={(e) =>
                setProfile({
                  shipping: { ...profile.shipping, freeshipThreshold: e.target.value === "" ? undefined : Number(e.target.value) },
                })
              }
              placeholder="vd: 500000"
            />
          </Field>
          <Field label="Thời gian giao dự kiến">
            <Input
              value={profile.shipping.leadTime}
              onChange={(e) => setProfile({ shipping: { ...profile.shipping, leadTime: e.target.value } })}
              placeholder="vd: Nội thành 1 ngày, tỉnh 2–4 ngày"
            />
          </Field>
        </div>
        <Field label="Đơn vị vận chuyển">
          <StringList
            items={profile.shipping.carriers}
            onChange={(carriers) => setProfile({ shipping: { ...profile.shipping, carriers } })}
            placeholder="vd: Giao Hàng Nhanh"
            addLabel="Thêm đơn vị"
            emptyHint="Chưa có đơn vị vận chuyển nào."
          />
        </Field>
      </Section>

      {/* 5 — Thanh toán */}
      <Section icon={CreditCard} title="Thanh toán">
        <Field label="Phương thức thanh toán">
          <StringList
            items={profile.payment.methods}
            onChange={(methods) => setProfile({ payment: { ...profile.payment, methods } })}
            placeholder="vd: COD (nhận hàng trả tiền)"
            addLabel="Thêm phương thức"
            emptyHint="Chưa có phương thức thanh toán nào."
          />
        </Field>
        <ToggleRow
          checked={deposit.enabled}
          onCheckedChange={(v) => setProfile({ payment: { ...profile.payment, deposit: { ...deposit, enabled: v } } })}
          label="Yêu cầu cọc với đơn lớn"
          hint="Đơn vượt ngưỡng sẽ cần khách cọc trước một phần khi đặt"
        />
        {deposit.enabled ? (
          <div className="space-y-3 motion-safe:animate-in motion-safe:fade-in-0">
            <Field
              label="Đơn từ (đ)"
              hint="Ngưỡng áp dụng cọc"
              suffix={deposit.threshold && deposit.threshold > 0 ? `= ${formatVND(deposit.threshold)}` : undefined}
            >
              <Input
                type="number"
                min={0}
                inputMode="numeric"
                value={deposit.threshold ?? ""}
                onChange={(e) =>
                  setProfile({
                    payment: { ...profile.payment, deposit: { ...deposit, threshold: e.target.value === "" ? undefined : Number(e.target.value) } },
                  })
                }
                placeholder="vd: 500000"
              />
            </Field>
            <Field label="Mức cọc (%)" hint="Phần trăm cọc trên giá trị đơn">
              <Input
                type="number"
                min={0}
                max={100}
                inputMode="numeric"
                value={deposit.percent ?? ""}
                onChange={(e) =>
                  setProfile({
                    payment: { ...profile.payment, deposit: { ...deposit, percent: e.target.value === "" ? undefined : Number(e.target.value) } },
                  })
                }
                placeholder="vd: 50"
              />
            </Field>
          </div>
        ) : null}
      </Section>

      {/* 6 — Đổi trả & cam kết chất lượng */}
      <Section icon={ShieldCheck} title="Đổi trả & bảo đảm chất lượng">
        <Field label="Chính sách đổi trả">
          <Textarea
            rows={3}
            value={profile.returnPolicy}
            onChange={(e) => setProfile({ returnPolicy: e.target.value })}
            placeholder="vd: Trái cây hư, dập hoặc giao sai được đổi/hoàn trong ngày — gửi ảnh để shop xử lý…"
          />
        </Field>
        <Field label="Cam kết chất lượng" hint="vd: độ tươi, đúng mô tả, đủ cân">
          <Textarea
            rows={3}
            value={profile.warrantyPolicy}
            onChange={(e) => setProfile({ warrantyPolicy: e.target.value })}
            placeholder="vd: Cam kết trái cây tươi, đúng mô tả; không đạt sẽ đổi hoặc hoàn tiền…"
          />
        </Field>
      </Section>

      {/* 7 — Khuyến mãi đang chạy */}
      <Section icon={Tag} title="Khuyến mãi đang chạy">
        {profile.promotions.length === 0 ? (
          <EmptyState
            icon={Tag}
            title="Chưa có khuyến mãi nào"
            description="Thêm chương trình đang chạy để agent chủ động giới thiệu với khách."
          />
        ) : (
          <div className="space-y-2">
            {profile.promotions.map((p) => (
              <ItemCard key={p.id} onRemove={() => setProfile({ promotions: profile.promotions.filter((x) => x.id !== p.id) })} removeLabel="Xoá khuyến mãi">
                <Input
                  value={p.title}
                  onChange={(e) => updateItem(profile.promotions, p.id, { title: e.target.value }, (promotions) => setProfile({ promotions }))}
                  placeholder="Tên khuyến mãi (vd: Freeship đơn từ 500K)"
                />
                <Input
                  value={p.detail}
                  onChange={(e) => updateItem(profile.promotions, p.id, { detail: e.target.value }, (promotions) => setProfile({ promotions }))}
                  placeholder="Chi tiết / điều kiện áp dụng"
                />
              </ItemCard>
            ))}
          </div>
        )}
        <AddButton
          label="Thêm khuyến mãi"
          onClick={() => setProfile({ promotions: [...profile.promotions, { id: newId(), title: "", detail: "" } satisfies PromoItem] })}
        />
      </Section>

      {/* 8 — FAQ */}
      <Section icon={HelpCircle} title="Câu hỏi thường gặp (FAQ)">
        <p className="text-xs text-muted-foreground">
          Lưu sẵn câu khách hay hỏi kèm câu trả lời mẫu để agent đáp nhanh, đúng giọng shop.
        </p>
        {profile.faq.length === 0 ? (
          <EmptyState
            icon={Sparkles}
            title="Chưa có câu hỏi nào"
            description="Thêm những câu khách hay hỏi cùng câu trả lời mẫu để agent dùng lại."
          />
        ) : (
          <div className="space-y-2">
            {profile.faq.map((f) => (
              <ItemCard key={f.id} onRemove={() => setProfile({ faq: profile.faq.filter((x) => x.id !== f.id) })} removeLabel="Xoá câu hỏi">
                <Input
                  value={f.question}
                  onChange={(e) => updateItem(profile.faq, f.id, { question: e.target.value }, (faq) => setProfile({ faq }))}
                  placeholder="Câu hỏi (vd: Hàng có chính hãng không?)"
                />
                <Textarea
                  rows={2}
                  value={f.answer}
                  onChange={(e) => updateItem(profile.faq, f.id, { answer: e.target.value }, (faq) => setProfile({ faq }))}
                  placeholder="Câu trả lời mẫu"
                />
              </ItemCard>
            ))}
          </div>
        )}
        <AddButton
          label="Thêm câu hỏi"
          onClick={() => setProfile({ faq: [...profile.faq, { id: newId(), question: "", answer: "" } satisfies FaqItem] })}
        />
      </Section>
    </div>
  );
}

// Cập nhật một item trong danh sách theo id rồi đẩy mảng mới lên store (dùng chung cho FAQ & khuyến mãi).
function updateItem<T extends { id: string }>(list: T[], id: string, patch: Partial<T>, commit: (next: T[]) => void) {
  commit(list.map((x) => (x.id === id ? { ...x, ...patch } : x)));
}

// Card section có tiêu đề + icon (§4.3 CardTitle, §9 landmark + aria-labelledby).
function Section({ icon: Icon, title, children }: { icon: React.ComponentType<{ className?: string }>; title: string; children: React.ReactNode }) {
  const headingId = useId();
  return (
    <section aria-labelledby={headingId}>
      <Card size="sm">
        <CardContent className="space-y-4">
          <h2 id={headingId} className="flex items-center gap-2 font-heading text-base font-semibold">
            <Icon className="size-4 text-muted-foreground" aria-hidden />
            {title}
          </h2>
          {children}
        </CardContent>
      </Card>
    </section>
  );
}

// Hàng bật/tắt (§4.4 item surface) — Switch + nhãn + hint; bật mở khối option bên dưới.
function ToggleRow({
  checked,
  onCheckedChange,
  label,
  hint,
}: {
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
  label: string;
  hint?: string;
}) {
  return (
    <label className="flex flex-wrap items-center gap-3 rounded-lg px-3 py-2.5 ring-1 ring-foreground/10 transition-colors hover:bg-muted/50">
      <Switch checked={checked} onCheckedChange={(v) => onCheckedChange(Boolean(v))} />
      <span className="min-w-0 flex-1">
        <span className="block text-sm">{label}</span>
        {hint ? <span className="block text-xs text-muted-foreground">{hint}</span> : null}
      </span>
    </label>
  );
}

// Field — control luôn căn ĐÁY ô (mt-auto) để các input trong cùng hàng lưới thẳng nhau
// dù label/hint dài ngắn khác nhau. `suffix` hiện cạnh label (vd preview tiền) thay vì treo dưới input.
function Field({
  label,
  hint,
  suffix,
  children,
  className,
}: {
  label: string;
  hint?: string;
  suffix?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={cn("flex h-full flex-col gap-1.5", className)}>
      <span className="flex items-baseline justify-between gap-2">
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
        {suffix ? <span className="shrink-0 text-[11px] tabular-nums text-muted-foreground">{suffix}</span> : null}
      </span>
      {hint ? <span className="text-[11px] text-muted-foreground/80">{hint}</span> : null}
      <span className="mt-auto block">{children}</span>
    </label>
  );
}

// Danh sách chuỗi sửa được — mỗi dòng một input + nút xoá, kèm nút thêm (cam kết, đơn vị VC, phương thức TT).
function StringList({
  items,
  onChange,
  placeholder,
  addLabel,
  emptyHint,
}: {
  items: string[];
  onChange: (next: string[]) => void;
  placeholder: string;
  addLabel: string;
  emptyHint: string;
}) {
  return (
    <div className="space-y-2">
      {items.length === 0 ? <p className="text-xs text-muted-foreground">{emptyHint}</p> : null}
      {items.map((value, i) => (
        <div key={i} className="flex items-center gap-2">
          <Input value={value} placeholder={placeholder} onChange={(e) => onChange(items.map((x, j) => (j === i ? e.target.value : x)))} />
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="Xoá dòng"
            title="Xoá"
            onClick={() => onChange(items.filter((_, j) => j !== i))}
          >
            <Trash2 className="size-4" aria-hidden />
          </Button>
        </div>
      ))}
      <AddButton label={addLabel} onClick={() => onChange([...items, ""])} />
    </div>
  );
}

// Khung một item nhiều trường (FAQ / khuyến mãi) — viền nhẹ + nút xoá góc phải.
function ItemCard({ children, onRemove, removeLabel }: { children: React.ReactNode; onRemove: () => void; removeLabel: string }) {
  return (
    <div className="flex items-start gap-2 rounded-lg p-3 ring-1 ring-foreground/10">
      <div className="min-w-0 flex-1 space-y-2">{children}</div>
      <Button type="button" variant="ghost" size="icon-sm" aria-label={removeLabel} title={removeLabel} onClick={onRemove}>
        <Trash2 className="size-4" aria-hidden />
      </Button>
    </div>
  );
}

function AddButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <Button type="button" variant="outline" size="sm" onClick={onClick}>
      <Plus className="size-4" aria-hidden />
      {label}
    </Button>
  );
}

// Empty state trong khối (§6.6) — viền nét đứt + icon muted + giải thích.
function EmptyState({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-foreground/15 px-4 py-8 text-center">
      <span className="flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <Icon className="size-5" />
      </span>
      <p className="text-sm font-medium">{title}</p>
      <p className="max-w-xs text-xs text-muted-foreground">{description}</p>
    </div>
  );
}
