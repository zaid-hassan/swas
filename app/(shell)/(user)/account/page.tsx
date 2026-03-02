"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/providers/AuthProvider"
import { signOut } from "firebase/auth"
import { auth } from "@/lib/firebase"
import { toast } from "sonner"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { Loader2, LogOut, Heart, Package } from "lucide-react"

export default function AccountPage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login")
    }
  }, [user, loading, router])

  async function handleLogout() {
    await signOut(auth)
    toast.success("Logged out successfully")
    router.push("/")
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    )
  }

  if (!user) return null

  const initials =
    user.displayName
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase() || "U"

  return (
    <div className="mx-auto max-w-5xl px-4 py-16 space-y-8">

      {/* Page Title */}
      <div>
        <h1 className="text-3xl font-heading font-semibold tracking-tight">
          My Account
        </h1>
        <p className="text-muted-foreground mt-2">
          Manage your profile and orders
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">

        {/* Profile Card */}
        <Card className="md:col-span-1">
          <CardHeader className="items-center text-center">
            <Avatar className="h-16 w-16">
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <CardTitle className="mt-4">
              {user.displayName || "SWAS Customer"}
            </CardTitle>
            <CardDescription>
              {user.email}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <Separator />

            <Button
              variant="outline"
              className="w-full justify-start gap-2"
              onClick={() => router.push("/wishlist")}
            >
              <Heart size={16} />
              My Wishlist
            </Button>

            <Button
              variant="outline"
              className="w-full justify-start gap-2"
              onClick={() => router.push("/orders")}
            >
              <Package size={16} />
              My Orders
            </Button>

            <Separator />

            <Button
              variant="destructive"
              className="w-full justify-start gap-2"
              onClick={handleLogout}
            >
              <LogOut size={16} />
              Logout
            </Button>
          </CardContent>
        </Card>

        {/* Orders Section */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Recent Orders</CardTitle>
            <CardDescription>
              Your recent purchases will appear here.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <div className="flex flex-col items-center justify-center py-12 text-center space-y-3">
              <Package className="h-8 w-8 text-muted-foreground" />
              <p className="text-muted-foreground text-sm">
                No orders yet.
              </p>
              <Button
                variant="outline"
                onClick={() => router.push("/shop")}
              >
                Start Shopping
              </Button>
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  )
}