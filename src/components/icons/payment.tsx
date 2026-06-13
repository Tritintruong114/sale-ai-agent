import { cn } from "@/lib/utils";

// Logo cổng thanh toán — dùng ảnh brand thật trong public/ (vuông 1:1). Bo góc + ring nhẹ
// để khớp khuôn icon CRM. Nhận className để chỉnh kích thước (size-11…). Dùng ở tab Cổng thanh toán (§6.14).

function BrandImg({ src, alt, className }: { src: string; alt: string; className?: string }) {
  return (
    <img
      src={src}
      alt={alt}
      className={cn("shrink-0 rounded-[22%] object-cover ring-1 ring-foreground/10", className)}
    />
  );
}

export function SePayIcon({ className }: { className?: string }) {
  return <BrandImg src="/sepay.webp" alt="SePay" className={className} />;
}

export function VNPayIcon({ className }: { className?: string }) {
  return <BrandImg src="/vnpay.jpg" alt="VNPay" className={className} />;
}

export function MoMoIcon({ className }: { className?: string }) {
  return <BrandImg src="/momo.png" alt="MoMo" className={className} />;
}
