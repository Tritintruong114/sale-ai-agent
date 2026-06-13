import { cn } from "@/lib/utils";

// Logo hệ thống CRM / quản lý bán hàng — dùng ảnh brand thật trong public/ (vuông 1:1).
// Bo góc + ring nhẹ để khớp khuôn icon cổng thanh toán. Nhận className để chỉnh kích thước (size-11, size-6…).

function BrandImg({ src, alt, className }: { src: string; alt: string; className?: string }) {
  return (
    <img
      src={src}
      alt={alt}
      className={cn("shrink-0 rounded-[22%] object-cover ring-1 ring-foreground/10", className)}
    />
  );
}

export function KiotVietIcon({ className }: { className?: string }) {
  return <BrandImg src="/kiotviet.jpeg" alt="KiotViet" className={className} />;
}

export function SapoIcon({ className }: { className?: string }) {
  return <BrandImg src="/sapo.png" alt="Sapo" className={className} />;
}

export function HaravanIcon({ className }: { className?: string }) {
  return <BrandImg src="/haravan-01.png" alt="Haravan" className={className} />;
}
