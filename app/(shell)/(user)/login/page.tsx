"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
} from "firebase/auth";

import { auth } from "@/lib/firebase";
import { ensureUserDocument } from "@/lib/create-user-document";
import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";

import { Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function LoginPage({
  className,
}: {
  className?: string;
}) {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();

    try {
      setLoading(true);

      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );

      await ensureUserDocument(userCredential.user);

      toast.success("Welcome back");

      router.push("/");
    } catch (error: any) {
      toast.error(error?.message || "Invalid email or password");
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleLogin() {
    try {
      setGoogleLoading(true);

      const provider = new GoogleAuthProvider();

      const result = await signInWithPopup(auth, provider);

      await ensureUserDocument(result.user);

      toast.success("Logged in with Google");

      router.push("/");
    } catch (error: any) {
      toast.error(error?.message || "Google login failed");
    } finally {
      setGoogleLoading(false);
    }
  }

  return (
    <div
      className={cn(
        "bg-background flex min-h-screen items-center justify-center px-5 py-10 md:px-10 md:py-20",
        className
      )}
    >
      <div className="w-full max-w-[440px]">
        {/* Heading */}

        <div className="mb-10 text-center">
          <p className="text-gold text-[10px] font-semibold uppercase tracking-[0.35em]">
            Welcome Back
          </p>

          <h1
            className="text-burgundy mt-4 text-4xl font-light md:text-5xl"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            Sign In
          </h1>

          <p className="text-burgundy/65 mt-4 text-sm leading-7">
            Access your SWAS account to view orders, manage addresses and
            continue shopping.
          </p>
        </div>

        <Card className="border-gold/20 bg-white shadow-[0_20px_60px_rgba(41,7,7,0.06)]">
          <CardContent className="p-6 md:p-8">
            <form onSubmit={handleLogin}>
              <FieldGroup className="space-y-6">
                <Field>
                  <FieldLabel className="text-burgundy mb-2 uppercase tracking-[0.16em] text-[11px]">
                    Email
                  </FieldLabel>

                  <Input
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="border-gold/20 focus:border-gold bg-background h-12 rounded-none"
                  />
                </Field>

                <Field>
                  <div className="mb-2 flex items-center justify-between">
                    <FieldLabel className="text-burgundy uppercase tracking-[0.16em] text-[11px]">
                      Password
                    </FieldLabel>

                    <button
                      type="button"
                      className="text-gold hover:text-burgundy text-xs transition"
                    >
                      Forgot?
                    </button>
                  </div>

                  <Input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="border-gold/20 focus:border-gold bg-background h-12 rounded-none"
                  />
                </Field>

                <Button
                  type="submit"
                  disabled={loading || googleLoading}
                  className="bg-button hover:bg-burgundy-light h-12 w-full rounded-none text-[11px] font-semibold uppercase tracking-[0.18em]"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Signing In
                    </>
                  ) : (
                    "Sign In"
                  )}
                </Button>

                <div className="relative py-2">
                  <div className="bg-gold/20 absolute inset-0 flex items-center">
                    <div className="h-px w-full bg-gold/20" />
                  </div>

                  <div className="relative flex justify-center">
                    <span className="bg-white text-burgundy/50 px-4 text-[11px] uppercase tracking-[0.18em]">
                      or
                    </span>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  onClick={handleGoogleLogin}
                  disabled={loading || googleLoading}
                  className="border-gold/25 hover:bg-warm h-12 w-full rounded-none text-burgundy hover:border-gold"
                >
                  {googleLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Connecting...
                    </>
                  ) : (
                    <>
                      <svg
                        className="mr-3 h-5 w-5"
                        viewBox="0 0 24 24"
                      >
                        <path
                          fill="#EA4335"
                          d="M12 10.2v3.9h5.5c-.2 1.3-.9 2.4-2 3.2l3.2 2.5c1.9-1.8 3-4.4 3-7.5 0-.7-.1-1.4-.2-2H12z"
                        />
                        <path
                          fill="#34A853"
                          d="M12 22c2.7 0 5-0.9 6.7-2.5l-3.2-2.5c-.9.6-2 .9-3.5.9-2.7 0-5-1.8-5.8-4.3H2.9v2.7C4.6 19.8 8 22 12 22z"
                        />
                        <path
                          fill="#FBBC05"
                          d="M6.2 13.6c-.2-.6-.3-1.1-.3-1.7s.1-1.2.3-1.7V7.5H2.9A10 10 0 0 0 2 12c0 1.6.4 3.1.9 4.5l3.3-2.9z"
                        />
                        <path
                          fill="#4285F4"
                          d="M12 5.1c1.5 0 2.8.5 3.8 1.5l2.8-2.8C17 2.3 14.7 1.3 12 1.3 8 1.3 4.6 3.5 2.9 7.5l3.3 2.6C7 6.9 9.3 5.1 12 5.1z"
                        />
                      </svg>

                      Continue with Google
                    </>
                  )}
                </Button>

                <FieldDescription className="text-center text-sm text-burgundy/65 pt-2">
                  Don&apos;t have an account?{" "}
                  <a
                    href="/signup"
                    className="text-gold hover:text-burgundy font-medium transition"
                  >
                    Create one
                  </a>
                </FieldDescription>
              </FieldGroup>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}