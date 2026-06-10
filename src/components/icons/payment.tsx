// Logo cổng thanh toán (brand mark) — màu brand gắn sẵn trong SVG để hiển thị nhất quán
// trên mọi nền, không phụ thuộc currentColor. Dùng ở tab Cài đặt màn Thanh toán (§6.14).

// SePay — cổng QR ngân hàng. Emblem chữ "S" trên nền xanh dương brand.
export function SePayIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden>
      <rect width="48" height="48" rx="12" fill="#1A56DB" />
      <path
        fill="#fff"
        d="M31 17.4c-1.7-1.6-4-2.5-6.7-2.5-4.6 0-7.8 2.3-7.8 5.9 0 3.2 2.2 4.7 6.4 5.6l1.9.4c2.2.5 2.9 1 2.9 2 0 1.2-1.3 2-3.4 2-2.3 0-4.2-.9-5.6-2.4l-2.7 3c1.9 2 4.8 3.2 8.1 3.2 4.9 0 8.2-2.4 8.2-6.2 0-3.2-2.1-4.8-6.6-5.7l-1.9-.4c-2-.4-2.7-.9-2.7-1.9 0-1.1 1.2-1.8 3.2-1.8 2 0 3.7.7 5 2l2-3z"
      />
    </svg>
  );
}

// VNPay — cổng thanh toán điện tử (QR). Wordmark đỏ brand kèm chỉ số "QR".
export function VNPayIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden>
      <rect width="48" height="48" rx="12" fill="#fff" stroke="#E5E7EB" />
      <text
        x="24"
        y="22"
        textAnchor="middle"
        fontFamily="Arial, Helvetica, sans-serif"
        fontSize="11"
        fontWeight="800"
        fill="#005BAA"
      >
        VN
      </text>
      <text
        x="24"
        y="34"
        textAnchor="middle"
        fontFamily="Arial, Helvetica, sans-serif"
        fontSize="11"
        fontWeight="800"
        fill="#ED1C24"
      >
        PAY
      </text>
    </svg>
  );
}

// MoMo — ví điện tử. Emblem chữ "M" trên nền hồng brand.
export function MoMoIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden>
      <rect width="48" height="48" rx="12" fill="#A50064" />
      <text
        x="24"
        y="32"
        textAnchor="middle"
        fontFamily="Arial, Helvetica, sans-serif"
        fontSize="20"
        fontWeight="800"
        fill="#fff"
      >
        M
      </text>
    </svg>
  );
}
