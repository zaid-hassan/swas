"use client";

import { useEffect, useState } from "react";
import { auth } from "@/lib/firebase";
import { Coins } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function WalletCard() {
  const [coins, setCoins] = useState(0);

  useEffect(() => {
    async function syncWallet() {
      const user = auth.currentUser;
      if (!user) return;

      const res = await fetch("/api/wallet/sync", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          uid: user.uid,
          email: user.email,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setCoins(data.wallet);
      }
    }

    syncWallet();
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
