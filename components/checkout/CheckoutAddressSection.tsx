"use client"

import { useEffect, useState } from "react"

import { auth, db } from "@/lib/firebase"

import { doc, getDoc } from "firebase/firestore"

import {
  Card,
  CardHeader,
  CardTitle,
  CardContent
} from "@/components/ui/card"
import AddressDialog from "./AddressDialogue"


export default function CheckoutAddressSection() {

  const [addresses, setAddresses] = useState<any[]>([])
  const [selectedAddress, setSelectedAddress] = useState<string>("")

  async function loadAddresses() {

    const user = auth.currentUser

    if (!user) return

    const snap = await getDoc(doc(db, "users", user.uid))

    if (!snap.exists()) return

    const data = snap.data()

    setAddresses(data.addresses || [])

    if (data.addresses?.length) {
      setSelectedAddress(data.addresses[0].id)
    }
  }

  useEffect(() => {
    loadAddresses()
  }, [])

  return (
    <Card>

      <CardHeader className="flex flex-row items-center justify-between">

        <CardTitle>
          Delivery Address
        </CardTitle>

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
            onClick={() => setSelectedAddress(address.id)}
            className={`
              w-full
              rounded-xl
              border
              p-5
              text-left
              transition

              ${
                selectedAddress === address.id
                  ? "border-black bg-neutral-50"
                  : ""
              }
            `}
          >

            <div className="flex justify-between">

              <h3 className="font-medium">
                {address.fullName}
              </h3>

              {selectedAddress === address.id && (
                <span className="text-sm font-medium">
                  Selected
                </span>
              )}

            </div>

            <p className="text-sm text-muted-foreground mt-2">
              {address.addressLine1}
            </p>

            <p className="text-sm text-muted-foreground">
              {address.addressLine2}
            </p>

            <p className="text-sm text-muted-foreground">
              {address.city}, {address.state}
            </p>

            <p className="text-sm text-muted-foreground">
              {address.pincode}
            </p>

            <p className="text-sm text-muted-foreground">
              {address.phone}
            </p>

          </button>

        ))}

      </CardContent>

    </Card>
  )
}