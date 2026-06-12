// M3 Sản phẩm — meta dùng chung cho màn.

// Tạm ẩn tab "Tổng quan" — chỉ hiện tab "Sản phẩm".
// Đặt true để khôi phục SegmentView 2 tab Tổng quan / Sản phẩm.
export const PRODUCTS_OVERVIEW_ENABLED = false;

export type Draft = {
  id: string;
  name: string;
  price: number;
  description: string;
  imageHint: string;
  imageUrl?: string | null; // ảnh thật (vd Google Drive thumbnail); fallback về imageHint khi thiếu
  images?: string[];
};

export type CatalogItem = Draft & { paused?: boolean };
