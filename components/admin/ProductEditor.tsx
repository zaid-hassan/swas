"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { adminHeaders } from "@/components/admin/AdminDashboardClient";
import { assertConfigured, isMediaAllowed, uploadToCloudinary } from "@/lib/media-upload";
import { buildProductEditPatch } from "@/lib/product-edit";
import type { AdminProduct } from "@/types/products";

type Props = { product: AdminProduct; onSaved: () => void; onCancel: () => void };
const textFields = [
  ["category", "Category"],
  ["description", "Description"],
  ["material", "Material"],
  ["design", "Design"],
  ["finish", "Finish"],
  ["idealFor", "Ideal for"],
] as const;

export default function ProductEditor({ product, onSaved, onCancel }: Props) {
  const [name, setName] = useState(product.name);
  const [price, setPrice] = useState(String(product.price));
  const [fields, setFields] = useState<Record<string, string>>({
    category: product.category,
    description: product.description,
    material: product.material,
    design: product.design,
    finish: product.finish,
    idealFor: product.idealFor,
  });
  const [images, setImages] = useState(() => product.images.slice(0, 4));
  const [videos, setVideos] = useState(() => product.videos.slice(0, 3));
  const [visible, setVisible] = useState(product.isVisible);
  const [uploading, setUploading] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function upload(kind: "image" | "video", index: number, file?: File) {
    if (!file) return;
    if (!isMediaAllowed({ name: file.name, size: file.size })) {
      toast.error("Unsupported file type or file too large");
      return;
    }
    const configError = assertConfigured();
    if (configError) {
      toast.error(configError);
      return;
    }
    const key = `${kind}-${index}`;
    setUploading(key);
    try {
      const url = await uploadToCloudinary(file, () => {});
      if (kind === "image") setImages((current) => current.map((value, i) => i === index ? url : value));
      else setVideos((current) => current.map((value, i) => i === index ? url : value));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Upload failed");
    } finally {
      setUploading(null);
    }
  }

  async function save() {
    const numericPrice = Number(price);
    if (!name.trim() || !Number.isFinite(numericPrice) || numericPrice < 0) {
      toast.error("Enter a product name and a valid non-negative price");
      return;
    }
    setSaving(true);
    try {
      const body = buildProductEditPatch({
        name: name.trim(),
        price: numericPrice,
        image: images[0] ?? "",
        images,
        videos,
        category: fields.category ?? "",
        description: fields.description ?? "",
        material: fields.material ?? "",
        design: fields.design ?? "",
        finish: fields.finish ?? "",
        idealFor: fields.idealFor ?? "",
        isVisible: visible,
      });
      const response = await fetch(`/api/admin/products/p-${product.id}`, {
        method: "PATCH",
        headers: adminHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify(body),
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || "Update failed");
      toast.success("Product updated");
      onSaved();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Update failed");
    } finally {
      setSaving(false);
    }
  }

  function mediaInputs(kind: "image" | "video", list: string[], setList: (next: string[]) => void) {
    const limit = kind === "image" ? 4 : 3;
    return <div className={`grid gap-2 ${kind === "image" ? "sm:grid-cols-2 xl:grid-cols-4" : "sm:grid-cols-2 xl:grid-cols-3"}`}>{Array.from({ length: limit }, (_, index) => (
      <div className="min-w-0 space-y-2 rounded-md border border-gold/20 bg-white p-3" key={`${kind}-${index}`}>
        <label className="block text-[11px] font-semibold uppercase tracking-[0.14em] text-burgundy">{kind === "image" ? `Image ${index + 1}` : `Video ${index + 1}`}</label>
        <Input className="h-9 text-xs" value={list[index] ?? ""} onChange={(event) => setList(Array.from({ length: limit }, (_, i) => i === index ? event.target.value : list[i] ?? ""))} placeholder="Paste media URL" />
        {list[index] && (kind === "image" ? <img src={list[index]} alt={`Product image ${index + 1}`} className="h-16 w-16 rounded-sm border border-gold/20 object-cover" /> : <video src={list[index]} controls className="h-20 w-full object-cover" />)}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Input className="h-8 max-w-full text-xs file:mr-2 file:text-xs" type="file" accept={kind === "image" ? "image/jpeg,image/png,image/webp" : "video/mp4,video/webm"} disabled={uploading !== null} onChange={(event) => { void upload(kind, index, event.target.files?.[0]); event.target.value = ""; }} />
          {uploading === `${kind}-${index}` && <span className="text-xs text-gold-soft">Uploading…</span>}
          {list[index] && <Button type="button" size="sm" variant="ghost" className="h-7 px-2 text-xs text-burgundy hover:bg-burgundy/5" onClick={() => setList(Array.from({ length: limit }, (_, i) => i === index ? "" : list[i] ?? ""))}>Remove</Button>}
        </div>
      </div>
    ))}</div>;
  }

  return (
    <div className="space-y-4 rounded-md border border-gold/30 bg-cream p-4 shadow-sm sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gold/25 pb-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-gold-soft">Product editor · #{product.id}</p>
          <h3 className="mt-1 font-heading text-xl text-burgundy">Edit product details</h3>
        </div>
        <label className="flex items-center gap-2 rounded-sm border border-gold/25 bg-white px-3 py-2 text-xs font-medium text-burgundy">
          <input type="checkbox" checked={visible} onChange={(event) => setVisible(event.target.checked)} />
          Visible in shop
        </label>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <label className="text-xs font-medium text-burgundy">Product name<Input className="mt-1 h-9 bg-white" value={name} onChange={(event) => setName(event.target.value)} /></label>
        <label className="text-xs font-medium text-burgundy">Price / MRP<Input className="mt-1 h-9 bg-white" type="number" min="0" value={price} onChange={(event) => setPrice(event.target.value)} /></label>
        {textFields.map(([key, label]) => (
          <label className={`text-xs font-medium text-burgundy ${key === "description" ? "sm:col-span-2 xl:col-span-3" : ""}`} key={key}>
            {label}
            {key === "description" ? (
              <textarea className="mt-1 min-h-20 w-full rounded-md border border-input bg-white px-3 py-2 text-sm text-foreground" value={fields[key] ?? ""} onChange={(event) => setFields((current) => ({ ...current, [key]: event.target.value }))} />
            ) : (
              <Input className="mt-1 h-9 bg-white" value={fields[key] ?? ""} onChange={(event) => setFields((current) => ({ ...current, [key]: event.target.value }))} />
            )}
          </label>
        ))}
      </div>

      <fieldset className="space-y-2 border-t border-gold/20 pt-3">
        <legend className="px-1 text-[11px] font-semibold uppercase tracking-[0.17em] text-burgundy">Product images</legend>
        {mediaInputs("image", images, setImages)}
      </fieldset>
      <fieldset className="space-y-2 border-t border-gold/20 pt-3">
        <legend className="px-1 text-[11px] font-semibold uppercase tracking-[0.17em] text-burgundy">Product videos</legend>
        {mediaInputs("video", videos, setVideos)}
      </fieldset>

      <div className="flex flex-wrap justify-end gap-2 border-t border-gold/20 pt-3">
        <Button variant="outline" className="border-burgundy/20 text-burgundy hover:bg-burgundy/5" onClick={onCancel}>Cancel</Button>
        <Button className="bg-burgundy text-gold hover:bg-burgundy-rich" disabled={saving || uploading !== null} onClick={save}>{saving ? "Saving…" : "Save all changes"}</Button>
      </div>
    </div>
  );
}
