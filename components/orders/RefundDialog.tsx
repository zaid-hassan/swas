"use client";

import { useState } from "react";
import { Loader2, RotateCcw } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";

type Props = {
  orderId: string;
  customer: string;
  email: string;
  amount: number;
};

export default function RefundDialog({
  orderId,
  customer,
  email,
  amount,
}: Props) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

  async function submitRefund() {
    if (!reason.trim()) {
      toast.error("Please enter a reason.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/refunds/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          orderId,
          customer,
          email,
          amount,
          reason,
        }),
      });

      if (!res.ok) throw new Error();

      toast.success("Refund request submitted successfully.");
      setReason("");
      setOpen(false);
    } catch {
      toast.error("Failed to submit refund request.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          className="
            border border-burgundy
            px-6 py-3
            text-[10px]
            font-semibold
            uppercase
            tracking-[0.18em]
            text-burgundy
            transition
            hover:bg-burgundy hover:text-white
          "
        >
          Request Refund
        </button>
      </DialogTrigger>

      <DialogContent className="border border-border bg-cream sm:max-w-md">
        <DialogHeader>
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-warm">
            <RotateCcw className="text-gold" size={22} strokeWidth={1.5} />
          </div>

          <DialogTitle
            className="text-burgundy text-3xl"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            Request Refund
          </DialogTitle>

          <DialogDescription className="text-burgundy/65 pt-2 leading-6">
            Tell us why you'd like to request a refund for this order.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 space-y-5">
          <div>
            <label className="text-gold mb-2 block text-[9px] font-semibold uppercase tracking-[0.28em]">
              Reason
            </label>

            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Describe the reason for your refund request..."
              rows={5}
              className="
                border-border focus:border-gold
                bg-background text-burgundy
                w-full resize-none border p-4 text-sm outline-none transition
                placeholder:text-burgundy/35
              "
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={() => setOpen(false)}
              disabled={loading}
              className="
                flex-1 border border-border py-3 text-sm font-medium text-burgundy
                transition hover:bg-warm
              "
            >
              Cancel
            </button>

            <button
              onClick={submitRefund}
              disabled={loading}
              className="
                bg-button hover:bg-burgundy-rich
                flex flex-1 items-center justify-center gap-2 py-3 text-sm font-semibold text-white transition
                disabled:opacity-60
              "
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={16} />
                  Sending...
                </>
              ) : (
                "Submit Request"
              )}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}