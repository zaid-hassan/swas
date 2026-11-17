import { adminDb } from '../lib/firebase-admin';

async function main() {
  console.log('--- Products detail (category vs categoryId) ---');
  const productsSnap = await adminDb.collection('products').get();
  for (const doc of productsSnap.docs) {
    const data = doc.data() as Record<string, unknown>;
    console.log(`${doc.id}: category="${data.category}", categoryId="${data.categoryId}", collectionId="${data.collectionId}", mrp=${data.mrp}, name="${data.name}"`);
  }
}

main().catch(console.error);