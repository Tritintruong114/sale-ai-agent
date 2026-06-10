import { ProductsScreen } from "@/components/products/ProductsScreen";

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ p?: string; tab?: string }>;
}) {
  const { p, tab } = await searchParams;
  return <ProductsScreen initialId={p} initialTab={tab} />;
}
