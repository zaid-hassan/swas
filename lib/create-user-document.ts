// lib/create-user-document.ts

import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { User } from "firebase/auth";

export async function ensureUserDocument(
  user: User,
  customName?: string
) {
  const userRef = doc(db, "users", user.uid);

  const snapshot = await getDoc(userRef);

  if (!snapshot.exists()) {
    await setDoc(userRef, {
      uid: user.uid,
      name: customName || user.displayName || "",
      email: user.email || "",
      createdAt: Date.now(),
      addresses: [],
    });
  }
}