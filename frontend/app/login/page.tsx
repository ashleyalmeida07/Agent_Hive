"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { Mail, Lock, ArrowRight } from "lucide-react"
import { AuthLayout } from "@/components/auth/auth-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

export default function LoginPage() {
  const router = useRouter()
  const [role, setRole] = useState<"client" | "freelancer">("client")

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    router.push(role === "client" ? "/dashboard" : "/freelancer")
  }

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to your AgentHive workspace."
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div className="grid grid-cols-2 gap-2 rounded-xl border border-border bg-secondary/40 p-1">
          {(["client", "freelancer"] as const).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRole(r)}
              className={cn(
                "rounded-lg py-2 text-sm font-medium capitalize transition-colors",
                role === r
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {r === "client" ? "Client" : "Freelancer"}
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="email">Email</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="email"
              type="email"
              required
              placeholder="you@company.com"
              className="pl-9"
              defaultValue="demo@agenthive.com"
            />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <Link href="#" className="text-xs text-primary hover:underline">
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="password"
              type="password"
              required
              placeholder="••••••••"
              className="pl-9"
              defaultValue="password"
            />
          </div>
        </div>

        <Button type="submit" size="lg" className="mt-1 w-full rounded-xl">
          Sign in
          <ArrowRight className="size-4" />
        </Button>

        <p className="text-center text-sm text-muted-foreground">
          New to AgentHive?{" "}
          <Link href="/signup" className="text-primary hover:underline">
            Create an account
          </Link>
        </p>
      </form>
    </AuthLayout>
  )
}
