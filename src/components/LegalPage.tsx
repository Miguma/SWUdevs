import React from "react";
import Link from "next/link";
import { ArrowLeft } from "@/components/icons";
import { Brand } from "@/components/Brand";

export type LegalSection = {
  heading: string;
  paragraphs?: React.ReactNode[];
  bullets?: React.ReactNode[];
};

type LegalPageProps = {
  title: string;
  updated: string;
  intro: React.ReactNode;
  sections: LegalSection[];
  current: "privacy" | "terms";
};

const legalLinks = [
  { href: "/privacy", label: "Privacy policy", key: "privacy" },
  { href: "/terms", label: "Terms of service", key: "terms" },
] as const;

const linkClass =
  "text-foreground underline decoration-border underline-offset-4 transition-colors hover:text-primary";

export function LegalLink({
  href,
  children,
  external = false,
}: {
  href: string;
  children: React.ReactNode;
  external?: boolean;
}) {
  if (external) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={linkClass}
      >
        {children}
      </a>
    );
  }

  return (
    <Link href={href} className={linkClass}>
      {children}
    </Link>
  );
}

export function LegalCode({ children }: { children: React.ReactNode }) {
  return (
    <code className="font-brand text-[13px] font-medium text-foreground">
      {children}
    </code>
  );
}

export function LegalPage({
  title,
  updated,
  intro,
  sections,
  current,
}: LegalPageProps) {
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
        className="mx-auto w-full max-w-3xl flex-1 px-4 py-12 sm:px-8 sm:py-16"
      >
        <p className="font-brand text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          Legal
        </p>
        <h1 className="mt-2 font-brand text-3xl font-semibold tracking-[-0.02em] sm:text-4xl">
          {title}
        </h1>
        <p className="mt-3 font-brand text-[11px] text-muted-foreground">
          Last updated {updated}
        </p>
        <div className="mt-6 text-[15px] leading-7 text-muted-foreground">
          {intro}
        </div>

        <div className="mt-10">
          {sections.map((section, index) => {
            const headingId = `legal-section-${index}`;

            return (
              <section
                key={section.heading}
                aria-labelledby={headingId}
                className={
                  index === 0
                    ? ""
                    : "mt-10 border-t border-border pt-8"
                }
              >
                <h2
                  id={headingId}
                  className="font-brand text-[16px] font-semibold tracking-[-0.01em]"
                >
                  {index + 1}. {section.heading}
                </h2>
                {section.paragraphs?.map((paragraph, paragraphIndex) => (
                  <p
                    key={paragraphIndex}
                    className="mt-3 text-sm leading-6 text-muted-foreground"
                  >
                    {paragraph}
                  </p>
                ))}
                {section.bullets && (
                  <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-muted-foreground marker:text-primary">
                    {section.bullets.map((bullet, bulletIndex) => (
                      <li key={bulletIndex}>{bullet}</li>
                    ))}
                  </ul>
                )}
              </section>
            );
          })}
        </div>
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-8 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <Brand />
          <div className="flex flex-col gap-3 font-brand text-[11px] text-muted-foreground sm:items-end">
            <nav aria-label="Legal" className="flex items-center gap-4">
              {legalLinks.map((link) => (
                <Link
                  key={link.key}
                  href={link.href}
                  aria-current={current === link.key ? "page" : undefined}
                  className={`tap-44-link transition-colors hover:text-foreground ${
                    current === link.key ? "text-foreground" : ""
                  }`}
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
