"use client";

import { useEffect, useMemo, useState } from "react";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

import { auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";

import { CircleDollarSign, Package, Truck, CircleCheck } from "lucide-react";

type Order = {
  orderId: string;
  orderNumber: string;
  date: string;
  customer: string;
  amount: number;
  status: string;
  courier: string;
  awb: string;
};

export default function AdminDashboardClient() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [authChecked, setAuthChecked] = useState(false);
  useEffect(() => {
    async function load() {
      const res = await fetch("/api/admin/orders");

      const data = await res.json();

      if (data.success) {
        setOrders(data.orders);
      }
    }

    load();
  }, []);

  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user || user.email !== process.env.NEXT_PUBLIC_ADMIN_EMAIL) {
        router.replace("/");
        return;
      }

      setAuthChecked(true);

      const res = await fetch("/api/admin/orders");
      const data = await res.json();

      if (data.success) {
        setOrders(data.orders);
      }
    });

    return unsubscribe;
  }, [router]);

  if (!authChecked) {
    return (
      <section className="min-h-screen flex items-center justify-center">
        Checking access...
      </section>
    );
  }

  const stats = useMemo(() => {
    const totalSales = orders.reduce((sum, o) => sum + o.amount, 0);

    const pending = orders.filter((o) => !o.awb).length;

    const shipped = orders.filter((o) => o.awb).length;

    return {
      totalSales,
      orders: orders.length,
      pending,
      shipped,
    };
  }, [orders]);

  return (
    <section className="max-w-7xl mx-auto px-4 py-10 space-y-8">
      <h1 className="text-3xl font-semibold">Admin Dashboard</h1>

      <div className="grid md:grid-cols-4 gap-5">
        <Card>
          <CardContent className="p-6">
            <CircleDollarSign className="mb-3 text-green-600" />
            <p className="text-2xl font-bold">₹{stats.totalSales}</p>
            <p className="text-sm text-muted-foreground">Total Sales</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <Package className="mb-3 text-blue-600" />
            <p className="text-2xl font-bold">{stats.orders}</p>
            <p className="text-sm text-muted-foreground">Orders</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <Truck className="mb-3 text-orange-600" />
            <p className="text-2xl font-bold">{stats.pending}</p>
            <p className="text-sm text-muted-foreground">Pending Dispatch</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <CircleCheck className="mb-3 text-purple-600" />
            <p className="text-2xl font-bold">{stats.shipped}</p>
            <p className="text-sm text-muted-foreground">Shipped</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-0 overflow-auto">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/40">
              <tr className="text-left">
                <th className="p-4">Order</th>
                <th className="p-4">Customer</th>
                <th className="p-4">Amount</th>
                <th className="p-4">Status</th>
                <th className="p-4">Courier</th>
              </tr>
            </thead>

            <tbody>
              {orders.map((order) => (
                <tr key={order.orderId} className="border-b">
                  <td className="p-4">
                    <div>
                      <p className="font-medium">{order.orderNumber}</p>

                      <p className="text-xs text-muted-foreground">
                        {order.date}
                      </p>
                    </div>
                  </td>

                  <td className="p-4">{order.customer}</td>

                  <td className="p-4">₹{order.amount}</td>

                  <td className="p-4">
                    <Badge>{order.status}</Badge>
                  </td>

                  <td className="p-4">{order.courier || "Pending"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </section>
  );
}
