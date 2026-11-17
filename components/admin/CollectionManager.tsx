"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Layers, Pencil, Power, Trash2, Upload, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { adminHeaders } from "@/components/admin/AdminDashboardClient";
import type { AdminCategory } from "@/lib/categories";
import type { AdminCollection } from "@/lib/collections";
import { assertConfigured, isMediaAllowed, isVideoUrl, uploadToCloudinary } from "@/lib/media-upload";
import { slugify } from "@/lib/product-rows";

type Props = { collections: AdminCollection[]; categories: AdminCategory[]; onCreated: () => void };

export default function CollectionManager({ collections, categories, onCreated }: Props) {
  const [name, setName] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [bannerUrl, setBannerUrl] = useState("");
  const [categoryIds, setCategoryIds] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  async function chooseBanner(file?: File) {
    if (!file) return;
    if (!file.type.startsWith("video/") || !isMediaAllowed({ name: file.name, size: file.size })) {
      toast.error("Choose an MP4 or WebM video under the upload size limit");
      return;
    }
    const configError = assertConfigured();
    if (configError) {
      toast.error(configError);
      return;
    }
    setUploading(true);
    setBannerUrl("");
    try {
      const url = await uploadToCloudinary(file, () => {});
      if (!isVideoUrl(url)) throw new Error("Uploaded file is not a supported banner video");
      setBannerUrl(url);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Banner upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function create() {
    if (!name.trim() || !bannerUrl || uploading) {
      toast.error("Enter a name and upload a banner video or paste its Cloudinary URL");
      return;
    }
    setSaving(true);
    try {
      const response = await fetch("/api/admin/collections", {
        method: "POST",
        headers: adminHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({
          name,
          bannerUrl,
          categoryIds,
          expiresAt: fromLocalInput(expiresAt),
        }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || "Collection creation failed");
      toast.success(`Created ${data.collection.name}`);
      setName("");
      setExpiresAt("");
      setBannerUrl("");
      setCategoryIds([]);
      onCreated();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Collection creation failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card className="overflow-hidden border-gold/30 bg-white shadow-sm">
      <CardContent className="space-y-4 p-4 sm:p-5">
        <div className="flex items-center gap-3 border-b border-gold/20 pb-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-sm bg-burgundy text-gold"><Layers className="h-4 w-4" /></span>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gold-soft">Catalog management</p>
            <h3 className="font-heading text-lg text-burgundy">Collections</h3>
            <p className="text-xs text-muted-foreground">Creating a collection makes it the homepage banner; previous collection routes remain available.</p>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          <label className="text-xs font-medium text-burgundy">
            Collection name *
            <Input className="mt-1 h-9 bg-white" maxLength={100} value={name} onChange={(event) => setName(event.target.value)} placeholder="e.g. Taruni" />
          </label>
          <label className="text-xs font-medium text-burgundy">
            Upload banner video
            <Input className="mt-1 h-9 bg-white" type="file" accept="video/mp4,video/webm" disabled={uploading || saving} onChange={(event) => { void chooseBanner(event.target.files?.[0]); event.target.value = ""; }} />
          </label>
          <label className="text-xs font-medium text-burgundy">
            Or paste Cloudinary video URL
            <Input className="mt-1 h-9 bg-white" type="url" value={bannerUrl} onChange={(event) => setBannerUrl(event.target.value.trim())} placeholder="https://res.cloudinary.com/.../video.mp4" disabled={uploading || saving} />
          </label>
          <label className="text-xs font-medium text-burgundy">Expires at (optional)
            <Input className="mt-1 h-9 bg-white" type="datetime-local" value={expiresAt} onChange={(event) => setExpiresAt(event.target.value)} />
          </label>
        </div>
        <CategoryPicker categories={categories} selectedIds={categoryIds} onChange={setCategoryIds} />
        <p className="text-xs text-muted-foreground">Generated slug: <span className="font-mono text-burgundy">{slugify(name) || "collection"}</span>. The collection ID and product/category totals are generated automatically.</p>
        <Button className="bg-burgundy text-gold hover:bg-burgundy-rich" disabled={saving || uploading || !name.trim() || !bannerUrl} onClick={create}>
          <Upload className="mr-2 h-4 w-4" />{saving ? "Creating…" : uploading ? "Uploading…" : "Create collection"}
        </Button>
        {bannerUrl ? (
          <div className="flex items-center gap-3 rounded-sm border border-gold/20 bg-cream/40 p-2">
            <video src={bannerUrl} aria-label="Collection banner video preview" muted loop playsInline className="h-16 w-28 rounded-sm object-cover" />
            <span className="truncate text-xs text-green-700">Banner video ready ✓</span>
            <Button type="button" variant="ghost" size="sm" className="ml-auto" onClick={() => setBannerUrl("")}>Remove</Button>
          </div>
        ) : (
          <p className="flex items-center gap-2 text-xs text-muted-foreground"><Video className="h-4 w-4" />Upload an MP4/WebM video or paste its Cloudinary URL.</p>
        )}

        {collections.length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {collections.map((collection) => <CollectionCard key={collection.id} collection={collection} categories={categories} onChanged={onCreated} />)}
          </div>
        ) : (
          <p className="rounded-sm border border-dashed border-gold/30 p-3 text-sm text-muted-foreground">No collections yet. Create one to make it available in the product form.</p>
        )}
      </CardContent>
    </Card>
  );
}

function toLocalInput(value: number | null | undefined) {
  if (typeof value !== "number") return "";
  const date = new Date(value);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
}

function fromLocalInput(value: string): number | null {
  return value ? new Date(value).getTime() : null;
}

function CollectionCard({ collection, categories, onChanged }: { collection: AdminCollection; categories: AdminCategory[]; onChanged: () => void }) {
  const [bannerUrl, setBannerUrl] = useState(collection.bannerUrl);
  const [name, setName] = useState(collection.name);
  const [expiresAt, setExpiresAt] = useState(toLocalInput(collection.expiresAt));
  const [categoryIds, setCategoryIds] = useState(collection.categoryIds);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [changingActive, setChangingActive] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const expired = collection.expired;

  function openEditor() {
    setName(collection.name);
    setBannerUrl(collection.bannerUrl);
    setExpiresAt(toLocalInput(collection.expiresAt));
    setCategoryIds(collection.categoryIds);
    setEditOpen(true);
  }

  async function chooseBanner(file?: File) {
    if (!file) return;
    if (!file.type.startsWith("video/") || !isMediaAllowed({ name: file.name, size: file.size })) {
      toast.error("Choose an MP4 or WebM video under the upload size limit");
      return;
    }
    const configError = assertConfigured();
    if (configError) {
      toast.error(configError);
      return;
    }
    setUploading(true);
    setBannerUrl("");
    try {
      const url = await uploadToCloudinary(file, () => {});
      if (!isVideoUrl(url)) throw new Error("Uploaded file is not a supported banner video");
      setBannerUrl(url);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Banner upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function save() {
    if (!name.trim() || !isVideoUrl(bannerUrl)) {
      toast.error("Enter a collection name and provide a banner video");
      return;
    }
    setSaving(true);
    try {
      const response = await fetch(`/api/admin/collections/${collection.id}`, {
        method: "PATCH",
        headers: adminHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({
          name,
          bannerUrl,
          categoryIds,
          expiresAt: fromLocalInput(expiresAt),
        }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || "Collection update failed");
      toast.success("Collection updated");
      setEditOpen(false);
      onChanged();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Collection update failed");
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive() {
    setChangingActive(true);
    try {
      const response = await fetch(`/api/admin/collections/${collection.id}`, {
        method: "PATCH",
        headers: adminHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({ isActive: !collection.isActive }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || "Collection status update failed");
      toast.success(collection.isActive ? "Collection deactivated; no homepage banner is active" : "Collection activated as the homepage banner");
      onChanged();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Collection status update failed");
    } finally {
      setChangingActive(false);
    }
  }

  async function remove() {
    setDeleting(true);
    try {
      const response = await fetch(`/api/admin/collections/${collection.id}`, { method: "DELETE", headers: adminHeaders() });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || "Collection deletion failed");
      toast.success("Collection deleted");
      setDeleteOpen(false);
      onChanged();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Collection deletion failed");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      <div className="min-w-0 rounded-sm border border-gold/20 bg-cream/30 p-3">
        <div className="flex items-start gap-3">
          {collection.bannerUrl ? <video src={collection.bannerUrl} aria-label={`${collection.name} banner video`} muted loop playsInline className="h-16 w-20 shrink-0 rounded-sm object-cover" /> : <span className="flex h-16 w-20 shrink-0 items-center justify-center rounded-sm bg-burgundy/10 text-[10px] text-muted-foreground">Video needed</span>}
          <div className="min-w-0 flex-1">
            <p className="truncate font-medium text-burgundy">{collection.name}{collection.isActive ? " · active homepage banner" : ""}{expired ? " · expired" : ""}</p>
            <p className="truncate font-mono text-[10px] text-muted-foreground">/{collection.slug}</p>
            <p className="text-xs text-muted-foreground">{collection.categoryCount} categories · {collection.productCount} assigned products</p>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
          <p className="truncate font-mono text-[10px] text-gold-soft" title={collection.id}>ID: {collection.id}</p>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" onClick={openEditor}><Pencil className="mr-1 h-3.5 w-3.5" />Edit</Button>
            <Button size="sm" variant="outline" disabled={changingActive || (expired && !collection.isActive)} title={expired && !collection.isActive ? "Edit the expiry date before activating" : undefined} onClick={() => void toggleActive()}>
              <Power className="mr-1 h-3.5 w-3.5" />{changingActive ? "Updating…" : collection.isActive ? "Deactivate" : "Activate"}
            </Button>
            <Button size="sm" variant="outline" className="text-red-700" disabled={deleting || collection.categoryCount > 0 || collection.productCount > 0} title={collection.categoryCount || collection.productCount ? "Reassign/delete children first" : "Delete collection"} onClick={() => setDeleteOpen(true)}><Trash2 className="mr-1 h-3.5 w-3.5" />Delete</Button>
          </div>
        </div>
      </div>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto border-gold/30 bg-white sm:max-w-xl">
          <DialogHeader>
            <DialogTitle className="font-heading text-burgundy">Edit collection</DialogTitle>
            <DialogDescription>Update the collection details and banner video. Its existing URL stays the same.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-xs font-medium text-burgundy">Collection name *
              <Input className="mt-1 bg-white" maxLength={100} value={name} onChange={(event) => setName(event.target.value)} />
            </label>
            <label className="text-xs font-medium text-burgundy">Upload banner video
              <Input className="mt-1 bg-white" type="file" accept="video/mp4,video/webm" disabled={saving || uploading} onChange={(event) => { void chooseBanner(event.target.files?.[0]); event.target.value = ""; }} />
            </label>
            <label className="text-xs font-medium text-burgundy">Or paste Cloudinary video URL
              <Input className="mt-1 bg-white" type="url" value={bannerUrl} onChange={(event) => setBannerUrl(event.target.value.trim())} placeholder="https://res.cloudinary.com/.../video.mp4" disabled={saving || uploading} />
            </label>
            <label className="text-xs font-medium text-burgundy">Expires at (optional)
              <Input className="mt-1 bg-white" type="datetime-local" value={expiresAt} onChange={(event) => setExpiresAt(event.target.value)} />
            </label>
          </div>
          <CategoryPicker categories={categories} selectedIds={categoryIds} onChange={setCategoryIds} />
          {bannerUrl && <video src={bannerUrl} aria-label="Edited collection banner preview" muted loop playsInline className="h-28 w-48 rounded-sm object-cover" />}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setEditOpen(false)} disabled={saving}>Cancel</Button>
            <Button type="button" className="bg-burgundy text-gold hover:bg-burgundy-rich" disabled={saving || uploading || !name.trim() || !isVideoUrl(bannerUrl)} onClick={() => void save()}>{saving ? "Saving…" : uploading ? "Uploading…" : "Save changes"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="border-gold/30 bg-white sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading text-burgundy">Delete collection?</DialogTitle>
            <DialogDescription>Delete “{collection.name}”? This cannot be undone. Collections with categories or products must be emptied first.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDeleteOpen(false)} disabled={deleting}>Cancel</Button>
            <Button type="button" className="bg-red-700 text-white hover:bg-red-800" onClick={() => void remove()} disabled={deleting}>{deleting ? "Deleting…" : "Delete collection"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function CategoryPicker({ categories, selectedIds, onChange }: {
  categories: AdminCategory[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
}) {
  const options = categories.filter((category) => !category.expired || selectedIds.includes(category.id));
  return (
    <fieldset className="space-y-2 rounded-sm border border-gold/20 p-3">
      <legend className="px-1 text-xs font-medium text-burgundy">Categories in this collection</legend>
      {options.length ? (
        <div className="flex flex-wrap gap-x-4 gap-y-2">
          {options.map((category) => (
            <label key={category.id} className="flex items-center gap-2 text-xs text-burgundy">
              <input
                type="checkbox"
                checked={selectedIds.includes(category.id)}
                disabled={category.expired && !selectedIds.includes(category.id)}
                onChange={(event) => onChange(event.target.checked
                  ? [...selectedIds, category.id]
                  : selectedIds.filter((id) => id !== category.id))}
              />
              {category.name}{category.expired ? " (expired)" : ""}
            </label>
          ))}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">Create categories in the Categories panel first.</p>
      )}
      <p className="text-[11px] text-muted-foreground">A category can be used by more than one collection. Categories with assigned products cannot be removed from this collection until those products are reassigned.</p>
    </fieldset>
  );
}