"use client";

import { useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

import AddressDialog from "./AddressDialogue";
import { Address } from "@/types/address";

import {
  MapPin,
  Phone,
  Home,
  CheckCircle,
  Navigation,
} from "lucide-react";

type Props = {
  onAddressSelect: (address: Address | null) => void;
};

export default function CheckoutAddressSection({
  onAddressSelect,
}: Props) {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState("");

  async function loadAddresses() {
    const user = auth.currentUser;

    if (!user) {
      setAddresses([]);
      onAddressSelect(null);
      return;
    }

    const snap = await getDoc(doc(db, "users", user.uid));

    if (!snap.exists()) {
      setAddresses([]);
      onAddressSelect(null);
      return;
    }

    const userAddresses = (snap.data().addresses || []) as Address[];

    setAddresses(userAddresses);

    if (userAddresses.length) {
      const defaultAddress =
        userAddresses.find((a) => a.isDefault) || userAddresses[0];

      setSelectedAddressId(defaultAddress.id);
      onAddressSelect(defaultAddress);
    } else {
      onAddressSelect(null);
    }
  }

  function selectAddress(address: Address) {
    setSelectedAddressId(address.id);
    onAddressSelect(address);
  }

  useEffect(() => {
    loadAddresses();
  }, []);

  return (
    <Card className="border-gold/20 bg-white rounded-none">
      <CardHeader className="border-b border-gold/10 pb-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-gold text-[10px] font-semibold uppercase tracking-[0.3em]">
              Delivery
            </p>

            <CardTitle
              className="text-burgundy mt-2 text-3xl font-light"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              Address
            </CardTitle>

            <p className="text-burgundy/60 mt-2 text-sm">
              Select where you'd like your order delivered.
            </p>
          </div>

          <AddressDialog onSuccess={loadAddresses} />
        </div>
      </CardHeader>

      <CardContent className="space-y-4 p-5 md:p-6">
        {!addresses.length ? (
          <div className="border-gold/30 bg-warm border border-dashed px-6 py-12 text-center">
            <MapPin className="text-gold mx-auto mb-5" size={40} />

            <h3 className="text-burgundy text-xl font-medium">
              No Address Added
            </h3>

            <p className="text-burgundy/60 mt-3 text-sm leading-6">
              Add your first delivery address to make checkout faster.
            </p>
          </div>
        ) : (
          addresses.map((address) => {
            const selected = selectedAddressId === address.id;

            return (
              <button
                key={address.id}
                onClick={() => selectAddress(address)}
                className={`w-full border p-5 text-left transition-all duration-300 ${
                  selected
                    ? "border-gold bg-warm shadow-[0_8px_24px_rgba(200,149,42,0.08)]"
                    : "border-border hover:border-gold/40"
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Home className="text-gold" size={16} />

                      <h3 className="text-burgundy font-semibold">
                        {address.fullName}
                      </h3>

                      {address.isDefault && (
                        <span className="border-gold/30 bg-gold/10 text-gold border px-2 py-0.5 text-[10px] uppercase tracking-wider">
                          Default
                        </span>
                      )}
                    </div>

                    <div className="text-burgundy/70 mt-4 space-y-2 text-sm leading-6">
                      <p>{address.addressLine1}</p>

                      {address.addressLine2 && <p>{address.addressLine2}</p>}

                      <div className="flex items-start gap-2">
                        <Navigation
                          size={15}
                          className="text-gold mt-1 shrink-0"
                        />

                        <span>
                          {address.city}, {address.state} • {address.pincode}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <Phone size={15} className="text-gold" />
                        <span>{address.phone}</span>
                      </div>

                      {address.landmark && (
                        <p className="text-burgundy/55 text-xs">
                          Landmark: {address.landmark}
                        </p>
                      )}
                    </div>
                  </div>

                  {selected && (
                    <CheckCircle
                      className="text-gold shrink-0"
                      size={24}
                    />
                  )}
                </div>
              </button>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}