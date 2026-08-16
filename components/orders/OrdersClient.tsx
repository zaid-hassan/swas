"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { auth, db } from "@/lib/firebase";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { Package } from "lucide-react";

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

  useEffect(() => {
    let unsubscribeOrders: (() => void) | undefined;

    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (!user) {
        setOrders([]);
        setLoading(false);
        return;
      }

      const q = query(
        collection(db, "orders"),
        where("userId", "==", user.uid),
        orderBy("createdAt", "desc")
      );

      unsubscribeOrders = onSnapshot(q, (snapshot) => {
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...(doc.data() as Omit<Order, "id">),
        }));

        setOrders(data);
        setLoading(false);
      });
    });

    return () => {
      unsubscribeAuth();
      unsubscribeOrders?.();
    };
  }, []);

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
      <h1 className="text-3xl font-semibold mb-8">My Orders</h1>

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