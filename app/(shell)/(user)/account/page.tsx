"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { toast } from "sonner";

import { useAuth } from "@/components/providers/AuthProvider";
import { db, auth } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import AddressDialog from "@/components/checkout/AddressDialogue"; // adjust path if different
import { Address } from "@/types/address";

import {
  ArrowRight,
  ChevronRight,
  CircleUserRound,
  Coins,
  Gift,
  Heart,
  Loader2,
  LogOut,
  MapPin,
  Package,
  ShieldCheck,
  Truck,
  WalletCards,
} from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";

type Tab = "profile" | "wallet" | "addresses" | "wishlist";

const navigation = [
  { id: "orders", label: "Orders", icon: Package },
  { id: "profile", label: "Profile", icon: CircleUserRound },
  { id: "wallet", label: "SWAS Wallet", icon: WalletCards },
  { id: "addresses", label: "Addresses", icon: MapPin },
  // { id: "wishlist", label: "Wishlist", icon: Heart },
] as const;

const benefits = [
  {
    icon: Truck,
    title: "Shipping",
    text: "All India delivery",
  },
  {
    icon: ShieldCheck,
    title: "Authentic 925 Silver",
    text: "Hallmarked & certified",
  },
  {
    icon: ArrowRight,
    title: "Easy Returns",
    text: "15-day return policy",
  },
  {
    icon: Gift,
    title: "SWAS Privilege",
    text: "Earn & redeem coins",
  },
];

