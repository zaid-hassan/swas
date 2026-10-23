"use client";

import { useState } from "react";
import Image from "next/image";
import { toast } from "sonner";
import { ImagePlus, Layers, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { adminHeaders } from "@/components/admin/AdminDashboardClient";
import type { AdminCollection } from "@/lib/collections";
import { assertConfigured, isImageUrl, isMediaAllowed, uploadToCloudinary } from "@/lib/media-upload";

type Props = { collections: AdminCollection[]; onCreated: () => void };

export default function CollectionManager({ collections, onCreated }: Props) {
  const [name, setName] = useState("");
  const [bannerUrl, setBannerUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  async function chooseBanner(file?: File) {
    if (!file) return;
    if (!file.type.startsWith("image/") || !isMediaAllowed({ name: file.name, size: file.size })) {
      toast.error("Choose a supported image under the upload size limit");
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
      if (!isImageUrl(url)) throw new Error("Uploaded file is not a supported banner image");
      setBannerUrl(url);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Banner upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function create() {
    if (!name.trim() || !bannerUrl || uploading) {
      toast.error("Enter a collection name and upload its banner");
      return;
    }
    setSaving(true);
    try {
      const response = await fetch("/api/admin/collections", {
        method: "POST",
        headers: adminHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({ name, bannerUrl }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || "Collection creation failed");
      toast.success(`Created ${data.collection.name}`);
      setName("");
      setBannerUrl("");
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
            <p className="text-xs text-muted-foreground">Product totals are calculated from assigned products.</p>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-[1fr_1.2fr_auto] md:items-end">
          <label className="text-xs font-medium text-burgundy">
            Collection name *
            <Input className="mt-1 h-9 bg-white" maxLength={100} value={name} onChange={(event) => setName(event.target.value)} placeholder="e.g. Taruni" />
          </label>
          <label className="text-xs font-medium text-burgundy">
            Banner image *
            <Input className="mt-1 h-9 bg-white" type="file" accept="image/jpeg,image/png,image/webp" disabled={uploading || saving} onChange={(event) => { void chooseBanner(event.target.files?.[0]); event.target.value = ""; }} />
          </label>
          <Button className="bg-burgundy text-gold hover:bg-burgundy-rich" disabled={saving || uploading || !name.trim() || !bannerUrl} onClick={create}>
            <Upload className="mr-2 h-4 w-4" />{saving ? "Creating…" : uploading ? "Uploading…" : "Create collection"}
          </Button>
        </div>
        {bannerUrl ? (
          <div className="flex items-center gap-3 rounded-sm border border-gold/20 bg-cream/40 p-2">
            <Image src={bannerUrl} alt="Collection banner preview" width={112} height={64} className="h-16 w-28 rounded-sm object-cover" />
            <span className="truncate text-xs text-green-700">Banner uploaded ✓</span>
            <Button type="button" variant="ghost" size="sm" className="ml-auto" onClick={() => setBannerUrl("")}>Remove</Button>
          </div>
        ) : (
          <p className="flex items-center gap-2 text-xs text-muted-foreground"><ImagePlus className="h-4 w-4" />Upload a JPG, PNG, or WebP banner.</p>
        )}

        {collections.length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {collections.map((collection) => (
              <div key={collection.id} className="flex min-w-0 gap-3 rounded-sm border border-gold/20 bg-cream/30 p-3">
                <Image src={collection.bannerUrl} alt={`${collection.name} banner`} width={80} height={64} className="h-16 w-20 shrink-0 rounded-sm object-cover" />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-burgundy">{collection.name}</p>
                  <p className="text-xs text-muted-foreground">{collection.productCount} {collection.productCount === 1 ? "product" : "products"}</p>
                  <p className="truncate font-mono text-[10px] text-gold-soft" title={collection.id}>ID: {collection.id}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="rounded-sm border border-dashed border-gold/30 p-3 text-sm text-muted-foreground">No collections yet. Create one to make it available in the product form.</p>
        )}
      </CardContent>
    </Card>
  );
}
