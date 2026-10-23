import React from "react";
import Link from "next/link";

const links = [
  { href: "/#start", label: "Tool" },
  { href: "/what-is", label: "What is this" },
  { href: "/how-it-works", label: "How it works" },
] as const;

export function LandingNav() {
  return (
    <nav
      className="hidden items-center gap-6 font-brand text-[12px] font-medium text-muted-foreground sm:flex"
      aria-label="Landing"
    >
      {links.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className="border-b border-transparent pb-0.5 transition-colors hover:border-primary hover:text-foreground"
        >
          {link.label}
        </Link>
      ))}
    </nav>
  );
}
