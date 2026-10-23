import React from "react";
import Link from "next/link";
import { Brand } from "@/components/Brand";
import { LandingNav } from "@/components/LandingNav";
import { Workspace } from "@/components/Workspace";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-border/70 bg-background">
        <div className="mx-auto flex h-[70px] max-w-6xl items-center justify-between gap-3 px-4 sm:px-8">
          <Brand />
          <LandingNav />
        </div>
      </header>

      <main id="main-content">
        <section
          aria-labelledby="workspace-heading"
          className="mx-auto max-w-6xl px-4 pt-10 pb-16 sm:px-8 sm:pt-14 sm:pb-20"
        >
          <h1 id="workspace-heading" className="sr-only">Tambayayong meeting assistant</h1>
          <Workspace />
        </section>
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-8">
          <div className="flex flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
            <div className="max-w-xs">
              <Brand />
            </div>
            <nav
              aria-label="Footer"
              className="flex flex-col items-start gap-3 font-brand text-[12px] text-muted-foreground sm:items-end sm:gap-2.5"
            >
              <span className="font-brand text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground/80">
                Explore
              </span>
              <div className="flex flex-wrap items-center gap-x-5 sm:flex-col sm:items-end sm:gap-2.5">
                <Link href="#start" className="tap-44-link justify-center transition-colors hover:text-foreground">Tool</Link>
                <Link href="/what-is" className="tap-44-link justify-center transition-colors hover:text-foreground">What is this</Link>
                <Link href="/how-it-works" className="tap-44-link justify-center transition-colors hover:text-foreground">How it works</Link>
              </div>
            </nav>
          </div>
          <div className="font-brand mt-10 flex flex-col gap-3 border-t border-border/60 pt-5 text-[11px] text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
            <span>© {new Date().getFullYear()} Tambayayong. Free and open source.</span>
            <nav aria-label="Legal" className="flex items-center gap-4">
              <Link href="/privacy" className="tap-44-link transition-colors hover:text-foreground">Privacy policy</Link>
              <Link href="/terms" className="tap-44-link transition-colors hover:text-foreground">Terms of service</Link>
            </nav>
          </div>
        </div>
      </footer>
    </div>
  );
}
