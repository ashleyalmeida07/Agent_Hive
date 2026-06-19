"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { Mail, Lock, User, Briefcase, Hammer, ArrowRight, Check } from "lucide-react"
import { AuthLayout } from "@/components/auth/auth-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

const roles = [
  {
    id: "client" as const,
    title: "I want work done",
    desc: "Post tasks and hire agents or freelancers.",
    icon: Briefcase,
  },
  {
    id: "freelancer" as const,
    title: "I want to earn",
    desc: "Find tasks and get paid for your skills.",
    icon: Hammer,
  },
]

export default function SignupPage() {
  const router = useRouter()
  const [role, setRole] = useState<"client" | "freelancer">("client")

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    router.push(role === "client" ? "/dashboard" : "/freelancer")
  }

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Join AgentHive in less than a minute."
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <Label>I&apos;m joining as</Label>
          <div className="grid gap-3 sm:grid-cols-2">
            {roles.map((r) => {
              const active = role === r.id
              return (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setRole(r.id)}
                  className={cn(
                    "relative rounded-xl border p-4 text-left transition-colors",
                    active
                      ? "border-primary bg-primary/10"
                      : "border-border bg-secondary/40 hover:border-primary/40",
                  )}
                >
                  {active && (
                    <span className="absolute right-3 top-3 flex size-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                      <Check className="size-3" />
                    </span>
                  )}
                  <span
                    className={cn(
                      "flex size-9 items-center justify-center rounded-lg",
                      active
                        ? "bg-primary/20 text-primary"
                        : "bg-secondary text-muted-foreground",
                    )}
                  >
                    <r.icon className="size-4.5" />
                  </span>
                  <p className="mt-3 text-sm font-semibold">{r.title}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{r.desc}</p>
                </button>
              )
            })}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="name">Full name</Label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input id="name" required placeholder="Jane Doe" className="pl-9" />
          </div>
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
            />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="password"
              type="password"
              required
              placeholder="Create a password"
              className="pl-9"
            />
          </div>
        </div>

        <Button type="submit" size="lg" className="mt-1 w-full rounded-xl">
          Create account
          <ArrowRight className="size-4" />
        </Button>

        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href="/login" className="text-primary hover:underline">
            Sign in
          </Link>
        </p>
      </form>
    </AuthLayout>
  )
}
