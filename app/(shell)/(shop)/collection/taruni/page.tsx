import CommingSoon from '@/components/global/commingsoon/commingSoon'
import CollectionLanding from '@/components/sections/collection/CollectionLanding'
import { getCollectionBySlug } from '@/lib/collections'
import { getProducts } from '@/lib/products'

export const dynamic = 'force-dynamic'

async function page() {
  try {
    const [{ adminDb }, products] = await Promise.all([
      import('@/lib/firebase-admin'),
      getProducts({ fresh: true }),
    ])
    const collection = await getCollectionBySlug(adminDb, 'taruni')
    if (collection) {
      return <CollectionLanding collection={collection} products={products.filter((product) => product.collectionId === collection.id)} />
    }
  } catch {
    // Keep the legacy route available if Firestore is temporarily unavailable.
  }
  return (
    <CommingSoon />
  )
}

export default page