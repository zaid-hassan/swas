import { db } from "@/lib/firebase"
import { doc, setDoc } from "firebase/firestore"

let timeout: NodeJS.Timeout | null = null

export function syncCartDebounced(uid: string, items: any[]) {

  if (timeout) clearTimeout(timeout)

  timeout = setTimeout(async () => {

    await setDoc(doc(db, "carts", uid), {
      items,
      updatedAt: Date.now()
    })

  }, 1000)
}