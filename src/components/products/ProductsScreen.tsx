"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { PackageSearch, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DismissibleBanner } from "@/components/ui/dismissible-banner";
import { TopbarBannerSlot } from "@/components/shell/TopbarBannerSlot";
import { cn } from "@/lib/utils";
import { useUiStore } from "@/store/uiStore";
import raw from "@/data/products.json";
import { ProductKpis } from "./ProductKpis";
import { ProductsToolbar, type StockFilter, type View } from "./ProductsToolbar";
import { ProductCard } from "./ProductCard";
import {
  ProductList,
  PRODUCT_SORT_DEFAULT_DIR,
  sortProducts,
  type ProductSortDir,
  type ProductSortKey,
} from "./ProductList";
import { ProductDetailPanel } from "./ProductDetailPanel";
import { AddProductsDialog } from "./AddProductsDialog";
import { stockState, type CatalogItem } from "./meta";

// M3 Sản phẩm — master–detail (như Orders): lede + KPI + banner + toolbar + lưới card + panel chi tiết docked.
// Panel chi tiết liên kết sang Đơn (?o=) / Hội thoại (?c=) / Thanh toán / Agent — "toàn bộ luồng liên quan".

const INITIAL = raw.catalog as CatalogItem[];

export function ProductsScreen({ initialId, initialTab }: { initialId?: string; initialTab?: string }) {
  const router = useRouter();
  const [catalog, setCatalog] = useState<CatalogItem[]>(INITIAL);
  const [query, setQuery] = useState("");
  const [stock, setStock] = useState<StockFilter>("all");
  const [sortKey, setSortKey] = useState<ProductSortKey>("newest");
  const [sortDir, setSortDir] = useState<ProductSortDir>("desc");
  const [view, setView] = useState<View>("list"); // mặc định Danh sách
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(
    initialId && INITIAL.some((p) => p.id === initialId) ? initialId : null,
  );

  // Tab nằm trên topbar (TopBar) — đồng bộ qua uiStore. Vào bằng deep-link tới 1 sản phẩm → mở tab Sản phẩm.
  const tab = useUiStore((s) => s.productsTab);
  const setProductsTab = useUiStore((s) => s.setProductsTab);
  useEffect(() => {
    if (selectedId) setProductsTab("products");
  }, [selectedId, setProductsTab]);

  // Deep-link ?tab= khi vào màn → set vào store.
  useEffect(() => {
    if (initialTab === "overview" || initialTab === "products") setProductsTab(initialTab);
  }, [initialTab, setProductsTab]);

  // …và đổi tab / sản phẩm đang mở thì ghi ngược lên thanh địa chỉ (replace, không nhảy cuộn).
  useEffect(() => {
    const qs = new URLSearchParams();
    qs.set("tab", tab);
    if (selectedId) qs.set("p", selectedId);
    router.replace(`/products?${qs.toString()}`, { scroll: false });
  }, [tab, selectedId, router]);

  const stockCounts = useMemo(() => {
    const m: Record<string, number> = { all: catalog.length, in_stock: 0, low: 0, out: 0 };
    for (const p of catalog) m[stockState(p)] += 1;
    return m;
  }, [catalog]);

  const lowStockCount = stockCounts.low + stockCounts.out;
  const hasFilters = query.trim() !== "" || stock !== "all" || sortKey !== "newest";

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

  // Banner cảnh báo tồn kho — tắt được tại chỗ. Lưu mốc số lượng lúc tắt: nếu sau đó
  // số sản phẩm sắp/hết hàng tăng lên thì hiện lại (việc mới), bằng thì giữ ẩn.
  const [stockBannerDismissedAt, setStockBannerDismissedAt] = useState(0);
  const showStockBanner = lowStockCount > 0 && lowStockCount > stockBannerDismissedAt;

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = catalog.filter((p) => {
      if (stock !== "all" && stockState(p) !== stock) return false;
      if (!q) return true;
      return p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q);
    });
    return sortProducts(list, sortKey, sortDir);
  }, [catalog, query, stock, sortKey, sortDir]);

  const selected = catalog.find((p) => p.id === selectedId) ?? null;

  const resetFilters = () => {
    setQuery("");
    setStock("all");
    applySort("newest", PRODUCT_SORT_DEFAULT_DIR.newest);
  };

  const patchItem = (id: string, patch: Partial<CatalogItem>) =>
    setCatalog((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)));

  const addItems = (items: CatalogItem[]) => {
    if (items.length === 0) return;
    setCatalog((prev) => [...items, ...prev]);
    setSelectedId(items[0].id); // mở chi tiết mục đầu để duyệt/bổ sung ngay
  };

  return (
    // 2 tab đồng bộ qua uiStore. Tab Tổng quan: trang căn giữa max-w-6xl, cuộn bình thường. Tab Sản phẩm:
    // full-width, cao bằng vùng main (h-full) — toolbar trong card header cố định, danh sách cuộn nội bộ
    // (đồng bộ Orders/Payments §6.x).
    <div
      className={cn(
        "flex w-full flex-col gap-4",
        tab === "products" ? "h-full min-h-0" : "mx-auto max-w-6xl",
      )}
    >
      {tab === "overview" ? (
        /* Tab Tổng quan — đọc số liệu, chỉ xem. */
        <div className="flex flex-col gap-6">
          {/* Lede §6.2 */}
          <header className="min-w-0">
            <p className="text-xs text-muted-foreground sm:text-sm">
              Quản lý danh mục agent tư vấn và chốt đơn, theo dõi tồn kho.
            </p>
            <h1 className="text-pretty text-base font-semibold sm:text-lg">
              {catalog.length} sản phẩm trong danh mục,{" "}
              {lowStockCount > 0 ? (
                <span className="text-amber-600">{lowStockCount} sản phẩm sắp/hết hàng cần nhập thêm.</span>
              ) : (
                <span className="text-emerald-600">tồn kho đang ổn.</span>
              )}
            </h1>
          </header>

          <section className="space-y-3" aria-labelledby="product-overview-h">
            <h2 id="product-overview-h" className="text-lg font-semibold">
              Tổng quan danh mục
            </h2>
            <ProductKpis catalog={catalog} />
          </section>
        </div>
      ) : (
        /* Tab Sản phẩm — banner + toolbar + lưới card + panel chi tiết */
        <>
          {/* Banner cảnh báo §6.7 — đẩy vào slot dưới topbar (dán sát, full-width, bo 2 góc dưới) */}
          {showStockBanner ? (
            <TopbarBannerSlot>
              <DismissibleBanner
                tone="amber"
                icon={TriangleAlert}
                dense
                className="rounded-t-none rounded-b-lg"
                onDismiss={() => setStockBannerDismissedAt(lowStockCount)}
                dismissLabel="Tắt cảnh báo tồn kho"
                action={
                  stock !== "low" ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setStock("low")}
                      className="h-6 border-amber-300 bg-amber-100/50 px-2 text-[11px] text-amber-800 hover:bg-amber-100"
                    >
                      Xem
                    </Button>
                  ) : null
                }
              >
                {lowStockCount} sản phẩm sắp/hết hàng — kiểm tra để agent không chốt đơn khi đã hết.
              </DismissibleBanner>
            </TopbarBannerSlot>
          ) : null}

          {/* Vùng làm việc — card bao toolbar (header border-b) + danh sách cuộn + panel chi tiết docked phải.
              Đồng bộ Orders/Payments: toolbar là header của card, không nổi trần. */}
          <div
            className={cn(
              "flex min-h-0 flex-1 flex-col",
              selected && "lg:grid lg:grid-cols-[1fr_22rem] lg:gap-4",
            )}
          >
            <section
              aria-labelledby="catalog-h"
              className={cn(
                "flex min-h-0 flex-1 flex-col rounded-xl bg-card ring-1 ring-foreground/10",
                selected && "hidden lg:flex",
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
                  stock={stock}
                  onStock={setStock}
                  sortKey={sortKey}
                  sortDir={sortDir}
                  onSort={applySort}
                  view={view}
                  onView={setView}
                  stockCounts={stockCounts}
                  hasFilters={hasFilters}
                  onReset={resetFilters}
                  onCreate={() => setCreateOpen(true)}
                />
              </div>

              {/* Lưới / Danh sách — cuộn nội bộ */}
              <div className="min-h-0 flex-1 overflow-y-auto p-2.5">
                {visible.length > 0 ? (
                  view === "list" ? (
                    <ProductList
                      items={visible}
                      selectedId={selectedId}
                      onOpen={(id) => setSelectedId((cur) => (cur === id ? null : id))}
                      sortKey={sortKey}
                      sortDir={sortDir}
                      onSort={toggleSort}
                    />
                  ) : (
                    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                      {visible.map((p) => (
                        <ProductCard
                          key={p.id}
                          item={p}
                          selected={p.id === selectedId}
                          onSelect={() => setSelectedId((cur) => (cur === p.id ? null : p.id))}
                        />
                      ))}
                    </div>
                  )
                ) : (
                  <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-foreground/15 py-16 text-center">
                    <span className="flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
                      <PackageSearch className="size-5" aria-hidden />
                    </span>
                    <p className="text-sm font-medium">Không có sản phẩm khớp bộ lọc</p>
                    <p className="max-w-xs text-xs text-muted-foreground">
                      Thử xoá bớt bộ lọc, hoặc tạo sản phẩm mới bằng agent.
                    </p>
                    {hasFilters ? (
                      <Button variant="outline" size="sm" onClick={resetFilters} className="mt-1">
                        Xoá lọc
                      </Button>
                    ) : null}
                  </div>
                )}
              </div>
            </section>

            {/* Panel chi tiết — docked phải (lg+), full-width thay card trên mobile. Không overlay.
                border (không ring): ring là box-shadow, bị ancestor overflow-hidden cắt mất viền trên/dưới */}
            {selected ? (
              <div className="min-h-0 flex-1 overflow-hidden rounded-xl border border-foreground/10 bg-card lg:h-full lg:flex-none">
                <ProductDetailPanel
                  item={selected}
                  onClose={() => setSelectedId(null)}
                  onChange={(patch) => patchItem(selected.id, patch)}
                />
              </div>
            ) : null}
          </div>
        </>
      )}

      <AddProductsDialog open={createOpen} onOpenChange={setCreateOpen} onAdd={addItems} />
    </div>
  );
}
