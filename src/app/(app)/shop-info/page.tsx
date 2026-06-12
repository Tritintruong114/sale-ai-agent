import { ShopInfoScreen } from "@/components/shop-info/ShopInfoScreen";

export default async function ShopInfoPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab } = await searchParams;
  return <ShopInfoScreen initialTab={tab} />;
}
