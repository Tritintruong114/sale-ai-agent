"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { PackageSearch } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Pagination } from "@/components/ui/pagination";
import { cn } from "@/lib/utils";
import { useUiStore } from "@/store/uiStore";
import raw from "@/data/products.json";
import { ProductsToolbar } from "./ProductsToolbar";
import {
  ProductList,
  PRODUCT_SORT_DEFAULT_DIR,
  sortProducts,
  type ProductSortDir,
  type ProductSortKey,
} from "./ProductList";
import { ProductDetailPanel } from "./ProductDetailPanel";
import { AddProductsDialog } from "./AddProductsDialog";
import { type CatalogItem } from "./meta";

// M3 Sản phẩm — master–detail (như Orders): toolbar + lưới card + panel chi tiết docked.

const INITIAL = raw.catalog as CatalogItem[];

export function ProductsScreen({ initialId }: { initialId?: string; initialTab?: string }) {
  const router = useRouter();
  const [catalog, setCatalog] = useState<CatalogItem[]>(INITIAL);
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState<ProductSortKey>("newest");
  const [sortDir, setSortDir] = useState<ProductSortDir>("desc");
  const [listPage, setListPage] = useState(1); // phân trang danh sách (1-based)
  const [listPageSize, setListPageSize] = useState(10);
  const [createOpen, setCreateOpen] = useState(false);
  // Tạo thủ công: bản nháp sản phẩm mới hiển thị trong slide-panel (mode="create"). Loại trừ với selectedId.
  const [newDraft, setNewDraft] = useState<CatalogItem | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(
    initialId && INITIAL.some((p) => p.id === initialId) ? initialId : null,
  );

  // Mở chi tiết 1 sản phẩm (đóng nháp tạo mới nếu đang mở — hai luồng loại trừ nhau).
  const openProduct = (id: string) => {
    setNewDraft(null);
    setSelectedId((cur) => (cur === id ? null : id));
  };
  // Bắt đầu thêm thủ công — mở slide-panel rỗng (mode tạo), đóng chi tiết đang xem.
  const startCreate = () => {
    setSelectedId(null);
    setNewDraft({ id: `cat-new-${Date.now()}`, name: "", price: 0, description: "", imageHint: "" });
  };

  // Tab nằm trên topbar — đồng bộ qua uiStore. Tab Tổng quan đang tạm ẩn → luôn ép về "products".
  const setProductsTab = useUiStore((s) => s.setProductsTab);
  useEffect(() => {
    setProductsTab("products");
  }, [setProductsTab]);

  // Đổi sản phẩm đang mở thì ghi ngược lên thanh địa chỉ (replace, không nhảy cuộn).
  useEffect(() => {
    const qs = new URLSearchParams();
    qs.set("tab", "products");
    if (selectedId) qs.set("p", selectedId);
    router.replace(`/products?${qs.toString()}`, { scroll: false });
  }, [selectedId, router]);

  const hasFilters = query.trim() !== "" || sortKey !== "newest";

  // Sắp xếp do header bảng + Select toolbar cùng quản (controlled). Bấm lại cột đang sắp → đảo chiều;
  // sang cột mới → dùng hướng mặc định của cột. Select đặt thẳng (key, dir).
  const applySort = (key: ProductSortKey, dir: ProductSortDir) => {
    setSortKey(key);
    setSortDir(dir);
  };
  const toggleSort = (key: ProductSortKey) => {
    if (key === sortKey) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else applySort(key, PRODUCT_SORT_DEFAULT_DIR[key]);
  };

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = catalog.filter((p) => {
      if (!q) return true;
      return p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q);
    });
    return sortProducts(list, sortKey, sortDir);
  }, [catalog, query, sortKey, sortDir]);

  // Phân trang chế độ Danh sách: về trang 1 khi tập kết quả đổi (lọc/tìm/sắp xếp/cỡ trang).
  // Reset ngay khi render (pattern chỉnh-state-lúc-render của dự án, không dùng effect), kẹp khi vượt biên.
  const listPageCount = Math.max(1, Math.ceil(visible.length / listPageSize));
  const filterSig = `${query}|${sortKey}|${sortDir}|${listPageSize}`;
  const [prevFilterSig, setPrevFilterSig] = useState(filterSig);
  if (filterSig !== prevFilterSig) {
    setPrevFilterSig(filterSig);
    setListPage(1);
  }
  const safeListPage = Math.min(listPage, listPageCount);
  const pagedVisible = useMemo(
    () => visible.slice((safeListPage - 1) * listPageSize, safeListPage * listPageSize),
    [visible, safeListPage, listPageSize],
  );

  const selected = catalog.find((p) => p.id === selectedId) ?? null;

  const resetFilters = () => {
    setQuery("");
    applySort("newest", PRODUCT_SORT_DEFAULT_DIR.newest);
  };

  const patchItem = (id: string, patch: Partial<CatalogItem>) =>
    setCatalog((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)));

  // Tạm ngưng / mở bán lại — đảo cờ paused tại chỗ (dùng cho cả nút trên bảng lẫn panel chi tiết).
  const togglePause = (id: string) =>
    setCatalog((prev) => prev.map((p) => (p.id === id ? { ...p, paused: !p.paused } : p)));

  // Xoá khỏi danh mục (prototype: chỉ bỏ khỏi state) + đóng panel chi tiết.
  const removeItem = (id: string) => {
    setCatalog((prev) => prev.filter((p) => p.id !== id));
    setSelectedId((cur) => (cur === id ? null : cur));
  };

  const addItems = (items: CatalogItem[]) => {
    if (items.length === 0) return;
    setCatalog((prev) => [...items, ...prev]);
    setSelectedId(items[0].id); // mở chi tiết mục đầu để duyệt/bổ sung ngay
  };

  return (
    // Full-width, cao bằng vùng main (h-full) — toolbar trong card header cố định, danh sách cuộn nội bộ
    // (đồng bộ Orders/Payments §6.x).
    <div className="flex h-full min-h-0 w-full flex-col gap-4">
      {/* Vùng làm việc — card bao toolbar (header border-b) + danh sách cuộn + panel chi tiết docked phải.
          Đồng bộ Orders/Payments: toolbar là header của card, không nổi trần. */}
      <div
        className={cn(
          "flex min-h-0 flex-1 flex-col",
          (selected || newDraft) && "lg:grid lg:grid-cols-[1fr_22rem] lg:gap-4",
        )}
      >
        <section
          aria-labelledby="catalog-h"
          className={cn(
            "flex min-h-0 flex-1 flex-col rounded-xl bg-card ring-1 ring-foreground/10",
            (selected || newDraft) && "hidden lg:flex",
          )}
        >
          <h2 id="catalog-h" className="sr-only">
            Danh mục sản phẩm
          </h2>

          {/* Toolbar — header cố định của card */}
          <div className="shrink-0 rounded-t-xl border-b bg-card p-2">
            <ProductsToolbar
              query={query}
              onQuery={setQuery}
              sortKey={sortKey}
              sortDir={sortDir}
              onSort={applySort}
              hasFilters={hasFilters}
              onReset={resetFilters}
              onCreateManual={startCreate}
              onCreateImport={() => setCreateOpen(true)}
            />
          </div>

          {/* Danh sách — cuộn nội bộ */}
          <div className="min-h-0 flex-1 overflow-y-auto p-2.5">
            {visible.length > 0 ? (
              <ProductList
                items={pagedVisible}
                selectedId={selectedId}
                onOpen={openProduct}
                onTogglePause={togglePause}
                sortKey={sortKey}
                sortDir={sortDir}
                onSort={toggleSort}
              />
            ) : (
              <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-foreground/15 py-16 text-center">
                <span className="flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
                  <PackageSearch className="size-5" aria-hidden />
                </span>
                <p className="text-sm font-medium">Không có sản phẩm khớp bộ lọc</p>
                <p className="max-w-xs text-xs text-muted-foreground">
                  Thử xoá bớt bộ lọc, hoặc thêm sản phẩm mới.
                </p>
                {hasFilters ? (
                  <Button variant="outline" size="sm" onClick={resetFilters} className="mt-1">
                    Xoá lọc
                  </Button>
                ) : null}
              </div>
            )}
          </div>

          {/* Footer phân trang — dính đáy card (không cuộn mất). */}
          {visible.length > 0 ? (
            <div className="shrink-0 border-t px-2.5 py-2">
              <Pagination
                page={safeListPage}
                pageSize={listPageSize}
                total={visible.length}
                onPageChange={setListPage}
                onPageSizeChange={setListPageSize}
                unitLabel="sản phẩm"
              />
            </div>
          ) : null}
        </section>

        {/* Panel chi tiết / tạo mới — docked phải (lg+), full-width thay card trên mobile. Không overlay.
            border (không ring): ring là box-shadow, bị ancestor overflow-hidden cắt mất viền trên/dưới */}
        {newDraft ? (
          <div className="min-h-0 flex-1 overflow-hidden rounded-xl border border-foreground/10 bg-card lg:h-full lg:flex-none">
            <ProductDetailPanel
              mode="create"
              item={newDraft}
              onClose={() => setNewDraft(null)}
              onCreate={(it) => {
                addItems([it]); // prepend + chọn item mới (chuyển panel sang chế độ sửa)
                setNewDraft(null);
              }}
            />
          </div>
        ) : selected ? (
          <div className="min-h-0 flex-1 overflow-hidden rounded-xl border border-foreground/10 bg-card lg:h-full lg:flex-none">
            <ProductDetailPanel
              item={selected}
              onClose={() => setSelectedId(null)}
              onChange={(patch) => patchItem(selected.id, patch)}
              onDelete={removeItem}
            />
          </div>
        ) : null}
      </div>

      <AddProductsDialog open={createOpen} onOpenChange={setCreateOpen} onAdd={addItems} />
    </div>
  );
}
