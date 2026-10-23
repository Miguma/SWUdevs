"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  Menu,
  X,
  HelpCircle,
  Info,
  FileText,
  LogIn,
  UserPlus,
  LogOut,
  User as UserIcon,
} from "lucide-react";
import { useAuth } from "@/components/AuthProvider";

const navLinks = [
  { href: "/#start", label: "Tool" },
  { href: "/what-is", label: "What is this" },
  { href: "/how-it-works", label: "How it works" },
] as const;

export function LandingNav() {
  const { user, loading: authLoading, signOut } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Close menu on Escape key press
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
        buttonRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  // Prevent background scroll when mobile menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const closeMenu = () => setIsOpen(false);

  return (
    <div className="flex items-center">
      {/* Desktop Navigation */}
      <nav
        className="hidden items-center gap-5 font-brand text-[12px] font-medium text-muted-foreground sm:flex"
        aria-label="Landing"
      >
        {navLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="border-b border-transparent pb-0.5 transition-colors hover:border-primary hover:text-foreground"
          >
            {link.label}
          </Link>
        ))}

        <span className="h-4 w-px bg-border/70" aria-hidden="true" />

        {/* Desktop Account */}
        {user ? (
          <div className="flex items-center gap-3">
            <span
              className="max-w-[140px] truncate text-[11px] text-muted-foreground"
              title={user.email ?? "Signed in"}
            >
              {user.email}
            </span>
            <button
              type="button"
              onClick={() => void signOut()}
              className="border-b border-transparent pb-0.5 transition-colors hover:border-primary hover:text-foreground cursor-pointer"
            >
              Sign out
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <Link
              href="/sign-in"
              className="border-b border-transparent pb-0.5 transition-colors hover:border-primary hover:text-foreground"
            >
              Sign in
            </Link>
            <Link
              href="/sign-up"
              className="rounded-full border border-primary/40 bg-primary-light/50 px-3 py-1 font-semibold text-primary transition-colors hover:bg-primary-light"
            >
              Sign up
            </Link>
          </div>
        )}
      </nav>

      {/* Mobile Hamburger Button */}
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label={isOpen ? "Close navigation menu" : "Open navigation menu"}
        aria-expanded={isOpen}
        aria-controls="mobile-navigation-menu"
        className="tap-icon inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border/80 bg-card text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 sm:hidden"
      >
        {isOpen ? (
          <X className="h-5 w-5" aria-hidden="true" />
        ) : (
          <Menu className="h-5 w-5" aria-hidden="true" />
        )}
      </button>

      {/* Mobile Navigation Dropdown & Backdrop */}
      {/* Backdrop */}
      <div
        className={`fixed inset-0 top-[70px] z-30 bg-black/40 backdrop-blur-xs transition-opacity duration-200 sm:hidden ${
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={closeMenu}
        aria-hidden="true"
      />

      {/* Dropdown Menu Panel */}
      <div
        ref={menuRef}
        id="mobile-navigation-menu"
        role="dialog"
        aria-modal="true"
        aria-label="Mobile navigation"
        className={`fixed inset-x-0 top-[70px] z-40 max-h-[calc(100vh-70px)] overflow-y-auto border-b border-border bg-card/98 px-5 py-6 shadow-2xl backdrop-blur-md transition-all duration-200 ease-out sm:hidden ${
          isOpen
            ? "translate-y-0 opacity-100"
            : "-translate-y-2 opacity-0 pointer-events-none"
        }`}
      >
        <div className="flex flex-col gap-6 font-brand">
          {/* Section 1: Navigation (Prioritizing Understanding First) */}
          <div className="space-y-1.5">
            <p className="px-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground/80">
              Navigation
            </p>
            <div className="flex flex-col space-y-1">
              <Link
                href="/what-is"
                onClick={closeMenu}
                className="flex min-h-[44px] items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-primary-light/50 hover:text-primary active:bg-primary-light"
              >
                <HelpCircle className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                <span>What Is This?</span>
              </Link>
              <Link
                href="/how-it-works"
                onClick={closeMenu}
                className="flex min-h-[44px] items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-primary-light/50 hover:text-primary active:bg-primary-light"
              >
                <Info className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                <span>How It Works</span>
              </Link>
              <Link
                href="/#start"
                onClick={closeMenu}
                className="flex min-h-[44px] items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-primary-light/50 hover:text-primary active:bg-primary-light"
              >
                <FileText className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                <span>Meeting Workspace</span>
              </Link>
            </div>
          </div>

          {/* Divider */}
          <div className="h-px w-full bg-border/70" />

          {/* Section 2: Account */}
          <div className="space-y-1.5">
            <p className="px-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground/80">
              Account
            </p>
            <div className="flex flex-col space-y-1.5">
              {user ? (
                <>
                  <div className="flex items-center gap-3 rounded-xl border border-border/80 bg-background/60 p-3 text-xs">
                    <UserIcon className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-foreground" title={user.email}>
                        {user.email}
                      </p>
                      <p className="text-[10px] font-medium text-primary">Signed in</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      closeMenu();
                      void signOut();
                    }}
                    className="flex min-h-[44px] w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-danger-light/50 hover:text-danger active:bg-danger-light cursor-pointer"
                  >
                    <LogOut className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                    <span>Sign Out</span>
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/sign-in"
                    onClick={closeMenu}
                    className="flex min-h-[44px] items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-primary-light/50 hover:text-primary active:bg-primary-light"
                  >
                    <LogIn className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                    <span>Sign In</span>
                  </Link>
                  <Link
                    href="/sign-up"
                    onClick={closeMenu}
                    className="flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-primary/40 bg-primary-light/50 px-3 py-2 text-sm font-semibold text-primary transition-colors hover:bg-primary-light active:bg-primary-light/80"
                  >
                    <UserPlus className="h-4 w-4 shrink-0" aria-hidden="true" />
                    <span>Sign Up</span>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
