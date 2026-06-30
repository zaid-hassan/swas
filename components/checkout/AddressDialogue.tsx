"use client"

import { useState } from "react"
import { auth, db } from "@/lib/firebase"

import {
  doc,
  updateDoc,
  arrayUnion
} from "firebase/firestore"

import { nanoid } from "nanoid"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

type Props = {
  onSuccess: () => void
}

export default function AddressDialog({ onSuccess }: Props) {

  const [open, setOpen] = useState(false)

  const [form, setForm] = useState({
    fullName: "",
    phone: "",
    pincode: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    landmark: "",
  })

  async function saveAddress() {

      
      const user = auth.currentUser
      console.log(user)

    if (!user) return

    await updateDoc(doc(db, "users", user.uid), {
      addresses: arrayUnion({
        id: nanoid(),
        ...form,
        isDefault: false
      })
    })

    setOpen(false)

    setForm({
      fullName: "",
      phone: "",
      pincode: "",
      addressLine1: "",
      addressLine2: "",
      city: "",
      state: "",
      landmark: "",
    })

    onSuccess()
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>

      <DialogTrigger asChild>
        <Button>Add Address</Button>
      </DialogTrigger>

      <DialogContent className="max-w-lg">

        <DialogHeader>
          <DialogTitle>Add Address</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">

          <div>
            <Label>Full Name</Label>
            <Input
              value={form.fullName}
              onChange={(e) =>
                setForm({
                  ...form,
                  fullName: e.target.value
                })
              }
            />
          </div>

          <div>
            <Label>Phone</Label>
            <Input
              value={form.phone}
              onChange={(e) =>
                setForm({
                  ...form,
                  phone: e.target.value
                })
              }
            />
          </div>

          <div>
            <Label>Pincode</Label>
            <Input
              value={form.pincode}
              onChange={(e) =>
                setForm({
                  ...form,
                  pincode: e.target.value
                })
              }
            />
          </div>

          <div>
            <Label>Address Line 1</Label>
            <Input
              value={form.addressLine1}
              onChange={(e) =>
                setForm({
                  ...form,
                  addressLine1: e.target.value
                })
              }
            />
          </div>

          <div>
            <Label>Address Line 2</Label>
            <Input
              value={form.addressLine2}
              onChange={(e) =>
                setForm({
                  ...form,
                  addressLine2: e.target.value
                })
              }
            />
          </div>

          <div className="grid grid-cols-2 gap-4">

            <div>
              <Label>City</Label>
              <Input
                value={form.city}
                onChange={(e) =>
                  setForm({
                    ...form,
                    city: e.target.value
                  })
                }
              />
            </div>

            <div>
              <Label>State</Label>
              <Input
                value={form.state}
                onChange={(e) =>
                  setForm({
                    ...form,
                    state: e.target.value
                  })
                }
              />
            </div>

          </div>

          <div>
            <Label>Landmark</Label>
            <Input
              value={form.landmark}
              onChange={(e) =>
                setForm({
                  ...form,
                  landmark: e.target.value
                })
              }
            />
          </div>

          <Button
            className="w-full"
            onClick={saveAddress}
          >
            Save Address
          </Button>

        </div>

      </DialogContent>

    </Dialog>
  )
}