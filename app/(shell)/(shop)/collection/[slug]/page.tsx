import { notFound } from "next/navigation";
import { getProducts } from "@/lib/products";
import { getCollectionBySlug } from "@/lib/collections";
import CollectionLanding from "@/components/sections/collection/CollectionLanding";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export default async function CollectionPage({ params }: Props) {
  const { slug } = await params;
  const [{ adminDb }, products] = await Promise.all([
    import("@/lib/firebase-admin"),
    getProducts({ fresh: true }),
  ]);
  const collection = await getCollectionBySlug(adminDb, slug);
  if (!collection) notFound();

  return (
    <CollectionLanding
      collection={collection}
      products={products.filter((product) => product.collectionId === collection.id)}
    />
  );
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const { adminDb } = await import("@/lib/firebase-admin");
  const collection = await getCollectionBySlug(adminDb, slug);
  if (!collection) return {};

  return {
    title: `${collection.name} | SWAS Silver Jewellery`,
    description: `Explore the ${collection.name} collection at SWAS.`,
  };
}
