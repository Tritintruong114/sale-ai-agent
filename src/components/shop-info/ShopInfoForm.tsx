"use client";

import { useId } from "react";
import { CreditCard, HelpCircle, Plus, ShieldCheck, Sparkles, Store, Tag, Trash2, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { formatVND } from "@/lib/format";
import { useAgentConfig } from "@/store/agentConfigStore";
import { DEFAULT_CONFIG, type BusinessProfile, type FaqItem, type PromoItem } from "@/data/config";

// Hồ sơ nghiệp vụ shop (form sửa) — dùng chung cho màn Thông tin cửa hàng và Playground.
// Đọc/ghi agentConfigStore (nguồn sự thật chung), tự lưu mỗi lần đổi (không nút Submit),
// gửi sang /api/chat → buildBusinessContext nạp vào system prompt (xem src/lib/shopContext.ts).

// id cho item mới — crypto.randomUUID() có sẵn trên trình duyệt hiện đại.
const newId = () => (typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `id-${Math.random().toString(36).slice(2)}`);

export function ShopInfoForm({ className }: { className?: string }) {
  const config = useAgentConfig((s) => s.config);
  const setConfig = useAgentConfig((s) => s.setConfig);

  // Config cũ trong localStorage có thể thiếu businessProfile → fallback seed mặc định.
  const profile: BusinessProfile = config.businessProfile ?? DEFAULT_CONFIG.businessProfile!;
  const setProfile = (patch: Partial<BusinessProfile>) => setConfig({ businessProfile: { ...profile, ...patch } });

  // Config cũ có thể thiếu deposit → mặc định tắt.
  const deposit = profile.payment.deposit ?? { enabled: false };

  return (
    <div className={cn("space-y-5", className)}>
      {/* 1 — Thông tin cơ bản */}
      <Section icon={Store} title="Thông tin cơ bản">
        <Field label="Tên cửa hàng">
          <Input
            value={config.shopName}
            onChange={(e) => setConfig({ shopName: e.target.value })}
            placeholder="vd: Shop Trái Cây An An"
          />
        </Field>
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
        />
        {deposit.enabled ? (
          <div className="space-y-3 motion-safe:animate-in motion-safe:fade-in-0">
            <Field
              label="Đơn từ (đ)"
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
            <Field label="Mức cọc (%)">
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
      <Section icon={ShieldCheck} title="Đổi trả & cam kết chất lượng">
        <Field label="Chính sách đổi trả">
          <Textarea
            rows={3}
            value={profile.returnPolicy}
            onChange={(e) => setProfile({ returnPolicy: e.target.value })}
            placeholder="vd: Trái cây hư, dập hoặc giao sai được đổi/hoàn trong ngày — gửi ảnh để shop xử lý…"
          />
        </Field>
        <Field label="Cam kết chất lượng">
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
                  placeholder="Tên khuyến mãi (vd: Miễn phí ship đơn từ 500.000đ)"
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
                  placeholder="Câu hỏi (vd: Trái cây có tươi không shop?)"
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
          label="Thêm"
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

// Danh sách chuỗi sửa được — mỗi dòng một input + nút xoá, kèm nút thêm (đơn vị VC, phương thức TT).
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
