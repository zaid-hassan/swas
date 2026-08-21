"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";

import { doc, setDoc, arrayUnion } from "firebase/firestore";
import { nanoid } from "nanoid";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import {
  Loader2,
  MapPin,
  User,
  Phone,
  Home,
  Landmark,
  Mailbox,
} from "lucide-react";

import { toast } from "sonner";

type Props = {
  onSuccess: () => void;
};

type AddressForm = {
  fullName: string;
  phone: string;
  pincode: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  landmark: string;
};

const emptyForm: AddressForm = {
  fullName: "",
  phone: "",
  pincode: "",
  addressLine1: "",
  addressLine2: "",
  city: "",
  state: "",
  landmark: "",
};

export default function AddressDialog({ onSuccess }: Props) {
  const router = useRouter();

  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState<AddressForm>(emptyForm);

  const inputClass =
    "border-gold/20 focus-visible:border-gold focus-visible:ring-gold bg-background rounded-none h-11";

  async function saveAddress() {
    const user = auth.currentUser;

    if (!user) {
      toast.error("Please create an account or login before adding an address");

      setOpen(false);

      setTimeout(() => router.push("/signup"), 1200);

      return;
    }

    try {
      setSaving(true);

      const address = {
        id: nanoid(),
        ...form,
        isDefault: false,
      };

      await setDoc(
        doc(db, "users", user.uid),
        {
          uid: user.uid,
          addresses: arrayUnion(address),
        },
        { merge: true }
      );

      toast.success("Address saved successfully");

      setOpen(false);
      setForm(emptyForm);

      onSuccess();
    } catch (error) {
      console.error(error);

      toast.error("Failed to save address");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-button hover:bg-burgundy-light border border-gold/20 text-gold rounded-none">
          <MapPin className="mr-2 h-4 w-4" />
          Add Address
        </Button>
      </DialogTrigger>

      <DialogContent className="border-gold/20 bg-white max-h-[90vh] max-w-xl overflow-y-auto rounded-none">
        <DialogHeader className="border-b border-gold/10 pb-5">
          <p className="text-gold text-[10px] font-semibold uppercase tracking-[0.3em]">
            Delivery
          </p>

          <DialogTitle
            className="text-burgundy text-3xl font-light"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            Add Address
          </DialogTitle>

          <p className="text-burgundy/60 text-sm">
            Save your delivery details for faster checkout.
          </p>
        </DialogHeader>

        <div className="space-y-5 py-2">
          <div>
            <Label className="text-burgundy mb-2 flex items-center gap-2">
              <User size={14} className="text-gold" />
              Full Name
            </Label>

            <Input
              className={inputClass}
              value={form.fullName}
              onChange={(e) =>
                setForm({ ...form, fullName: e.target.value })
              }
            />
          </div>

          <div>
            <Label className="text-burgundy mb-2 flex items-center gap-2">
              <Phone size={14} className="text-gold" />
              Phone Number
            </Label>

            <Input
              className={inputClass}
              value={form.phone}
              onChange={(e) =>
                setForm({ ...form, phone: e.target.value })
              }
            />
          </div>

          <div>
            <Label className="text-burgundy mb-2 flex items-center gap-2">
              <Mailbox size={14} className="text-gold" />
              Pincode
            </Label>

            <Input
              className={inputClass}
              value={form.pincode}
              onChange={(e) =>
                setForm({ ...form, pincode: e.target.value })
              }
            />
          </div>

          <div>
            <Label className="text-burgundy mb-2 flex items-center gap-2">
              <Home size={14} className="text-gold" />
              Address Line 1
            </Label>

            <Input
              className={inputClass}
              value={form.addressLine1}
              onChange={(e) =>
                setForm({
                  ...form,
                  addressLine1: e.target.value,
                })
              }
            />
          </div>

          <div>
            <Label className="text-burgundy mb-2 flex items-center gap-2">
              <Home size={14} className="text-gold" />
              Address Line 2 (Optional)
            </Label>

            <Input
              className={inputClass}
              value={form.addressLine2}
              onChange={(e) =>
                setForm({
                  ...form,
                  addressLine2: e.target.value,
                })
              }
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-burgundy mb-2 flex items-center gap-2">
                <MapPin size={14} className="text-gold" />
                City
              </Label>

              <Input
                className={inputClass}
                value={form.city}
                onChange={(e) =>
                  setForm({ ...form, city: e.target.value })
                }
              />
            </div>

            <div>
              <Label className="text-burgundy mb-2 flex items-center gap-2">
                <MapPin size={14} className="text-gold" />
                State
              </Label>

              <Input
                className={inputClass}
                value={form.state}
                onChange={(e) =>
                  setForm({ ...form, state: e.target.value })
                }
              />
            </div>
          </div>

          <div>
            <Label className="text-burgundy mb-2 flex items-center gap-2">
              <Landmark size={14} className="text-gold" />
              Landmark (Optional)
            </Label>

            <Input
              className={inputClass}
              value={form.landmark}
              onChange={(e) =>
                setForm({ ...form, landmark: e.target.value })
              }
            />
          </div>

          <Button
            className="bg-button hover:bg-burgundy-light mt-4 h-12 w-full rounded-none text-sm tracking-wide text-gold"
            onClick={saveAddress}
            disabled={saving}
          >
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving Address...
              </>
            ) : (
              "Save Address"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}