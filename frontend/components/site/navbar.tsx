'use client'

import { useState } from 'react'
import { Menu, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Logo } from '@/components/site/logo'
import { cn } from '@/lib/utils'

const links = [
  { label: 'How it works', href: '#process' },
  { label: 'Services', href: '#services' },
  { label: 'Benefits', href: '#benefits' },
  { label: 'FAQs', href: '#faqs' },
]

export function Navbar() {
  const [open, setOpen] = useState(false)

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-xl">
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Logo />

        <div className="hidden items-center gap-8 md:flex">
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              {link.label}
            </a>
          ))}
        </div>

        <div className="hidden items-center gap-2 md:flex">
          <Button
            render={<a href="/login" />}
            variant="ghost"
            className="rounded-full px-4"
          >
            Log in
          </Button>
          <Button render={<a href="/signup" />} className="rounded-full px-5">
            Get Started
          </Button>
        </div>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle menu"
          aria-expanded={open}
          className="inline-flex size-9 items-center justify-center rounded-md text-foreground md:hidden"
        >
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </nav>

      <div
        className={cn(
          'overflow-hidden border-t border-border/60 md:hidden',
          open ? 'max-h-96' : 'max-h-0 border-t-0',
          'transition-all duration-300',
        )}
      >
        <div className="flex flex-col gap-1 px-4 py-4">
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className="rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            >
              {link.label}
            </a>
          ))}
          <Button
            render={<a href="/login" onClick={() => setOpen(false)} />}
            variant="outline"
            className="mt-2 rounded-full"
          >
            Log in
          </Button>
          <Button
            render={<a href="/signup" onClick={() => setOpen(false)} />}
            className="rounded-full"
          >
            Get Started
          </Button>
        </div>
      </div>
    </header>
  )
}
