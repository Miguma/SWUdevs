import React from "react";
import Link from "next/link";
import { ArrowLeft } from "@/components/icons";
import { Brand } from "@/components/Brand";

type InfoPageProps = {
  title: string;
  intro: React.ReactNode;
  children: React.ReactNode;
  /** Use the wider column (for multi-column content such as the steps). */
  wide?: boolean;
};

const legalLinks = [
  { href: "/privacy", label: "Privacy policy" },
  { href: "/terms", label: "Terms of service" },
];

/** Content-page shell for the "What is this" and "How it works" pages.
 *  Mirrors the legal-page shell: sticky brand header with a back link,
 *  narrow reading column, and the shared brand footer. */
export function InfoPage({ title, intro, children, wide = false }: InfoPageProps) {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <header className="sticky top-0 z-20 border-b border-border/70 bg-background/95 backdrop-blur-md">
        <div className="mx-auto flex h-[70px] max-w-6xl items-center justify-between gap-3 px-4 sm:px-8">
          <Brand />
          <Link
            href="/#start"
            className="tap-44-inline inline-flex items-center gap-1.5 font-brand text-[12px] text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
            Back to tool
          </Link>
        </div>
      </header>

      <main
        id="main-content"
        className={`mx-auto w-full flex-1 px-4 py-12 sm:px-8 sm:py-16 ${
          wide ? "max-w-5xl" : "max-w-3xl"
        }`}
      >
        <h1 className="font-brand text-3xl font-semibold tracking-[-0.02em] sm:text-4xl">
          {title}
        </h1>
        <div className="mt-4 max-w-2xl text-[15px] leading-7 text-muted-foreground">
          {intro}
        </div>

        <div className="mt-10">{children}</div>
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-8 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <Brand />
          <div className="flex flex-col gap-3 font-brand text-[11px] text-muted-foreground sm:items-end">
            <nav aria-label="Legal" className="flex items-center gap-4">
              {legalLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="tap-44-link transition-colors hover:text-foreground"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
            <span>
              © {new Date().getFullYear()} Tambayayong. Free and open source.
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