export default function AccountPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<Tab>("profile");
  const [coins, setCoins] = useState(0);
  const [walletLoading, setWalletLoading] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [loading, user, router]);

  useEffect(() => {
    async function syncWallet() {
      if (!user) return;

      try {
        const res = await fetch("/api/wallet/sync", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            uid: user.uid,
            email: user.email,
          }),
        });

        const data = await res.json();

        if (data.success) {
          setCoins(data.wallet || 0);

          if (data.addedCoins > 0) {
            toast.success(`${data.addedCoins} coins added.`);
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setWalletLoading(false);
      }
    }

    syncWallet();
  }, [user]);

  async function handleLogout() {
    await signOut(auth);
    toast.success("Logged out successfully.");
    router.push("/");
  }

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <Loader2 className="animate-spin text-gold" />
      </div>
    );
  }

  if (!user) return null;

  const initials =
    user.displayName
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase() || "U";

  const firstName = user.displayName?.split(" ")[0] || "Customer";

  return (
    <main className="bg-background min-h-screen">
      <div className="mx-auto max-w-[1280px] px-5 py-12 md:px-10 md:py-16">
        {/* HEADER */}

        <header className="border-border border-b pb-8">
          <p className="text-gold text-[10px] font-semibold uppercase tracking-[0.35em]">
            My Account
          </p>

          <h1
            className="text-burgundy mt-3 text-4xl md:text-6xl"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            Welcome back, {firstName}.
          </h1>

          <p className="text-burgundy/70 mt-4 max-w-lg">
            Manage your profile, orders and SWAS Wallet.
          </p>
        </header>

        {/* LAYOUT */}

        <div className="mt-8 grid gap-6 lg:grid-cols-[260px_1fr]">
          {/* SIDEBAR */}

          <aside className="border-border bg-card border">
            <div className="p-6 text-center">
              <Avatar className="bg-warm mx-auto h-20 w-20 border border-gold/20">
                <AvatarFallback
                  className="bg-warm text-burgundy text-3xl"
                  style={{ fontFamily: "var(--font-heading)" }}
                >
                  {initials}
                </AvatarFallback>
              </Avatar>

              <h2
                className="text-burgundy mt-4 text-2xl"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                {user.displayName || "SWAS Customer"}
              </h2>

              <p className="text-burgundy/60 mt-1 break-all text-xs">
                {user.email}
              </p>
            </div>

            <div className="border-border border-t" />

            <nav className="p-3">
              {navigation.map((item) => {
                const Icon = item.icon;

                const active = activeTab === item.id;

                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      if (item.id === "orders") {
                        router.push("/account/orders");
                        return;
                      }

                      setActiveTab(item.id as Tab);
                    }}
                    className={`group flex w-full items-center justify-between px-3 py-3 transition ${
                      active
                        ? "bg-warm text-burgundy"
                        : "text-burgundy/80 hover:bg-warm"
                    }`}
                  >
                    <span className="flex items-center gap-3">
                      <Icon
                        size={18}
                        className={active ? "text-burgundy" : "text-burgundy/60 group-hover:text-gold"}
                      />

                      <span className="text-sm font-medium">{item.label}</span>
                    </span>

                    <ChevronRight
                      size={16}
                      className="text-burgundy/40 group-hover:text-gold"
                    />
                  </button>
                );
              })}

              <div className="border-border my-3 border-t" />

              <button
                onClick={handleLogout}
                className="group text-burgundy/80 hover:bg-warm flex w-full items-center justify-between px-3 py-3 transition"
              >
                <span className="flex items-center gap-3">
                  <LogOut
                    size={18}
                    className="text-burgundy/60 group-hover:text-gold"
                  />

                  <span className="text-sm font-medium">Sign Out</span>
                </span>

                <ChevronRight size={16} className="text-burgundy/40" />
              </button>
            </nav>
          </aside>

          {/* RIGHT PANEL */}

          <section>
            {activeTab === "profile" && (
              <ProfilePanel
                user={user}
                initials={initials}
              />
            )}

            {activeTab === "wallet" && (
              <WalletPanel
                coins={coins}
                loading={walletLoading}
              />
            )}

            {activeTab === "addresses" && <AddressesPanel />}

            {/* {activeTab === "wishlist" && (
              <WishlistPanel
                onExplore={() => router.push("/shop")}
              />
            )} */}
          </section>
        </div>

        {/* BENEFITS */}

        <section className="border-border mt-10 border-t pt-6">
          <div className="grid grid-cols-2 md:grid-cols-4">
            {benefits.map((b, i) => {
              const Icon = b.icon;

              return (
                <div
                  key={b.title}
                  className={`flex items-center gap-3 px-3 py-4 ${
                    i !== 0 ? "md:border-l border-border" : ""
                  }`}
                >
                  <div className="bg-warm flex h-10 w-10 items-center justify-center rounded-full">
                    <Icon className="text-burgundy/80" size={18} />
                  </div>

                  <div>
                    <p className="text-burgundy text-xs font-semibold">
                      {b.title}
                    </p>

                    <p className="text-burgundy/60 text-[11px]">
                      {b.text}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </main>
  );
}

/* ---------------- PANELS ---------------- */

function ProfilePanel({
  user,
  initials,
}: {
  user: any;
  initials: string;
}) {
  return (
    <div className="border-border bg-card border p-6 md:p-8">
      <p className="text-gold text-[10px] font-semibold uppercase tracking-[0.3em]">
        Profile
      </p>

      <div className="mt-6 flex flex-col gap-5 md:flex-row md:items-center">
        <Avatar className="bg-warm h-20 w-20 border border-gold/20">
          <AvatarFallback
            className="bg-warm text-burgundy text-3xl"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            {initials}
          </AvatarFallback>
        </Avatar>

        <div>
          <h2
            className="text-burgundy text-3xl"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            {user.displayName || "SWAS Customer"}
          </h2>

          <p className="text-burgundy/70 mt-1">{user.email}</p>
        </div>
      </div>

      <div className="mt-8 grid gap-5 md:grid-cols-2">
        <Field
          label="Full Name"
          value={user.displayName || "-"}
        />

        <Field
          label="Email"
          value={user.email}
        />

        <Field
          label="Member Since"
          value="SWAS Member"
        />

        <Field
          label="Account Status"
          value="Verified"
        />
      </div>
    </div>
  );
}

function WalletPanel({
  coins,
  loading,
}: {
  coins: number;
  loading: boolean;
}) {
  return (
    <div className="border-border bg-card border p-6 md:p-8">
      <p className="text-gold text-[10px] font-semibold uppercase tracking-[0.3em]">
        SWAS Wallet
      </p>

      <div className="mt-6 flex flex-col justify-between gap-6 md:flex-row md:items-center">
        <div>
          {loading ? (
            <div className="bg-warm h-16 w-24 animate-pulse" />
          ) : (
            <>
              <div
                className="text-gold text-6xl"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                {coins}
              </div>

              <div
                className="text-burgundy text-2xl"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                Coins
              </div>
            </>
          )}

          <p className="text-burgundy/65 mt-3">
            Earn coins on eligible purchases and approved refunds.
          </p>
        </div>

        <Coins className="text-gold h-14 w-14" strokeWidth={1} />
      </div>
    </div>
  );
}

function AddressesPanel() {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadAddresses() {
    const user = auth.currentUser;

    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const snap = await getDoc(doc(db, "users", user.uid));

      if (snap.exists()) {
        const data = snap.data();
        setAddresses((data.addresses || []) as Address[]);
      }
    } catch (err) {
      console.error("Failed to load addresses:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAddresses();
  }, []);

  return (
    <section className="border border-border bg-card">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-6 py-5">
        <div>
          <p className="text-gold text-[9px] font-semibold uppercase tracking-[0.3em]">
            Addresses
          </p>

          <h2
            className="text-burgundy mt-2 text-3xl"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            Saved Addresses
          </h2>
        </div>

        <AddressDialog onSuccess={loadAddresses} />
      </div>

      {/* Content */}
      <div className="p-6">
        {loading ? (
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <div key={i} className="bg-warm h-32 animate-pulse border border-border" />
            ))}
          </div>
        ) : addresses.length === 0 ? (
          <div className="border border-dashed border-gold/30 bg-warm px-6 py-12 text-center">
            <MapPin
              size={38}
              strokeWidth={1}
              className="text-gold mx-auto mb-4"
            />

            <h3
              className="text-burgundy text-3xl"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              No addresses yet.
            </h3>

            <p className="text-burgundy/65 mt-3">
              Add a delivery address for faster checkout.
            </p>

            <div className="mt-6 flex justify-center">
              <AddressDialog onSuccess={loadAddresses} />
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            {addresses.map((address) => (
              <div
                key={address.id}
                className="border border-border bg-background p-5 transition hover:border-gold/40"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3
                      className="text-burgundy text-2xl"
                      style={{ fontFamily: "var(--font-heading)" }}
                    >
                      {address.fullName}
                    </h3>

                    <p className="text-burgundy/60 mt-1 text-xs">
                      {address.phone}
                    </p>
                  </div>

                  {address.isDefault && (
                    <span className="border border-gold/30 bg-gold/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-gold">
                      Default
                    </span>
                  )}
                </div>

                <div className="border-border my-4 border-t" />

                <div className="space-y-1 text-sm leading-6 text-burgundy/80">
                  <p>{address.addressLine1}</p>

                  {address.addressLine2 && (
                    <p>{address.addressLine2}</p>
                  )}

                  <p>
                    {address.city}, {address.state}
                  </p>

                  <p>{address.pincode}</p>

                  {address.landmark && (
                    <p className="text-burgundy/60">
                      Landmark: {address.landmark}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

// function WishlistPanel({
//   onExplore,
// }: {
//   onExplore: () => void;
// }) {
//   return (
//     <div className="border-border bg-card border p-10 text-center">
//       <Heart className="text-gold mx-auto mb-5" size={42} strokeWidth={1} />

//       <h2
//         className="text-burgundy text-3xl"
//         style={{ fontFamily: "var(--font-heading)" }}
//       >
//         Your wishlist is empty.
//       </h2>

//       <p className="text-burgundy/70 mt-3">
//         Save your favourite pieces for later.
//       </p>

//       <button
//         onClick={onExplore}
//         className="bg-button hover:bg-burgundy-rich mt-7 px-6 py-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-white transition"
//       >
//         Explore Jewellery
//       </button>
//     </div>
//   );
// }

function Field({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <p className="text-gold text-[9px] font-semibold uppercase tracking-[0.25em]">
        {label}
      </p>

      <div className="border-border text-burgundy mt-2 border px-4 py-3">
        {value}
      </div>
    </div>
  );
}