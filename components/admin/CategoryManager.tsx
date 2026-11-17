"use client";

import { useState } from "react";
import { ArrowDown, ArrowUp, Layers, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { adminHeaders } from "@/components/admin/AdminDashboardClient";
import type { AdminCategory } from "@/lib/categories";

function toLocalInput(value: number | null | undefined) {
  if (typeof value !== "number") return "";
  const date = new Date(value);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
}

function fromLocalInput(value: string): number | null {
  return value ? new Date(value).getTime() : null;
}

export default function CategoryManager({ categories, onChanged }: {
  categories: AdminCategory[];
  onChanged: () => void;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [expiryDrafts, setExpiryDrafts] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);


  async function createCategory() {
    if (!name.trim()) return;
    setBusy(true);
    try {
      const response = await fetch("/api/admin/categories", {
        method: "POST",
        headers: adminHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({ name, description, imageUrl, expiresAt: fromLocalInput(expiresAt) }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || "Category creation failed");
      toast.success(`Created ${data.category.name}`);
      setName("");
      setDescription("");
      setImageUrl("");
      setExpiresAt("");
      onChanged();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Category creation failed");
    } finally {
      setBusy(false);
    }
  }

  async function reorder(firstId: string, secondId: string) {
    try {
      const response = await fetch("/api/admin/categories/reorder", {
        method: "POST",
        headers: adminHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({ firstId, secondId }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || "Category reorder failed");
      onChanged();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Category reorder failed");
    }
  }

  async function updateExpiry(category: AdminCategory, value: string) {
    try {
      const response = await fetch(`/api/admin/categories/${category.id}`, {
        method: "PATCH",
        headers: adminHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({ expiresAt: fromLocalInput(value) }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || "Expiry update failed");
      toast.success(value ? "Category expiry saved" : "Category expiry cleared");
      setExpiryDrafts((drafts) => {
        const next = { ...drafts };
        delete next[category.id];
        return next;
      });
      onChanged();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Expiry update failed");
    }
  }

  async function deleteCategory(category: AdminCategory) {
    if (!window.confirm(`Delete “${category.name}”? This cannot be undone.`)) return;
    try {
      const response = await fetch(`/api/admin/categories/${category.id}`, {
        method: "DELETE",
        headers: adminHeaders(),
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || "Category deletion failed");
      toast.success("Category deleted");
      onChanged();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Category deletion failed");
    }
  }

  return (
    <Card className="overflow-hidden border-gold/30 bg-white shadow-sm">
      <CardContent className="space-y-4 p-4 sm:p-5">
        <div className="flex items-center gap-3 border-b border-gold/20 pb-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-sm bg-burgundy text-gold"><Layers className="h-4 w-4" /></span>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gold-soft">Catalog management</p>
            <h3 className="font-heading text-lg text-burgundy">Categories</h3>
            <p className="text-xs text-muted-foreground">Create categories here, then assign them to collections from the Collections panel. Use the arrows to set their storefront order.</p>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          <label className="text-xs font-medium text-burgundy">Category name *
            <Input className="mt-1 h-9 bg-white" maxLength={80} value={name} onChange={(event) => setName(event.target.value)} />
          </label>
          <label className="text-xs font-medium text-burgundy">Category image URL (optional)
            <Input className="mt-1 h-9 bg-white" value={imageUrl} onChange={(event) => setImageUrl(event.target.value)} placeholder="Cloudinary image URL" />
          </label>
          <label className="text-xs font-medium text-burgundy md:col-span-2 xl:col-span-2">Description (optional)
            <Input className="mt-1 h-9 bg-white" maxLength={500} value={description} onChange={(event) => setDescription(event.target.value)} />
          </label>
          <label className="text-xs font-medium text-burgundy">Expires at (optional)
            <Input className="mt-1 h-9 bg-white" type="datetime-local" value={expiresAt} onChange={(event) => setExpiresAt(event.target.value)} />
          </label>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button className="bg-burgundy text-gold hover:bg-burgundy-rich" disabled={busy || !name.trim()} onClick={createCategory}>
            {busy ? "Creating…" : "Create category"}
          </Button>
        </div>

        {categories.length ? (
          <div className="space-y-2">
            {categories.map((category) => {
              const index = categories.findIndex((item) => item.id === category.id);
              return (
                <div key={category.id} className="grid gap-3 rounded-sm border border-gold/20 bg-cream/30 p-3 md:grid-cols-[minmax(180px,1fr)_220px_auto] md:items-center">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-burgundy">{category.collectionName ? `${category.collectionName} / ` : ""}{category.name}</p>
                    <p className="text-xs text-muted-foreground">{category.productCount} assigned products · order {category.sortOrder}{category.expired ? " · expired" : ""}</p>
                    {category.description && <p className="truncate text-xs text-muted-foreground">{category.description}</p>}
                  </div>
                  <div className="flex items-center gap-2">
                    <Input aria-label={`Expiry for ${category.name}`} type="datetime-local" value={expiryDrafts[category.id] ?? toLocalInput(category.expiresAt)} onChange={(event) => setExpiryDrafts((drafts) => ({ ...drafts, [category.id]: event.target.value }))} />
                    <Button type="button" size="sm" variant="outline" disabled={expiryDrafts[category.id] === undefined || expiryDrafts[category.id] === toLocalInput(category.expiresAt)} onClick={() => void updateExpiry(category, expiryDrafts[category.id] ?? "")}>Save</Button>
                  </div>
                  <div className="flex flex-wrap items-center gap-1">
                    <Button type="button" size="sm" variant="outline" title="Move up" aria-label={`Move ${category.name} up`} disabled={index <= 0} onClick={() => void reorder(categories[index - 1].id, category.id)}><ArrowUp className="h-4 w-4" /></Button>
                    <Button type="button" size="sm" variant="outline" title="Move down" aria-label={`Move ${category.name} down`} disabled={index < 0 || index >= categories.length - 1} onClick={() => void reorder(category.id, categories[index + 1].id)}><ArrowDown className="h-4 w-4" /></Button>
                    <Button type="button" size="sm" variant="outline" className="text-red-700" disabled={category.productCount > 0} title={category.productCount > 0 ? "Reassign products before deleting" : "Delete category"} onClick={() => void deleteCategory(category)}><Trash2 className="mr-1 h-3.5 w-3.5" />Delete</Button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="rounded-sm border border-dashed border-gold/30 p-3 text-sm text-muted-foreground">Create categories here, then assign them to a collection from the Collections panel.</p>
        )}
      </CardContent>
    </Card>
  );
}
