export function formatVND(value: number): string {
  return new Intl.NumberFormat("vi-VN").format(value) + "đ";
}

// Rút gọn tiền cho thẻ/chip hẹp: 1.040.000 → "1,04 tr", 250.000 → "250k".
export function compactVND(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toLocaleString("vi-VN", { maximumFractionDigits: 2 })} tr`;
  if (value >= 1_000) return `${Math.round(value / 1_000)}k`;
  return `${value}đ`;
}
