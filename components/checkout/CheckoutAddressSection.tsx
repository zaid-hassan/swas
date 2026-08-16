"use client";

import { useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

import AddressDialog from "./AddressDialogue";
import { Address } from "@/types/address";

type Props = {
  onAddressSelect: (address: Address | null) => void;
};

export default function CheckoutAddressSection({ onAddressSelect }: Props) {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState("");

  async function loadAddresses() {
    const user = auth.currentUser;

    if (!user) return;

    const snap = await getDoc(doc(db, "users", user.uid));

    if (!snap.exists()) return;

    const data = snap.data();
    const userAddresses = (data.addresses || []) as Address[];

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
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Delivery Address</CardTitle>

        <AddressDialog onSuccess={loadAddresses} />
      </CardHeader>

      <CardContent className="space-y-4">
        {!addresses.length && (
          <div className="border border-dashed rounded-xl p-10 text-center text-muted-foreground">
            No address added yet
          </div>
        )}

        {addresses.map((address) => (
          <button
            key={address.id}
            onClick={() => selectAddress(address)}
            className={`w-full rounded-xl border p-5 text-left transition ${
              selectedAddressId === address.id
                ? "border-black bg-neutral-50"
                : ""
            }`}
          >
            <div className="flex justify-between">
              <h3 className="font-medium">{address.fullName}</h3>

              {selectedAddressId === address.id && (
                <span className="text-sm font-medium">Selected</span>
              )}
            </div>

            <p className="text-sm text-muted-foreground mt-2">
              {address.addressLine1}
            </p>

            {address.addressLine2 && (
              <p className="text-sm text-muted-foreground">
                {address.addressLine2}
              </p>
            )}

            <p className="text-sm text-muted-foreground">
              {address.city}, {address.state}
            </p>

            <p className="text-sm text-muted-foreground">
              {address.pincode}
            </p>

            <p className="text-sm text-muted-foreground">
              {address.phone}
            </p>

            {address.landmark && (
              <p className="text-sm text-muted-foreground">
                Landmark: {address.landmark}
              </p>
            )}
          </button>
        ))}
      </CardContent>
    </Card>
  );
}