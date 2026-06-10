import { FacebookIcon, ZaloIcon } from "@/components/icons/channel";
import { cn } from "@/lib/utils";
import {
  APPROVAL_META,
  CHANNEL_LABEL,
  DELIVERY_META,
  ORDER_STATUS,
  PAYMENT_META,
  type Approval,
  type Channel,
  type DeliveryStatus,
  type OrderStatus,
  type PaymentStatus,
} from "./meta";

// Chip dùng chung cho card / row / panel — màu luôn kèm nhãn + icon (a11y §1.2).

export function ChannelMark({ channel, className }: { channel: Channel; className?: string }) {
  return channel === "facebook" ? (
    <FacebookIcon className={cn("size-4", className)} />
  ) : (
    <ZaloIcon className={cn("size-4 rounded-[5px]", className)} />
  );
}

function Chip({ cls, icon: Icon, label }: { cls: string; icon: React.ElementType; label: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-medium", cls)}>
      <Icon className="size-2.5" aria-hidden />
      {label}
    </span>
  );
}

export function StatusChip({ status }: { status: OrderStatus }) {
  const m = ORDER_STATUS[status];
  return <Chip cls={m.cls} icon={m.icon} label={m.label} />;
}

export function ApprovalChip({ approval }: { approval: Approval }) {
  const m = APPROVAL_META[approval];
  return <Chip cls={m.cls} icon={m.icon} label={m.label} />;
}

export function PaymentChip({ status }: { status: PaymentStatus }) {
  const m = PAYMENT_META[status];
  return <Chip cls={m.cls} icon={m.icon} label={m.label} />;
}

export function DeliveryChip({ status }: { status: DeliveryStatus }) {
  const m = DELIVERY_META[status];
  return <Chip cls={m.cls} icon={m.icon} label={m.label} />;
}

export const channelTitle = (channel: Channel) => CHANNEL_LABEL[channel];
