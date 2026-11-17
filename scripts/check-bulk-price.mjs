import { adminDb } from '@/lib/firebase-admin';

// Get all categories first
const categoriesSnap = await adminDb.collection('categories').get();
console.log('Categories:');
for (const doc of categoriesSnap.docs) {
  const data = doc.data();
  console.log(`  ${doc.id}: ${data.name} (expired: ${data.expired}, assignedCollections: ${data.assignedCollectionIds?.length || 0})`);
}

console.log('\n--- Products by categoryId ---');
const productsSnap = await adminDb.collection('products').get();
const byCategory = {};
for (const doc of productsSnap.docs) {
  const data = doc.data();
  const catId = data.categoryId || 'no-categoryId';
  if (!byCategory[catId]) byCategory[catId] = [];
  byCategory[catId].push({ id: doc.id, mrp: data.mrp, updatedAt: data.updatedAt, name: data.name });
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