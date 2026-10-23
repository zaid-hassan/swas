"use client";

import { useState } from "react";
import { toast } from "sonner";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Upload } from "lucide-react";

import {
  assertConfigured,
  isMediaAllowed,
  uploadToCloudinary,
} from "@/lib/media-upload";
import { adminHeaders } from "@/components/admin/AdminDashboardClient";
import type { AdminCollection } from "@/lib/collections";

type Slot = {
  file: File | null;
  url: string;
  progress: number;
  error: string;
};

const emptySlot = (): Slot => ({ file: null, url: "", progress: 0, error: "" });

const FIELD_LABELS: Array<[string, string]> = [
  ["category", "Category"],
  ["description", "Description"],
  ["material", "Material"],
  ["design", "Design"],
  ["finish", "Finish"],
  ["idealFor", "Ideal for"],
];

export default function SingleProductForm({ onCreated, collections }: { onCreated: () => void; collections: AdminCollection[] }) {
  const [name, setName] = useState("");
  const [fields, setFields] = useState<Record<string, string>>({});
  const [mrp, setMrp] = useState("");
  const [collectionId, setCollectionId] = useState("");
  const [images, setImages] = useState<Slot[]>([emptySlot(), emptySlot(), emptySlot()]);
  const [videos, setVideos] = useState<Slot[]>([emptySlot(), emptySlot(), emptySlot()]);
  const [submitting, setSubmitting] = useState(false);

  const configError = assertConfigured();
  const uploading = [...images, ...videos].some((s) => s.file && !s.url && !s.error);
  const hasFailedSlot = [...images, ...videos].some((s) => !!s.error);

  function setSlot(
    setList: React.Dispatch<React.SetStateAction<Slot[]>>,
    index: number,
    patch: Partial<Slot>
  ) {
    setList((prev) => prev.map((s, i) => (i === index ? { ...s, ...patch } : s)));
  }

  async function pickFile(
    kind: "image" | "video",
    index: number,
    file: File | undefined
  ) {
    if (!file) return;
    const setList = kind === "image" ? setImages : setVideos;
    if (!isMediaAllowed({ name: file.name, size: file.size })) {
      setSlot(setList, index, {
        file,
        url: "",
        progress: 0,
        error: "Unsupported type or file too large",
      });
      return;
    }
    setSlot(setList, index, { file, url: "", progress: 0, error: "" });
    try {
      const url = await uploadToCloudinary(file, (progress) =>
        setSlot(setList, index, { progress })
      );
      setSlot(setList, index, { url, progress: 100 });
    } catch (err: any) {
      setSlot(setList, index, {
        error: err?.message || "Upload failed",
      });
    }
  }

  async function submit() {
    if (configError) {
      toast.error(configError);
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/products", {
        method: "POST",
        headers: adminHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({
          name,
          category: fields.category ?? "",
          description: fields.description ?? "",
          material: fields.material ?? "",
          design: fields.design ?? "",
          finish: fields.finish ?? "",
          idealFor: fields.idealFor ?? "",
          mrp: Number(mrp),
          images: images.map((s) => s.url).filter(Boolean),
          videos: videos.map((s) => s.url).filter(Boolean),
          collectionId: collectionId || undefined,
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Create failed");
      toast.success(`Created ${data.product?.name ?? "product"} (#${data.product?.id ?? ""})`);
      setName("");
      setFields({});
      setMrp("");
      setCollectionId("");
      setImages([emptySlot(), emptySlot(), emptySlot()]);
      setVideos([emptySlot(), emptySlot(), emptySlot()]);
      onCreated();
    } catch (err: any) {
      toast.error(err?.message || "Create failed");
    } finally {
      setSubmitting(false);
    }
  }

  function renderSlots(
    kind: "image" | "video",
    list: Slot[],
    setList: React.Dispatch<React.SetStateAction<Slot[]>>
  ) {
    return (
      <div className="grid gap-3 md:grid-cols-3">
        {list.map((slot, i) => (
          <label key={i} className="space-y-2 rounded-sm border border-gold/20 bg-white p-3 text-xs">
            <span className="font-medium">
              {kind === "image" ? `Image ${i + 1}` : `Video ${i + 1}`}
            </span>
            <Input
              type="file"
              accept={kind === "image" ? "image/jpeg,image/png,image/webp" : "video/mp4,video/webm"}
              onChange={(e) => {
                pickFile(kind, i, e.target.files?.[0]);
                e.target.value = "";
              }}
            />
            {slot.file && !slot.url && !slot.error && (
              <p className="text-xs text-muted-foreground">Uploading… {slot.progress}%</p>
            )}
            {slot.url && (
              <p className="truncate text-xs text-green-700">Uploaded ✓</p>
            )}
            {slot.error && <p className="text-xs text-red-600">{slot.error}</p>}
            {slot.url && (
              <Button
                size="sm"
                variant="outline"
                onClick={(e) => {
                  e.preventDefault();
                  setSlot(setList, i, emptySlot());
                }}
              >
                Remove
              </Button>
            )}
          </label>
        ))}
      </div>
    );
  }

  return (
    <Card className="overflow-hidden border-gold/30 shadow-sm">
      <CardContent className="space-y-3 p-4 sm:p-5">
        <div className="flex items-center gap-3 border-b border-gold/20 pb-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-sm bg-burgundy text-gold"><Upload className="h-4 w-4" /></span>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gold-soft">Catalog management</p>
            <h3 className="font-heading text-lg text-burgundy">Add a product</h3>
          </div>
        </div>
        {configError && <p className="text-sm text-red-600">{configError}</p>}
        <div className="grid gap-3 md:grid-cols-3">
          <label key="name" className="text-xs font-medium text-burgundy">
            Product name *
            <Input className="mt-1 h-9 bg-white" value={name} onChange={(e) => setName(e.target.value)} />
          </label>
          <label key="mrp" className="text-xs font-medium text-burgundy">
            MRP (₹) *
            <Input
              className="mt-1 h-9 bg-white"
              value={mrp}
              onChange={(e) => setMrp(e.target.value)}
              inputMode="numeric"
            />
          </label>
          {FIELD_LABELS.map(([key, label]) => (
            <label key={key} className="text-xs font-medium text-burgundy">
              {label}
              <Input
                className="mt-1 h-9 bg-white"
                value={fields[key] ?? ""}
                onChange={(e) => setFields((f) => ({ ...f, [key]: e.target.value }))}
              />
            </label>
          ))}
          <label className="text-xs font-medium text-burgundy">
            Collection
            <select className="mt-1 h-9 w-full rounded-md border border-input bg-white px-3 text-sm" value={collectionId} onChange={(event) => setCollectionId(event.target.value)}>
              <option value="">No collection</option>
              {collections.map((collection) => (
                <option key={collection.id} value={collection.id}>{collection.name} · {collection.productCount} products</option>
              ))}
            </select>
          </label>
        </div>
        {renderSlots("image", images, setImages)}
        {renderSlots("video", videos, setVideos)}
        <Button
          className="bg-burgundy text-gold hover:bg-burgundy-rich"
          disabled={submitting || uploading || hasFailedSlot || !!configError}
          onClick={submit}
        >
          {submitting ? "Creating…" : "Create product"}
        </Button>
      </CardContent>
    </Card>
  );
}
