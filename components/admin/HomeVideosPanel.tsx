"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Film, Plus, Trash2 } from "lucide-react";

import {
  assertConfigured,
  isMediaAllowed,
  uploadToCloudinary,
} from "@/lib/media-upload";
import {
  CAROUSEL_HINT,
  CAROUSEL_LABEL,
  CAROUSEL_MAX,
  DEFAULT_HOME_VIDEOS,
  SINGLE_HOME_VIDEO_SLOTS,
} from "@/lib/home-videos";
import type { HomeVideos, HomeVideoSingleKey } from "@/lib/home-videos";
import { adminHeaders } from "@/components/admin/AdminDashboardClient";

type Slot = { url: string; uploading: boolean; progress: number; error: string };

const emptySlot = (url = ""): Slot => ({
  url,
  uploading: false,
  progress: 0,
  error: "",
});

type SingleSlots = Record<HomeVideoSingleKey, Slot>;

/**
 * Edits the home-page videos: the two single slots (hero, collection film) and
 * the featured carousel, which holds one clip per card. Uploads go straight to
 * Cloudinary (same unsigned preset as the product form) and the URLs are stored
 * in `settings/home`; the home page reads that doc per request, so a save is
 * live immediately.
 */
export default function HomeVideosPanel() {
  const [singles, setSingles] = useState<SingleSlots | null>(null);
  const [carousel, setCarousel] = useState<Slot[]>([]);
  const [live, setLive] = useState<HomeVideos | null>(null);
  const [saving, setSaving] = useState(false);

  const configError = assertConfigured();

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/home-videos", { headers: adminHeaders() });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Failed to load home videos");

      const videos: HomeVideos = data.videos;
      setLive(videos);
      setSingles({
        hero: emptySlot(videos.hero),
        collectionFilm: emptySlot(videos.collectionFilm),
      });
      setCarousel(videos.carousel.map((url) => emptySlot(url)));
    } catch (err: any) {
      toast.error(err?.message || "Failed to load home videos");
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function patchSingle(key: HomeVideoSingleKey, patch: Partial<Slot>) {
    setSingles((prev) => (prev ? { ...prev, [key]: { ...prev[key], ...patch } } : prev));
  }

  function patchCarousel(index: number, patch: Partial<Slot>) {
    setCarousel((prev) =>
      prev.map((slot, i) => (i === index ? { ...slot, ...patch } : slot))
    );
  }

  async function uploadWith(
    file: File | undefined,
    apply: (patch: Partial<Slot>) => void
  ) {
    if (!file) return;

    if (!isMediaAllowed({ name: file.name, size: file.size })) {
      apply({ error: "Unsupported type or file too large (mp4/webm, up to 100 MB)" });
      return;
    }

    apply({ uploading: true, progress: 0, error: "" });
    try {
      const url = await uploadToCloudinary(file, (progress) => apply({ progress }));
      apply({ url, uploading: false, progress: 100 });
      toast.success("Uploaded — press Save videos to publish.");
    } catch (err: any) {
      apply({ uploading: false, error: err?.message || "Upload failed" });
    }
  }

  const addCarouselSlot = () =>
    setCarousel((prev) => (prev.length >= CAROUSEL_MAX ? prev : [...prev, emptySlot("")]));

  const removeCarouselSlot = (index: number) =>
    setCarousel((prev) => (prev.length <= 1 ? prev : prev.filter((_, i) => i !== index)));

  const resetCarousel = () =>
    setCarousel(DEFAULT_HOME_VIDEOS.carousel.map((url) => emptySlot(url)));

  const carouselUrls = carousel.map((slot) => slot.url);
  const carouselChanged =
    !!live && JSON.stringify(carouselUrls) !== JSON.stringify(live.carousel);

  const changedKeys: string[] = [];
  if (singles && live) {
    for (const slot of SINGLE_HOME_VIDEO_SLOTS) {
      if (singles[slot.key].url !== live[slot.key]) changedKeys.push(slot.key);
    }
  }
  if (carouselChanged) changedKeys.push("carousel");

  const emptyCarouselRow = carousel.some((slot) => !slot.url);
  const everySlot: Slot[] = singles
    ? [...SINGLE_HOME_VIDEO_SLOTS.map((slot) => singles[slot.key]), ...carousel]
    : carousel;
  const uploading = everySlot.some((slot) => slot.uploading);
  const failed = everySlot.some((slot) => !!slot.error) || emptyCarouselRow;

  async function save() {
    if (!singles || !live) return;

    const payload: Partial<HomeVideos> = {};
    for (const slot of SINGLE_HOME_VIDEO_SLOTS) {
      const url = singles[slot.key].url;
      if (url !== live[slot.key]) payload[slot.key] = url;
    }
    if (carouselChanged) payload.carousel = carouselUrls;

    if (Object.keys(payload).length === 0) return;

    setSaving(true);
    try {
      const res = await fetch("/api/admin/home-videos", {
        method: "PUT",
        headers: adminHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Save failed");

      toast.success("Home page videos updated.");
      await load();
    } catch (err: any) {
      toast.error(err?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <CardContent className="space-y-5 p-6">
        <div className="flex items-center gap-2">
          <Film className="h-4 w-4" />
          <h3 className="font-semibold">Home page videos</h3>
        </div>

        <p className="text-sm text-muted-foreground">
          These play on the home page. Uploading a new clip and saving replaces the
          live video immediately; “Reset to default” puts the shipped clips back.
        </p>

        {configError && <p className="text-sm text-red-600">{configError}</p>}

        {!singles ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : (
          <>
            {/* Single video slots */}

            <div className="grid gap-4 lg:grid-cols-2">
              {SINGLE_HOME_VIDEO_SLOTS.map((slot) => {
                const state = singles[slot.key];
                const isLive = live ? live[slot.key] === state.url : true;

                return (
                  <div key={slot.key} className="space-y-2 rounded border p-3 text-sm">
                    <p className="font-medium">{slot.label}</p>
                    <p className="text-xs text-muted-foreground">{slot.hint}</p>

                    <video
                      key={state.url}
                      src={state.url}
                      controls
                      muted
                      playsInline
                      preload="metadata"
                      className="h-32 w-full rounded border bg-black object-cover"
                    />

                    <p className="truncate text-xs text-muted-foreground" title={state.url}>
                      {state.url}
                    </p>

                    <Input
                      type="file"
                      accept="video/mp4,video/webm"
                      disabled={state.uploading || saving}
                      onChange={(e) => {
                        uploadWith(e.target.files?.[0], (patch) =>
                          patchSingle(slot.key, patch)
                        );
                        e.target.value = "";
                      }}
                    />

                    {state.uploading && (
                      <p className="text-xs text-muted-foreground">
                        Uploading… {state.progress}%
                      </p>
                    )}
                    {state.error && <p className="text-xs text-red-600">{state.error}</p>}

                    <div className="flex flex-wrap items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={
                          state.uploading ||
                          saving ||
                          state.url === DEFAULT_HOME_VIDEOS[slot.key]
                        }
                        onClick={() =>
                          patchSingle(slot.key, {
                            url: DEFAULT_HOME_VIDEOS[slot.key],
                            error: "",
                          })
                        }
                      >
                        Reset to default
                      </Button>

                      <span className="text-xs text-muted-foreground">
                        {isLive ? "Live" : "Unsaved change"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Carousel: one clip per card */}

            <div className="space-y-3 rounded border p-3">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-medium">{CAROUSEL_LABEL}</p>
                  <p className="text-xs text-muted-foreground">{CAROUSEL_HINT}</p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs text-muted-foreground">
                    {carousel.length} / {CAROUSEL_MAX} clips
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={saving || carousel.length >= CAROUSEL_MAX}
                    onClick={addCarouselSlot}
                  >
                    <Plus className="mr-1 h-3.5 w-3.5" /> Add video
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={
                      saving ||
                      JSON.stringify(carouselUrls) ===
                        JSON.stringify(DEFAULT_HOME_VIDEOS.carousel)
                    }
                    onClick={resetCarousel}
                  >
                    Reset to default
                  </Button>
                </div>
              </div>

              <div className="space-y-3">
                {carousel.map((slot, index) => (
                  <div
                    key={index}
                    className="flex flex-col gap-3 rounded border p-3 text-sm sm:flex-row sm:items-start"
                  >
                    <div className="w-full shrink-0 sm:w-40">
                      {slot.url ? (
                        <video
                          key={slot.url}
                          src={slot.url}
                          controls
                          muted
                          playsInline
                          preload="metadata"
                          className="h-24 w-full rounded border bg-black object-cover"
                        />
                      ) : (
                        <div className="flex h-24 w-full items-center justify-center rounded border border-dashed text-xs text-muted-foreground">
                          No clip yet
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 flex-1 space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-medium">Card {index + 1}</p>

                        <Button
                          variant="outline"
                          size="sm"
                          disabled={saving || carousel.length <= 1}
                          onClick={() => removeCarouselSlot(index)}
                          aria-label={`Remove card ${index + 1}`}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>

                      <p className="truncate text-xs text-muted-foreground" title={slot.url}>
                        {slot.url || "Upload a clip for this card"}
                      </p>

                      <Input
                        type="file"
                        accept="video/mp4,video/webm"
                        disabled={slot.uploading || saving}
                        onChange={(e) => {
                          uploadWith(e.target.files?.[0], (patch) =>
                            patchCarousel(index, patch)
                          );
                          e.target.value = "";
                        }}
                      />

                      {slot.uploading && (
                        <p className="text-xs text-muted-foreground">
                          Uploading… {slot.progress}%
                        </p>
                      )}
                      {slot.error && <p className="text-xs text-red-600">{slot.error}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Save */}

            <div className="flex flex-wrap items-center gap-3">
              <Button
                disabled={
                  saving || uploading || failed || !!configError || changedKeys.length === 0
                }
                onClick={save}
              >
                {saving ? "Saving…" : "Save videos"}
              </Button>

              <span className="text-xs text-muted-foreground">
                {changedKeys.length === 0
                  ? "No changes"
                  : `${changedKeys.length} change(s) pending`}
              </span>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
