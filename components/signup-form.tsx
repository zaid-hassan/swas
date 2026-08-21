"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import {
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  updateProfile,
} from "firebase/auth";

import { auth } from "@/lib/firebase";
import { ensureUserDocument } from "@/lib/create-user-document";

import { toast } from "sonner";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";

export default function SignupForm({
  ...props
}: React.ComponentProps<typeof Card>) {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();

    if (password.length < 8) {
      toast.error("Password must be at least 8 characters long");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    try {
      setLoading(true);

      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

      await updateProfile(userCredential.user, {
        displayName: name,
      });

      await ensureUserDocument(userCredential.user, name);

      toast.success("Welcome to SWAS");

      router.push("/");
    } catch (error: any) {
      toast.error(error?.message || "Signup failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleSignup() {
    try {
      setGoogleLoading(true);

      const provider = new GoogleAuthProvider();

      const result = await signInWithPopup(auth, provider);

      await ensureUserDocument(result.user);

      toast.success("Welcome to SWAS");

      router.push("/");
    } catch (error: any) {
      toast.error(error?.message || "Google signup failed.");
    } finally {
      setGoogleLoading(false);
    }
  }

  return (
    <>
      {/* Heading */}

      <div className="mb-10 text-center">
        <p className="text-gold text-[10px] font-semibold uppercase tracking-[0.35em]">
          Join SWAS
        </p>

        <h1
          className="text-burgundy mt-4 text-4xl font-light md:text-5xl"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          Create Account
        </h1>

        <p className="text-burgundy/65 mt-4 text-sm leading-7">
          Create your SWAS account to save your favourites, track orders and
          enjoy a seamless shopping experience.
        </p>
      </div>

      <Card
        {...props}
        className="border-gold/20 bg-white shadow-[0_20px_60px_rgba(41,7,7,0.06)]"
      >
        <CardContent className="p-6 md:p-8">
          <form onSubmit={handleSignup}>
            <FieldGroup className="space-y-6">
              {/* Name */}

              <Field>
                <FieldLabel className="text-burgundy mb-2 uppercase tracking-[0.16em] text-[11px]">
                  Full Name
                </FieldLabel>

                <Input
                  type="text"
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="bg-background border-gold/20 focus:border-gold h-12 rounded-none"
                />
              </Field>

              {/* Email */}

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
                  className="bg-background border-gold/20 focus:border-gold h-12 rounded-none"
                />

                <FieldDescription className="text-burgundy/55 mt-2">
                  We'll use this to contact you.
                </FieldDescription>
              </Field>

              {/* Password */}

              <Field>
                <FieldLabel className="text-burgundy mb-2 uppercase tracking-[0.16em] text-[11px]">
                  Password
                </FieldLabel>

                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="bg-background border-gold/20 focus:border-gold h-12 rounded-none"
                />

                <FieldDescription className="text-burgundy/55 mt-2">
                  Must be at least 8 characters long.
                </FieldDescription>
              </Field>

              {/* Confirm Password */}

              <Field>
                <FieldLabel className="text-burgundy mb-2 uppercase tracking-[0.16em] text-[11px]">
                  Confirm Password
                </FieldLabel>

                <Input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="bg-background border-gold/20 focus:border-gold h-12 rounded-none"
                />
              </Field>

              {/* Primary CTA */}

              <Button
                type="submit"
                disabled={loading || googleLoading}
                className="bg-button hover:bg-burgundy-light h-12 w-full rounded-none text-[11px] font-semibold uppercase tracking-[0.18em]"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating Account...
                  </>
                ) : (
                  "Create Account"
                )}
              </Button>

              {/* Divider */}

              <div className="relative py-2">
                <div className="absolute inset-0 flex items-center">
                  <div className="bg-gold/20 h-px w-full" />
                </div>

                <div className="relative flex justify-center">
                  <span className="bg-white text-burgundy/50 px-4 text-[11px] uppercase tracking-[0.18em]">
                    or
                  </span>
                </div>
              </div>

              {/* Google */}

              <Button
                variant="outline"
                type="button"
                onClick={handleGoogleSignup}
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

              <FieldDescription className="text-burgundy/65 pt-2 text-center text-sm">
                Already have an account?{" "}
                <a
                  href="/login"
                  className="text-gold hover:text-burgundy font-medium transition"
                >
                  Sign In
                </a>
              </FieldDescription>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </>
  );
}