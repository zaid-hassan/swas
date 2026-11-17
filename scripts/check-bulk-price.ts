import { adminDb } from '../lib/firebase-admin';

async function main() {
  // Get all categories
  const categoriesSnap = await adminDb.collection('categories').get();
  console.log('Categories:');
  for (const doc of categoriesSnap.docs) {
    const data = doc.data();
    console.log(`  ${doc.id}: ${data.name} (expired: ${data.expired}, assignedCollections: ${data.assignedCollectionIds?.length || 0})`);
    if (data.assignedCollectionIds?.length) {
      console.log(`    assigned to: ${data.assignedCollectionIds.join(', ')}`);
    }
  }

  // Get all collections
  console.log('\n--- Collections ---');
  const collectionsSnap = await adminDb.collection('collections').get();
  for (const doc of collectionsSnap.docs) {
    const data = doc.data();
    console.log(`  ${doc.id}: ${data.name} (categoryIds: ${data.categoryIds?.join(', ') || 'none'})`);
  }

  console.log('\n--- Products by categoryId ---');
  const productsSnap = await adminDb.collection('products').get();
  const byCategory: Record<string, Array<{ id: string; mrp: number; updatedAt: number; name: string }>> = {};
  for (const doc of productsSnap.docs) {
    const data = doc.data() as Record<string, unknown>;
    const catId = (data.categoryId as string) || 'no-categoryId';
    if (!byCategory[catId]) byCategory[catId] = [];
    byCategory[catId].push({ 
      id: doc.id, 
      mrp: data.mrp as number, 
      updatedAt: data.updatedAt as number, 
      name: data.name as string 
    });
  }

  for (const [catId, products] of Object.entries(byCategory)) {
    console.log(`\nCategory: ${catId} (${products.length} products)`);
    const prices = [...new Set(products.map(p => p.mrp))].sort((a,b) => a-b);
    console.log(`  Unique prices: ${prices.join(', ')}`);
    if (prices.length === 1) {
      console.log(`  ⚠️  ALL SAME PRICE: ₹${prices[0]} - possible bulk update`);
    }
    // Show recent updates
    const recent = products.filter(p => p.updatedAt && p.updatedAt > Date.now() - 7*24*60*60*1000).sort((a,b) => b.updatedAt - a.updatedAt);
    if (recent.length) {
      console.log(`  Recent updates (${recent.length}):`);
      for (const p of recent.slice(0, 5)) {
        console.log(`    ${p.id}: ₹${p.mrp} at ${new Date(p.updatedAt).toISOString()}`);
      }
    }
  }
}

main().catch(console.error);