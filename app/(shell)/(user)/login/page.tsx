"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
} from "firebase/auth"
import { auth } from "@/lib/firebase"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"

export default function LoginPage({
  className,
}: {
  className?: string
}) {

  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()

    toast.promise(
      signInWithEmailAndPassword(auth, email, password),
      {
        loading: "Logging you in...",
        success: () => {
          router.push("/")
          return "Welcome back 👋"
        },
        error: (err: any) =>
          err?.message || "Invalid email or password",
      }
    )
  }

  async function handleGoogleLogin() {
    const provider = new GoogleAuthProvider()

    toast.promise(
      signInWithPopup(auth, provider),
      {
        loading: "Signing in with Google...",
        success: () => {
          router.push("/")
          return "Logged in with Google 👋"
        },
        error: (err: any) =>
          err?.message || "Google login failed",
      }
    )
  }

  return (
    <div
      className={cn(
        "flex min-h-screen items-center justify-center px-4 py-12",
        className
      )}
    >
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-xl md:text-2xl">
            Login to your account
          </CardTitle>
          <CardDescription>
            Enter your email below to login to your account
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleLogin} className="space-y-6">
            <FieldGroup className="space-y-4">

              <Field>
                <FieldLabel>Email</FieldLabel>
                <Input
                  type="email"
                  placeholder="m@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </Field>

              <Field>
                <FieldLabel>Password</FieldLabel>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </Field>

              <Field className="space-y-3 pt-2">
                <Button
                  type="submit"
                  className="w-full"
                >
                  Login
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={handleGoogleLogin}
                >
                  Continue with Google
                </Button>

                <FieldDescription className="text-center text-sm">
                  Don&apos;t have an account?{" "}
                  <a
                    href="/signup"
                    className="underline hover:text-foreground"
                  >
                    Sign up
                  </a>
                </FieldDescription>
              </Field>

            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}