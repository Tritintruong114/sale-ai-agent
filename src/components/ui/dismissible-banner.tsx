import type { ComponentType, ReactNode, SVGProps } from "react";
import { X } from "lucide-react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

// Banner thông báo dùng chung (§6.7) — vỏ amber/emerald + icon dẫn + nội dung + hành động + nút tắt,
// kèm vùng body tuỳ chọn cho danh sách bên dưới. Dùng cho: cảnh báo tồn kho (Sản phẩm), trạng thái
// "đã duyệt hết" (Đơn/Thanh toán) và khung hàng đợi duyệt HITL (Đơn/Thanh toán).

const bannerVariants = cva("ring-1", {
  variants: {
    tone: {
      amber: "bg-amber-50 ring-amber-200",
      emerald: "bg-emerald-50 ring-emerald-200",
    },
  },
  defaultVariants: { tone: "amber" },
});

const TONE = {
  amber: {
    icon: "text-amber-600",
    body: "text-amber-800",
    dismiss: "text-amber-700 hover:bg-amber-100 hover:text-amber-900",
  },
  emerald: {
    icon: "text-emerald-600",
    body: "text-emerald-800",
    dismiss: "text-emerald-700 hover:bg-emerald-100 hover:text-emerald-900",
  },
} as const;

type Tone = NonNullable<VariantProps<typeof bannerVariants>["tone"]>;

export function DismissibleBanner({
  tone = "amber",
  icon: Icon,
  iconClassName,
  children,
  action,
  body,
  onDismiss,
  dismissLabel = "Ẩn thông báo",
  sticky = false,
  dense = false,
  className,
  ...props
}: {
  tone?: Tone;
  /** Icon dẫn đầu hàng tiêu đề. */
  icon?: ComponentType<SVGProps<SVGSVGElement>>;
  iconClassName?: string;
  /** Nội dung hàng tiêu đề (văn bản, hoặc tiêu đề + mô tả). */
  children: ReactNode;
  /** Hành động phụ ở cuối hàng (vd nút "Xem"). */
  action?: ReactNode;
  /** Vùng nội dung bên dưới hàng tiêu đề (vd danh sách cuộn). */
  body?: ReactNode;
  /** Có nút tắt (X) khi truyền handler. */
  onDismiss?: () => void;
  dismissLabel?: string;
  /** Dính top khi vùng nội dung cuộn (card nổi, vẫn có lề + bo 4 góc). */
  sticky?: boolean;
  /** Gọn lại: chữ nhỏ hơn, padding sát hơn, icon nhỏ hơn. */
  dense?: boolean;
  className?: string;
} & Omit<React.HTMLAttributes<HTMLElement>, "children">) {
  const tones = TONE[tone];
  return (
    <aside
      className={cn(
        bannerVariants({ tone }),
        "rounded-lg",
        sticky && "sticky top-0 z-20",
        className,
      )}
      {...props}
    >
      <div className={cn("flex flex-wrap items-center", dense ? "gap-2 px-2.5 py-1" : "gap-2.5 px-3 py-2")}>
        {Icon ? (
          <Icon className={cn("shrink-0", dense ? "size-3.5" : "size-5", tones.icon, iconClassName)} aria-hidden />
        ) : null}
        <div className={cn("min-w-0 flex-1", dense ? "text-[11px] leading-tight" : "text-sm", tones.body)}>
          {children}
        </div>
        {action}
        {onDismiss ? (
          <button
            type="button"
            onClick={onDismiss}
            aria-label={dismissLabel}
            className={cn(
              "-mr-1 flex shrink-0 cursor-pointer items-center justify-center rounded-md transition-colors",
              dense ? "size-5" : "size-7",
              tones.dismiss,
            )}
          >
            <X className={dense ? "size-3" : "size-4"} aria-hidden />
          </button>
        ) : null}
      </div>
      {body ? <div className="px-3 pb-3">{body}</div> : null}
    </aside>
  );
}
