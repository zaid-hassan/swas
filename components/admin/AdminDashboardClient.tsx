"use client";

import { useEffect, useMemo, useState } from "react";

import Image from "next/image";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

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

type Product = {
  serial: number;
  category: string;
  image: string;
  name: string;
  material: string;
  mrp: number;
};

export default function AdminDashboardClient() {
  const router = useRouter();

  const [authChecked, setAuthChecked] = useState(false);

  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  const [activeTab, setActiveTab] = useState<"products" | "sales" | "refunds">(
    "sales"
  );

  const PRODUCTS_PER_PAGE = 12;

  const [productsLoading, setProductsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user || user.email !== process.env.NEXT_PUBLIC_ADMIN_EMAIL) {
        router.replace("/");
        return;
      }

      setAuthChecked(true);

      try {
        const [orderRes, productRes] = await Promise.all([
          fetch("/api/admin/orders"),
          fetch("/api/admin/products"),
        ]);

        const orderData = await orderRes.json();
        const productData = await productRes.json();

        if (orderData.success) {
          setOrders(orderData.orders);
        }

        if (productData.success) {
          setProducts(productData.products);
        }
      } catch (err) {
        console.error("Failed to load admin dashboard:", err);
      } finally {
        setProductsLoading(false);
      }
    });

    return unsubscribe;
  }, [router]);

  const totalPages = Math.ceil(products.length / PRODUCTS_PER_PAGE);

  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * PRODUCTS_PER_PAGE;

    return products.slice(start, start + PRODUCTS_PER_PAGE);
  }, [products, currentPage]);

  const stats = useMemo(() => {
    const totalSales = orders.reduce((sum, o) => sum + o.amount, 0);

    return {
      totalSales,
      orders: orders.length,
      pending: orders.filter((o) => !o.awb).length,
      shipped: orders.filter((o) => o.awb).length,
    };
  }, [orders]);

  if (!authChecked) {
    return (
      <section className="min-h-screen flex items-center justify-center">
        Checking access...
      </section>
    );
  }

  return (
    <section className="max-w-7xl mx-auto px-4 py-10 space-y-8">
      {/* Header */}

      <div className="space-y-4">
        <h1 className="text-3xl font-semibold">Admin Dashboard</h1>

        {/* Tabs */}

        <div className="flex gap-2 border-b pb-3">
          <Button
            variant={activeTab === "products" ? "default" : "outline"}
            onClick={() => setActiveTab("products")}
          >
            All Products
          </Button>

          <Button
            variant={activeTab === "sales" ? "default" : "outline"}
            onClick={() => setActiveTab("sales")}
          >
            Sales
          </Button>

          <Button
            variant={activeTab === "refunds" ? "default" : "outline"}
            onClick={() => setActiveTab("refunds")}
          >
            Refunds
          </Button>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* PRODUCTS TAB */}
      {/* ------------------------------------------------------------------ */}

      {activeTab === "products" && (
        <Card>
          <CardContent className="p-6 space-y-6">
            {productsLoading ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {Array.from({ length: PRODUCTS_PER_PAGE }).map((_, i) => (
                  <div key={i} className="space-y-3">
                    <div className="aspect-square rounded-xl bg-muted animate-pulse" />

                    <div className="space-y-2">
                      <div className="h-3 w-24 rounded bg-muted animate-pulse" />

                      <div className="h-4 w-full rounded bg-muted animate-pulse" />

                      <div className="h-3 w-20 rounded bg-muted animate-pulse" />

                      <div className="h-4 w-16 rounded bg-muted animate-pulse" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 transition-opacity duration-300">
                  {paginatedProducts.map((product) => (
                    <div key={product.serial} className="space-y-3">
                      <div className="relative aspect-square rounded-xl overflow-hidden border bg-muted">
                        <Image
                          src={product.image}
                          alt={product.name}
                          fill
                          loading="lazy"
                          sizes="(max-width:768px) 50vw, 25vw"
                          className="object-cover transition-transform duration-300 hover:scale-105"
                        />
                      </div>

                      <div>
                        <p className="text-xs text-muted-foreground">
                          #{product.serial} • {product.category}
                        </p>

                        <h3 className="font-medium line-clamp-2">
                          {product.name}
                        </h3>

                        <p className="text-sm text-muted-foreground">
                          {product.material}
                        </p>

                        <p className="font-semibold mt-1">₹{product.mrp}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 pt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage((p) => p - 1)}
                    >
                      Previous
                    </Button>

                    {Array.from({ length: totalPages }).map((_, i) => (
                      <Button
                        key={i}
                        size="sm"
                        variant={currentPage === i + 1 ? "default" : "outline"}
                        onClick={() => setCurrentPage(i + 1)}
                      >
                        {i + 1}
                      </Button>
                    ))}

                    <Button
                      variant="outline"
                      size="sm"
                      disabled={currentPage === totalPages}
                      onClick={() => setCurrentPage((p) => p + 1)}
                    >
                      Next
                    </Button>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* SALES TAB */}
      {/* ------------------------------------------------------------------ */}

      {activeTab === "sales" && (
        <>
          <div className="grid md:grid-cols-4 gap-5">
            <Card>
              <CardContent className="p-6">
                <CircleDollarSign className="mb-3 text-green-600" />

                <p className="text-2xl font-bold">
                  ₹{stats.totalSales.toLocaleString("en-IN")}
                </p>

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

                <p className="text-sm text-muted-foreground">
                  Pending Dispatch
                </p>
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
        </>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* REFUNDS TAB */}
      {/* ------------------------------------------------------------------ */}

      {activeTab === "refunds" && (
        <Card>
          <CardContent className="p-12 text-center">
            <h2 className="text-xl font-semibold mb-2">Refund Management</h2>

            <p className="text-muted-foreground">
              This tab will display refund requests and their approval status.
            </p>
          </CardContent>
        </Card>
      )}
    </section>
  );
}
