"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import Image from "next/image";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import {
  CircleDollarSign,
  Package,
  Truck,
  CircleCheck,
  RefreshCw,
  Upload,
  Eye,
  EyeOff,
} from "lucide-react";

import type { AdminProduct } from "@/types/products";
import { isAdminEmail, isSuperAdminEmail } from "@/lib/admin-auth";
import type { OrderStatus } from "@/lib/orders";
import type { Refund, RefundStatus } from "@/types/refunds";
import SingleProductForm from "@/components/admin/SingleProductForm";
import ProductEditor from "@/components/admin/ProductEditor";
import HomeVideosPanel from "@/components/admin/HomeVideosPanel";

const PRODUCTS_PER_PAGE = 12;

const ORDER_STATUS_OPTIONS: OrderStatus[] = ["paid", "shipped", "delivered", "cancelled"];

export function adminHeaders(extra?: Record<string, string>) {
  return {
    "x-admin-email": auth.currentUser?.email || "",
    ...(extra || {}),
  };
}

export default function AdminDashboardClient() {
  const router = useRouter();

  const [authChecked, setAuthChecked] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"products" | "orders" | "refunds" | "home">("orders");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user || !isAdminEmail(user.email)) {
        router.replace("/");
        return;
      }
      setUserEmail(user.email);
      setAuthChecked(true);
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

  return (
    <section className="admin-dashboard mx-auto max-w-7xl space-y-8 px-4 py-10 [&_[data-slot=card]]:border-gold/25 [&_[data-slot=card]]:shadow-[0_8px_28px_rgba(41,7,7,0.045)]">
      <div className="space-y-4 border-b border-gold/25 pb-4">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-gold-soft">SWAS · Management</p>
            <h1 className="mt-1 font-heading text-3xl font-medium text-burgundy md:text-4xl">Admin Dashboard</h1>
          </div>
          <span className="hidden border border-gold/30 bg-white px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-burgundy sm:inline-flex">Control centre</span>
        </div>

        <div className="flex flex-wrap gap-2 border-b border-gold/20 pb-3">
          <Button
            variant={activeTab === "products" ? "default" : "outline"}
            className={activeTab === "products" ? "border-burgundy bg-burgundy text-gold hover:bg-burgundy-rich" : "border-gold/30 text-burgundy hover:bg-gold/10"}
            onClick={() => setActiveTab("products")}
          >
            All Products
          </Button>
          <Button
            variant={activeTab === "orders" ? "default" : "outline"}
            className={activeTab === "orders" ? "border-burgundy bg-burgundy text-gold hover:bg-burgundy-rich" : "border-gold/30 text-burgundy hover:bg-gold/10"}
            onClick={() => setActiveTab("orders")}
          >
            Orders
          </Button>
          <Button
            variant={activeTab === "refunds" ? "default" : "outline"}
            className={activeTab === "refunds" ? "border-burgundy bg-burgundy text-gold hover:bg-burgundy-rich" : "border-gold/30 text-burgundy hover:bg-gold/10"}
            onClick={() => setActiveTab("refunds")}
          >
            Refunds
          </Button>
          <Button
            variant={activeTab === "home" ? "default" : "outline"}
            className={activeTab === "home" ? "border-burgundy bg-burgundy text-gold hover:bg-burgundy-rich" : "border-gold/30 text-burgundy hover:bg-gold/10"}
            onClick={() => setActiveTab("home")}
          >
            Home page
          </Button>
        </div>
      </div>

      {activeTab === "products" && (
        <ProductsTab canBulkUpload={isSuperAdminEmail(userEmail)} />
      )}
      {activeTab === "orders" && <OrdersTab />}
      {activeTab === "refunds" && <RefundsTab />}
      {activeTab === "home" && <HomeVideosPanel />}
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* PRODUCTS                                                                    */
/* -------------------------------------------------------------------------- */

function ProductsTab({ canBulkUpload }: { canBulkUpload: boolean }) {
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [bulkCategory, setBulkCategory] = useState("");
  const [basePrice, setBasePrice] = useState("");
  const [percentage, setPercentage] = useState("");
  const [priceDirection, setPriceDirection] = useState<"increase" | "decrease">("increase");
  const [updatingPrices, setUpdatingPrices] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/products", { headers: adminHeaders() });
      const data = await res.json();
      if (data.success) setProducts(data.products);
      else toast.error(data.error || "Failed to load products");
    } catch {
      toast.error("Failed to load products");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleFile(file: File) {
    setSyncing(true);
    try {
      const XLSX = await import("xlsx");
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: "array" });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(ws, { defval: "" });

      const res = await fetch("/api/admin/products/sync", {
        method: "POST",
        headers: adminHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({ rows }),
      });
      const data = await res.json();

      if (!data.success) {
        toast.error(data.error || "Sync failed");
        return;
      }

      toast.success(
        `Synced: ${data.inserted} new, ${data.updated} updated, ${data.hidden} hidden, ${data.skipped} unchanged of ${data.total}.`
      );
      if (data.errors?.length) {
        toast.warning(`${data.errors.length} rows need attention.`);
      }
      await load();
    } catch {
      toast.error("Sync failed");
    } finally {
      setSyncing(false);
    }
  }

  async function toggleVisible(product: AdminProduct) {
    const res = await fetch(`/api/admin/products/p-${product.id}`, {
      method: "PATCH",
      headers: adminHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify({ isVisible: !product.isVisible }),
    });
    const data = await res.json();
    if (!data.success) {
      toast.error(data.error || "Update failed");
      return;
    }
    setProducts((prev) =>
      prev.map((p) => (p.id === product.id ? { ...p, isVisible: !p.isVisible } : p))
    );
  }


  async function updateCategoryPrices() {
    const base = Number(basePrice);
    const percent = Number(percentage);
    if (!bulkCategory || !Number.isFinite(base) || base <= 0 || !Number.isFinite(percent) || percent < 0) {
      toast.error("Choose a category and enter a valid base price and percentage");
      return;
    }
    if (priceDirection === "decrease" && percent > 100) {
      toast.error("A price decrease cannot exceed 100%");
      return;
    }
    const newPrice = Math.round(base * (priceDirection === "increase" ? 1 + percent / 100 : 1 - percent / 100));
    if (!window.confirm(`Set every product in “${bulkCategory}” to ₹${newPrice} (${priceDirection} ${percent}% from ₹${base})?`)) return;

    setUpdatingPrices(true);
    try {
      const response = await fetch("/api/admin/products/bulk-price", {
        method: "POST",
        headers: adminHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({ category: bulkCategory, basePrice: base, percentage: percent, direction: priceDirection }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || "Bulk price update failed");
      toast.success(`Updated ${data.updated} products in ${data.category} to ₹${data.price}.`);
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Bulk price update failed");
    } finally {
      setUpdatingPrices(false);
    }
  }

  const totalPages = Math.max(1, Math.ceil(products.length / PRODUCTS_PER_PAGE));
  const paginated = useMemo(() => {
    const start = (currentPage - 1) * PRODUCTS_PER_PAGE;
    return products.slice(start, start + PRODUCTS_PER_PAGE);
  }, [products, currentPage]);

  return (
    <>
      <SingleProductForm onCreated={load} />
      <Card className="overflow-hidden border-gold/30 bg-white shadow-sm">
        <CardContent className="space-y-4 p-5">
          <div className="border-l-2 border-gold pl-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gold-soft">Pricing tools</p>
            <h3 className="font-heading text-xl text-burgundy">Bulk price update by category</h3>
            <p className="mt-1 text-sm text-muted-foreground">Sets every product in the selected category to the base price adjusted by the percentage.</p>
          </div>
          <div className="grid gap-3 md:grid-cols-4">
            <label className="text-sm">Category
              <select className="mt-1 w-full rounded-md border bg-background px-3 py-2" value={bulkCategory} onChange={(event) => setBulkCategory(event.target.value)}>
                <option value="">Select category</option>
                {Array.from(new Set(products.map((product) => product.category.trim()).filter(Boolean))).sort((a, b) => a.localeCompare(b)).map((category) => <option key={category} value={category}>{category}</option>)}
              </select>
            </label>
            <label className="text-sm">Base price (₹)<Input className="mt-1" type="number" min="1" value={basePrice} onChange={(event) => setBasePrice(event.target.value)} /></label>
            <label className="text-sm">Percentage (%)<Input className="mt-1" type="number" min="0" max={priceDirection === "decrease" ? 100 : undefined} step="0.01" value={percentage} onChange={(event) => setPercentage(event.target.value)} /></label>
            <div className="flex items-end gap-2">
              <Button type="button" variant={priceDirection === "increase" ? "default" : "outline"} onClick={() => setPriceDirection("increase")}>Increase</Button>
              <Button type="button" variant={priceDirection === "decrease" ? "default" : "outline"} onClick={() => setPriceDirection("decrease")}>Decrease</Button>
            </div>
          </div>
          <Button disabled={updatingPrices || loading || !products.length} onClick={updateCategoryPrices}>
            {updatingPrices ? "Updating prices…" : "Apply to category"}
          </Button>
        </CardContent>
      </Card>
      <Card className="border-gold/25 shadow-[0_8px_28px_rgba(41,7,7,0.045)]">
        <CardContent className="p-6 space-y-6">
          <div className="space-y-3 border-b pb-5">
            <div className="flex flex-wrap items-center gap-3">
              {canBulkUpload ? (
                <label className="text-sm font-medium">
                  Upload XLSX (full catalog replace)
                  <Input
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    className="mt-1 max-w-xs"
                    disabled={syncing}
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleFile(f);
                      e.target.value = "";
                    }}
                  />
                </label>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Bulk catalog upload is restricted to the super admin.
                </p>
              )}
              <Button variant="outline" disabled={loading} onClick={load}>
                <RefreshCw className="mr-2 h-4 w-4" /> Refresh
              </Button>
            </div>
            {canBulkUpload && (
              <p className="text-sm text-muted-foreground">
                Products in the file are added/updated. Products missing from the file are hidden
                (not deleted). Invalid uploads are rejected without changing anything.
              </p>
            )}
          </div>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {Array.from({ length: PRODUCTS_PER_PAGE }).map((_, i) => (
              <div key={i} className="space-y-3">
                <div className="aspect-square rounded-xl bg-muted animate-pulse" />
                <div className="h-3 w-24 rounded bg-muted animate-pulse" />
                <div className="h-4 w-full rounded bg-muted animate-pulse" />
              </div>
            ))}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {paginated.map((product) => (
                <div
                  key={product.id}
                  className={editingId === product.id
                    ? "col-span-full"
                    : "space-y-3 rounded-sm border border-gold/20 bg-white p-3 shadow-[0_3px_12px_rgba(41,7,7,0.035)] transition duration-200 hover:-translate-y-0.5 hover:border-gold/50 hover:shadow-[0_10px_24px_rgba(41,7,7,0.08)]"}
                >
                  {editingId === product.id ? (
                    <ProductEditor
                      product={product}
                      onSaved={() => {
                        setEditingId(null);
                        void load();
                      }}
                      onCancel={() => setEditingId(null)}
                    />
                  ) : (
                    <>
                      <div className="relative aspect-square overflow-hidden rounded-sm border border-gold/20 bg-warm">
                        {product.image ? (
                          <Image
                            src={product.image}
                            alt={product.name}
                            fill
                            loading="lazy"
                            sizes="(max-width:768px) 50vw, 25vw"
                            className={`object-cover ${product.isVisible ? "" : "opacity-40"}`}
                          />
                        ) : null}
                        {!product.isVisible && (
                          <span className="absolute left-2 top-2 rounded bg-burgundy px-2 py-0.5 text-[10px] font-semibold uppercase text-gold">
                            Hidden
                          </span>
                        )}
                      </div>
                      <div>
                        <p className="text-xs text-gold-soft">#{product.id} · {product.category}</p>
                        <h3 className="line-clamp-2 font-medium text-burgundy">{product.name}</h3>
                        <p className="text-sm text-muted-foreground">{product.material}</p>
                        <p className="mt-1 font-semibold text-burgundy">₹{product.price}</p>
                        <div className="flex flex-wrap gap-2 pt-1">
                          <Button size="sm" variant="outline" className="border-gold/35 text-burgundy hover:bg-gold/10" onClick={() => setEditingId(product.id)}>Edit</Button>
                          <Button size="sm" variant="outline" className="border-gold/35 text-burgundy hover:bg-gold/10" onClick={() => toggleVisible(product)}>
                            {product.isVisible ? <><EyeOff className="mr-1 h-3.5 w-3.5" /> Hide</> : <><Eye className="mr-1 h-3.5 w-3.5" /> Show</>}
                          </Button>
                        </div>
                      </div>
                    </>
                  )}
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
                <span className="text-sm text-muted-foreground">
                  Page {currentPage} of {totalPages}
                </span>
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
    </>
  );
}

/* -------------------------------------------------------------------------- */
/* ORDERS                                                                      */
/* -------------------------------------------------------------------------- */

type AdminOrder = {
  id: string;
  orderNumber: string;
  createdAt: number;
  customer?: { name?: string; email?: string; phone?: string };
  pricing?: { total?: number };
  status?: OrderStatus;
  fulfillment?: { courier?: string; awb?: string; trackingUrl?: string };
};

function OrdersTab() {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/orders", { headers: adminHeaders() });
      const data = await res.json();
      if (data.success) setOrders(data.orders);
      else toast.error(data.error || "Failed to load orders");
    } catch {
      toast.error("Failed to load orders");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const stats = useMemo(() => {
    const totalSales = orders.reduce((sum, o) => sum + (o.pricing?.total ?? 0), 0);
    return {
      totalSales,
      orders: orders.length,
      pending: orders.filter((o) => !o.fulfillment?.awb).length,
      shipped: orders.filter((o) => !!o.fulfillment?.awb).length,
    };
  }, [orders]);

  return (
    <>
      <div className="grid md:grid-cols-4 gap-5">
        <StatCard icon={CircleDollarSign} value={`₹${stats.totalSales.toLocaleString("en-IN")}`} label="Total Sales" />
        <StatCard icon={Package} value={String(stats.orders)} label="Orders" />
        <StatCard icon={Truck} value={String(stats.pending)} label="Pending Dispatch" />
        <StatCard icon={CircleCheck} value={String(stats.shipped)} label="Shipped" />
      </div>

      <Card className="border-gold/25 shadow-[0_8px_28px_rgba(41,7,7,0.045)]">
        <CardContent className="p-0 overflow-auto">
          <div className="flex items-center justify-between border-b p-4">
            <p className="text-sm font-medium">Recent Orders</p>
            <Button variant="outline" size="sm" disabled={loading} onClick={load}>
              <RefreshCw className="mr-2 h-4 w-4" /> Refresh
            </Button>
          </div>

          {loading ? (
            <div className="p-8 text-center text-muted-foreground">Loading orders...</div>
          ) : orders.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">No orders yet.</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="border-b border-gold/25 bg-cream text-burgundy">
                <tr className="text-left">
                  <th className="p-4">Order</th>
                  <th className="p-4">Customer</th>
                  <th className="p-4">Amount</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Courier</th>
                  <th className="p-4"></th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <OrderRow
                    key={order.id}
                    order={order}
                    expanded={expanded === order.id}
                    onToggle={() => setExpanded(expanded === order.id ? null : order.id)}
                    onSaved={load}
                  />
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </>
  );
}

function OrderRow({
  order,
  expanded,
  onToggle,
  onSaved,
}: {
  order: AdminOrder;
  expanded: boolean;
  onToggle: () => void;
  onSaved: () => void;
}) {
  const [status, setStatus] = useState<OrderStatus>(order.status ?? "paid");
  const [courier, setCourier] = useState(order.fulfillment?.courier ?? "");
  const [awb, setAwb] = useState(order.fulfillment?.awb ?? "");
  const [trackingUrl, setTrackingUrl] = useState(order.fulfillment?.trackingUrl ?? "");
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/orders/${order.id}`, {
        method: "PATCH",
        headers: adminHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({ status, courier, awb, trackingUrl }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Update failed");
      toast.success("Order updated");
      onSaved();
    } catch (err: any) {
      toast.error(err?.message || "Update failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <tr className="border-b">
        <td className="p-4">
          <p className="font-medium">{order.orderNumber}</p>
          <p className="text-xs text-muted-foreground">
            {order.createdAt ? new Date(order.createdAt).toLocaleString("en-IN") : "-"}
          </p>
        </td>
        <td className="p-4">{order.customer?.name || "-"}</td>
        <td className="p-4">₹{order.pricing?.total ?? 0}</td>
        <td className="p-4">
          <Badge>{order.status ?? "paid"}</Badge>
        </td>
        <td className="p-4">{order.fulfillment?.courier || order.fulfillment?.awb || "Pending"}</td>
        <td className="p-4 text-right">
          <Button size="sm" variant="outline" onClick={onToggle}>
            {expanded ? "Close" : "Manage"}
          </Button>
        </td>
      </tr>

      {expanded && (
        <tr className="border-b bg-muted/20">
          <td colSpan={6} className="p-4">
            <div className="grid gap-3 md:grid-cols-4">
              <label className="text-sm">
                Status
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as OrderStatus)}
                  className="mt-1 w-full rounded border bg-background px-3 py-2 text-sm"
                >
                  {ORDER_STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-sm">
                Courier
                <Input value={courier} onChange={(e) => setCourier(e.target.value)} className="mt-1" />
              </label>
              <label className="text-sm">
                AWB
                <Input value={awb} onChange={(e) => setAwb(e.target.value)} className="mt-1" />
              </label>
              <label className="text-sm">
                Tracking URL
                <Input
                  value={trackingUrl}
                  onChange={(e) => setTrackingUrl(e.target.value)}
                  className="mt-1"
                />
              </label>
            </div>
            <div className="mt-3">
              <Button size="sm" disabled={saving} onClick={save}>
                {saving ? "Saving..." : "Save Fulfillment"}
              </Button>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

function StatCard({
  icon: Icon,
  value,
  label,
}: {
  icon: any;
  value: string;
  label: string;
}) {
  return (
    <Card className="border-gold/25 shadow-[0_8px_28px_rgba(41,7,7,0.045)]">
      <CardContent className="p-6">
        <Icon className="mb-3 rounded-sm bg-gold/15 p-2 text-burgundy" />
        <p className="text-2xl font-bold text-burgundy">{value}</p>
        <p className="text-sm uppercase tracking-[0.12em] text-muted-foreground">{label}</p>
      </CardContent>
    </Card>
  );
}

/* -------------------------------------------------------------------------- */
/* REFUNDS                                                                     */
/* -------------------------------------------------------------------------- */

function RefundsTab() {
  const [refunds, setRefunds] = useState<Refund[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/refunds", { headers: adminHeaders() });
      const data = await res.json();
      if (data.success) setRefunds(data.refunds);
      else toast.error(data.error || "Failed to load refunds");
    } catch {
      toast.error("Failed to load refunds");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function review(id: string, action: "approve" | "reject") {
    setBusy(id);
    try {
      const res = await fetch(`/api/admin/refunds/${id}`, {
        method: "PATCH",
        headers: adminHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Review failed");
      toast.success(
        action === "approve"
          ? data.credited
            ? `Approved — ${data.amount} coins credited.`
            : "Approved (no linked user, coins not credited)."
          : "Refund rejected."
      );
      await load();
    } catch (err: any) {
      toast.error(err?.message || "Review failed");
    } finally {
      setBusy(null);
    }
  }

  return (
    <>
      <div className="grid md:grid-cols-3 gap-5">
        <StatCard icon={Package} value={String(refunds.length)} label="Total Requests" />
        <StatCard
          icon={Truck}
          value={String(refunds.filter((r) => r.status === "pending").length)}
          label="Pending"
        />
        <StatCard
          icon={CircleCheck}
          value={String(refunds.filter((r) => r.status === "approved").length)}
          label="Approved"
        />
      </div>

      <Card className="border-gold/25 shadow-[0_8px_28px_rgba(41,7,7,0.045)]">
        <CardContent className="p-0 overflow-auto">
          <div className="flex items-center justify-between border-b p-4">
            <p className="text-sm font-medium">Refund Requests</p>
            <Button variant="outline" size="sm" disabled={loading} onClick={load}>
              <RefreshCw className="mr-2 h-4 w-4" /> Refresh
            </Button>
          </div>

          {loading ? (
            <div className="p-8 text-center text-muted-foreground">Loading refunds...</div>
          ) : refunds.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">No refund requests yet.</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="border-b border-gold/25 bg-cream text-burgundy">
                <tr className="text-left">
                  <th className="p-4">Refund</th>
                  <th className="p-4">Customer</th>
                  <th className="p-4">Amount</th>
                  <th className="p-4">Reason</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Coins</th>
                  <th className="p-4"></th>
                </tr>
              </thead>
              <tbody>
                {refunds.map((refund) => (
                  <tr key={refund.id} className="border-b">
                    <td className="p-4">
                      <p className="font-medium">{refund.id.slice(0, 8)}</p>
                      <p className="text-xs text-muted-foreground">
                        {refund.createdAt
                          ? new Date(refund.createdAt).toLocaleString("en-IN")
                          : "-"}
                      </p>
                    </td>
                    <td className="p-4">
                      <p>{refund.customer || "-"}</p>
                      <p className="text-xs text-muted-foreground">{refund.email}</p>
                    </td>
                    <td className="p-4 font-medium">₹{refund.amount}</td>
                    <td className="p-4 max-w-[220px]">
                      <p className="line-clamp-2">{refund.reason}</p>
                    </td>
                    <td className="p-4">
                      <Badge variant={refund.status === "approved" ? "default" : "outline"}>
                        {refund.status}
                      </Badge>
                    </td>
                    <td className="p-4">
                      {refund.coinsAdded ? (
                        <Badge variant="outline">Added</Badge>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="p-4 text-right">
                      {refund.status === "pending" ? (
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            disabled={busy === refund.id}
                            onClick={() => review(refund.id, "approve")}
                          >
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={busy === refund.id}
                            onClick={() => review(refund.id, "reject")}
                          >
                            Reject
                          </Button>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">Reviewed</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </>
  );
}
