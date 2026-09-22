"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { auth, db } from "@/lib/firebase";
import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { Package, RefreshCw } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type Order = {
  id: string;
  orderNumber: string;
  status: string;
  pricing: {
    total: number;
  };
  createdAt: number;
};

export default function OrdersClient() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const loadOrders = useCallback(async () => {
    const user = auth.currentUser;

    if (!user) {
      setOrders([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      const q = query(
        collection(db, "orders"),
        where("userId", "==", user.uid),
        orderBy("createdAt", "desc")
      );

      const snapshot = await getDocs(q);

      setOrders(
        snapshot.docs.map((doc) => ({
          id: doc.id,
          ...(doc.data() as Omit<Order, "id">),
        }))
      );
    } catch (err) {
      console.error("Failed to load orders:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (!user) {
        setOrders([]);
        setLoading(false);
        return;
      }
      loadOrders();
    });

    return unsubscribeAuth;
  }, [loadOrders]);

  if (loading) {
    return (
      <section className="max-w-5xl mx-auto px-4 py-16 text-center">
        Loading orders...
      </section>
    );
  }

  if (!orders.length) {
    return (
      <section className="max-w-5xl mx-auto px-4 py-16 text-center">
        <Package className="mx-auto mb-4 text-muted-foreground" size={48} />
        <h1 className="text-2xl font-semibold">No Orders Yet</h1>
        <p className="text-muted-foreground mt-2">
          Your future SWAS purchases will appear here.
        </p>

        <Link href="/shop">
          <Button className="mt-6">Start Shopping</Button>
        </Link>
      </section>
    );
  }

  return (
    <section className="max-w-5xl mx-auto px-4 py-12">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-3xl font-semibold">My Orders</h1>
        <Button variant="outline" size="sm" disabled={loading} onClick={loadOrders}>
          <RefreshCw className="mr-2 h-4 w-4" /> Refresh
        </Button>
      </div>

      <div className="space-y-5">
        {orders.map((order) => (
          <Card key={order.id}>
            <CardContent className="flex flex-col md:flex-row md:items-center md:justify-between gap-5 p-6">
              <div>
                <p className="font-semibold">{order.orderNumber}</p>

                <p className="text-sm text-muted-foreground mt-1">
                  {new Date(order.createdAt).toLocaleDateString()}
                </p>

                <p className="mt-2 font-medium">₹{order.pricing.total}</p>
              </div>

              <div className="flex items-center gap-4">
                <Badge>{order.status}</Badge>

                <Link href={`/account/orders/${order.id}`}>
                  <Button variant="outline">View Details</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
