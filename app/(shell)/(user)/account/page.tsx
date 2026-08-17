"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { toast } from "sonner";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";

import {
  Loader2,
  LogOut,
  Package,
  Coins,
} from "lucide-react";

export default function AccountPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [coins, setCoins] = useState(0);
  const [walletLoading, setWalletLoading] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [user, loading, router]);

  useEffect(() => {
    async function syncWallet() {
      if (!user) return;

      try {
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
          setCoins(data.wallet || 0);

          if (data.addedCoins > 0) {
            toast.success(`${data.addedCoins} coins added to your SWAS Wallet!`);
          }
        }
      } catch (err) {
        console.error("Wallet sync failed:", err);
      } finally {
        setWalletLoading(false);
      }
    }

    syncWallet();
  }, [user]);

  async function handleLogout() {
    await signOut(auth);
    toast.success("Logged out successfully");
    router.push("/");
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  const initials =
    user.displayName
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase() || "U";

  return (
    <div className="mx-auto max-w-5xl px-4 py-16 space-y-8">
      {/* Page Title */}

      <div>
        <h1 className="text-3xl font-heading font-semibold tracking-tight">
          My Account
        </h1>

        <p className="text-muted-foreground mt-2">
          Manage your profile, wallet and orders.
        </p>
      </div>

      {/* Wallet Card */}

      <Card className="border-yellow-300 bg-gradient-to-r from-yellow-50 to-amber-50">
        <CardContent className="p-6 flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">SWAS Wallet</p>

            {walletLoading ? (
              <div className="mt-2 h-10 w-28 rounded bg-yellow-200 animate-pulse" />
            ) : (
              <h2 className="text-3xl font-bold text-yellow-700">
                {coins} Coins
              </h2>
            )}

            <p className="text-sm text-muted-foreground mt-1">
              Earn coins on approved refunds.
            </p>
          </div>

          <Coins className="h-14 w-14 text-yellow-500" />
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Profile Card */}

        <Card className="md:col-span-1">
          <CardHeader className="items-center text-center">
            <Avatar className="h-16 w-16">
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>

            <CardTitle className="mt-4">
              {user.displayName || "SWAS Customer"}
            </CardTitle>

            <CardDescription>{user.email}</CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <Separator />

            <Button
              variant="outline"
              className="w-full justify-start gap-2"
              onClick={() => router.push("/account/orders")}
            >
              <Package size={16} />
              My Orders
            </Button>

            <Separator />

            <Button
              variant="destructive"
              className="w-full justify-start gap-2"
              onClick={handleLogout}
            >
              <LogOut size={16} />
              Logout
            </Button>
          </CardContent>
        </Card>

        {/* Orders Card */}

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Recent Orders</CardTitle>

            <CardDescription>
              View all your purchases and track deliveries.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <div className="flex flex-col items-center justify-center py-12 text-center space-y-3">
              <Package className="h-8 w-8 text-muted-foreground" />

              <p className="text-muted-foreground text-sm">
                View your complete order history.
              </p>

              <Button onClick={() => router.push("/account/orders")}>
                View Orders
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}