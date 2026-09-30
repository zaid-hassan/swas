"use client";

import { useState } from "react";
import { toast } from "sonner";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Upload } from "lucide-react";

import {
  assertConfigured,
  cloudinaryUploadUrl,
  isMediaAllowed,
} from "@/lib/media-upload";
import { adminHeaders } from "@/components/admin/AdminDashboardClient";

type Slot = {
  file: File | null;
  url: string;
  progress: number;
  error: string;
};

const emptySlot = (): Slot => ({ file: null, url: "", progress: 0, error: "" });

function uploadToCloudinary(file: File, onProgress: (pct: number) => void): Promise<string> {
  const cloud = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME!;
  const preset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!;
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", cloudinaryUploadUrl(cloud));
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () => {
      try {
        const data = JSON.parse(xhr.responseText);
        if (xhr.status >= 200 && xhr.status < 300 && data.secure_url) {
          resolve(data.secure_url as string);
        } else {
          reject(new Error(data?.error?.message || "Upload failed"));
        }
      } catch {
        reject(new Error("Upload failed"));
      }
    };
    xhr.onerror = () => reject(new Error("Upload failed"));
    const fd = new FormData();
    fd.append("file", file);
    fd.append("upload_preset", preset);
    xhr.send(fd);
  });
}

const FIELD_LABELS: Array<[string, string]> = [
  ["category", "Category"],
  ["description", "Description"],
  ["material", "Material"],
  ["design", "Design"],
  ["finish", "Finish"],
  ["idealFor", "Ideal for"],
];

export default function SingleProductForm({ onCreated }: { onCreated: () => void }) {
  const [name, setName] = useState("");
  const [fields, setFields] = useState<Record<string, string>>({});
  const [mrp, setMrp] = useState("");
  const [images, setImages] = useState<Slot[]>([emptySlot(), emptySlot(), emptySlot()]);
  const [videos, setVideos] = useState<Slot[]>([emptySlot(), emptySlot(), emptySlot()]);
  const [submitting, setSubmitting] = useState(false);

  const configError = assertConfigured();
  const uploading = [...images, ...videos].some((s) => s.file && !s.url && !s.error);

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
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Create failed");
      toast.success(`Created ${data.product?.name ?? "product"} (#${data.product?.id ?? ""})`);
      setName("");
      setFields({});
      setMrp("");
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
          <label key={i} className="space-y-2 rounded border p-3 text-sm">
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
    <Card>
      <CardContent className="space-y-4 p-6">
        <div className="flex items-center gap-2">
          <Upload className="h-4 w-4" />
          <h3 className="font-semibold">Add single product</h3>
        </div>
        {configError && <p className="text-sm text-red-600">{configError}</p>}
        <div className="grid gap-3 md:grid-cols-2">
          <label className="text-sm">
            Product name *
            <Input className="mt-1" value={name} onChange={(e) => setName(e.target.value)} />
          </label>
          <label className="text-sm">
            MRP (₹) *
            <Input
              className="mt-1"
              value={mrp}
              onChange={(e) => setMrp(e.target.value)}
              inputMode="numeric"
            />
          </label>
          {FIELD_LABELS.map(([key, label]) => (
            <label key={key} className="text-sm">
              {label}
              <Input
                className="mt-1"
                value={fields[key] ?? ""}
                onChange={(e) => setFields((f) => ({ ...f, [key]: e.target.value }))}
              />
            </label>
          ))}
        </div>
        {renderSlots("image", images, setImages)}
        {renderSlots("video", videos, setVideos)}
        <Button disabled={submitting || uploading} onClick={submit}>
          {submitting ? "Creating…" : "Create product"}
        </Button>
      </CardContent>
    </Card>
  );
}
