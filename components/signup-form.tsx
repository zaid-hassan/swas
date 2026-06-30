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

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

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

      const userCredential =
        await createUserWithEmailAndPassword(
          auth,
          email,
          password
        );

      await updateProfile(userCredential.user, {
        displayName: name,
      });

      await ensureUserDocument(
        userCredential.user,
        name
      );

      toast.success(
        "Account created successfully 🎉"
      );

      router.push("/");
    } catch (error: any) {
      toast.error(
        error?.message ||
          "Signup failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleSignup() {
    try {
      setGoogleLoading(true);

      const provider = new GoogleAuthProvider();

      const result = await signInWithPopup(
        auth,
        provider
      );

      await ensureUserDocument(result.user);

      toast.success("Welcome to SWAS 👋");

      router.push("/");
    } catch (error: any) {
      toast.error(
        error?.message || "Google signup failed."
      );
    } finally {
      setGoogleLoading(false);
    }
  }

  return (
    <Card {...props} className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Create an account</CardTitle>

        <CardDescription>
          Enter your information below to create
          your account
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form
          onSubmit={handleSignup}
          className="space-y-6"
        >
          <FieldGroup className="space-y-4">

            <Field>
              <FieldLabel>Full Name</FieldLabel>

              <Input
                type="text"
                placeholder="John Doe"
                value={name}
                onChange={(e) =>
                  setName(e.target.value)
                }
                required
              />
            </Field>

            <Field>
              <FieldLabel>Email</FieldLabel>

              <Input
                type="email"
                placeholder="m@example.com"
                value={email}
                onChange={(e) =>
                  setEmail(e.target.value)
                }
                required
              />

              <FieldDescription>
                We'll use this to contact you.
              </FieldDescription>
            </Field>

            <Field>
              <FieldLabel>Password</FieldLabel>

              <Input
                type="password"
                value={password}
                onChange={(e) =>
                  setPassword(e.target.value)
                }
                required
              />

              <FieldDescription>
                Must be at least 8 characters long.
              </FieldDescription>
            </Field>

            <Field>
              <FieldLabel>
                Confirm Password
              </FieldLabel>

              <Input
                type="password"
                value={confirmPassword}
                onChange={(e) =>
                  setConfirmPassword(e.target.value)
                }
                required
              />
            </Field>

            <Field className="space-y-3 pt-2">

              <Button
                type="submit"
                className="w-full"
                disabled={
                  loading || googleLoading
                }
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

              <Button
                variant="outline"
                type="button"
                className="w-full"
                onClick={handleGoogleSignup}
                disabled={
                  loading || googleLoading
                }
              >
                {googleLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  "Sign up with Google"
                )}
              </Button>

              <FieldDescription className="text-center text-sm">
                Already have an account?{" "}
                <a
                  href="/login"
                  className="underline hover:text-foreground"
                >
                  Sign in
                </a>
              </FieldDescription>

            </Field>

          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  );
}