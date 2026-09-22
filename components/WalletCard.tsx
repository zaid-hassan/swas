"use client";

import { useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { Coins } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function WalletCard() {
  const [coins, setCoins] = useState(0);

  useEffect(() => {
    async function loadWallet() {
      const user = auth.currentUser;
      if (!user) return;

      try {
        const snap = await getDoc(doc(db, "users", user.uid));
        setCoins(snap.data()?.wallet?.coins || 0);
      } catch (err) {
        console.error(err);
      }
    }

    loadWallet();
  }, []);

  return (
    <Card>
      <CardContent className="p-6 flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">SWAS Wallet</p>

          <h2 className="text-3xl font-bold">{coins} Coins</h2>

          <p className="text-sm text-muted-foreground mt-1">
            1 Coin = ₹1
          </p>
        </div>

        <Coins className="w-12 h-12 text-yellow-500" />
      </CardContent>
    </Card>
  );
}
