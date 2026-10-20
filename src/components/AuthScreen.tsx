"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  UserRound,
} from "lucide-react";
import { Brand } from "./Brand";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/components/AuthProvider";

export function AuthScreen({ mode }: { mode: "sign-in" | "sign-up" }) {
  const isSignUp = mode === "sign-up";
  const router = useRouter();
  const { configured } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage("");
    setError("");
    const supabase = createClient();
    if (!supabase) {
      setError("Account access needs the Supabase project URL and publishable key.");
      return;
    }
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "").trim();
    const password = String(form.get("password") ?? "");
    setSubmitting(true);
    try {
      if (isSignUp) {
        const fullName = String(form.get("fullName") ?? "").trim();
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName },
            emailRedirectTo: `${window.location.origin}/auth/callback?next=/`,
          },
        });
        if (signUpError) throw signUpError;
        if (!data.session) {
          setMessage("Check your email to confirm your account, then sign in.");
          return;
        }
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError) throw signInError;
      }
      router.replace("/");
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Account access failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="mx-auto flex w-full max-w-7xl flex-wrap items-center justify-between gap-4 px-5 py-6 sm:px-8">
        <Brand />
        <Link
          href="/#meeting-workspace"
          className="inline-flex items-center gap-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-primary"
        >
          <ArrowLeft className="h-4 w-4" /> Continue as guest
        </Link>
      </header>
      <main
        id="main-content"
        className="mx-auto flex w-full max-w-6xl flex-1 items-center px-4 py-6 sm:px-8 sm:py-10"
      >
        <div className="grid w-full overflow-hidden rounded-[1.75rem] border border-border bg-white shadow-[0_12px_60px_-30px_rgba(23,43,36,0.22)] lg:grid-cols-[1fr_0.95fr]">
          <section
            aria-labelledby="auth-title"
            className="px-6 py-9 sm:px-12 sm:py-12 lg:px-14"
          >
            <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary-light px-3 py-1 text-[11px] font-semibold text-primary">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" /> Secure account
            </div>
            <h1
              id="auth-title"
              className="text-3xl font-bold tracking-tight sm:text-4xl"
            >
              {isSignUp ? "Make room for better teamwork." : "Welcome back."}
            </h1>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              {isSignUp
                ? "Your next great idea deserves a team that’s ready to act."
                : "A little clarity goes a long way. Let’s pick up where your team left off."}
            </p>
            <div
              className="mt-7 flex rounded-xl bg-background p-1 text-sm font-semibold"
              aria-label="Account access"
            >
              <Link
                href="/sign-in"
                aria-current={!isSignUp ? "page" : undefined}
                className={`flex-1 rounded-lg px-4 py-2.5 text-center ${!isSignUp ? "bg-white text-primary shadow-sm" : "text-muted-foreground hover:text-primary"}`}
              >
                Sign in
              </Link>
              <Link
                href="/sign-up"
                aria-current={isSignUp ? "page" : undefined}
                className={`flex-1 rounded-lg px-4 py-2.5 text-center ${isSignUp ? "bg-white text-primary shadow-sm" : "text-muted-foreground hover:text-primary"}`}
              >
                Sign up
              </Link>
            </div>
            <form
              className="mt-7 space-y-5"
              onSubmit={handleSubmit}
            >
              {isSignUp && (
                <div>
                  <label htmlFor="full-name" className="auth-label">
                    Full name
                  </label>
                  <div className="auth-input-wrap">
                    <UserRound className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <input
                      id="full-name"
                      name="fullName"
                      type="text"
                      autoComplete="name"
                      placeholder="Your name"
                      required
                      maxLength={100}
                      className="auth-input"
                    />
                  </div>
                </div>
              )}
              <div>
                <label htmlFor="email" className="auth-label">
                  Email address
                </label>
                <div className="auth-input-wrap">
                  <Mail className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    placeholder="you@example.com"
                    required
                    maxLength={254}
                    className="auth-input"
                  />
                </div>
              </div>
              <div>
                <div className="mb-2 flex items-center justify-between gap-2">
                  <label htmlFor="password" className="text-xs font-semibold">
                    Password
                  </label>
                  {!isSignUp && (
                    <Link
                      href="/forgot-password"
                      className="text-xs font-semibold text-primary hover:underline"
                    >
                      Forgot password?
                    </Link>
                  )}
                </div>
                <div className="auth-input-wrap">
                  <LockKeyhole className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete={
                      isSignUp ? "new-password" : "current-password"
                    }
                    placeholder={
                      isSignUp ? "Create a password" : "Enter your password"
                    }
                    required
                    minLength={isSignUp ? 12 : undefined}
                    maxLength={128}
                    aria-describedby={isSignUp ? "password-hint" : undefined}
                    className="auth-input"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                    aria-pressed={showPassword}
                    className="rounded-md p-1.5 text-muted-foreground hover:text-primary"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {isSignUp && (
                  <p
                    id="password-hint"
                    className="mt-2 text-xs text-muted-foreground"
                  >
                    Use at least 12 characters.
                  </p>
                )}
              </div>
              {message && (
                <p
                  role="status"
                  className="rounded-xl border border-primary/20 bg-primary-light p-3.5 text-sm leading-6 text-primary"
                >
                  {message}
                </p>
              )}
              {error && (
                <p role="alert" className="rounded-xl border border-danger/20 bg-danger-light p-3.5 text-sm leading-6 text-danger">
                  {error}
                </p>
              )}
              <button
                type="submit"
                disabled={submitting || !configured}
                className="ui-button-primary w-full justify-center"
              >
                {submitting ? "Please wait…" : isSignUp ? "Create account" : "Sign in"}
                <ArrowRight className="h-4 w-4" />
              </button>
            </form>
            <p className="mt-4 text-center text-xs leading-5 text-muted-foreground">
              {configured
                ? "Your password is handled by Supabase Auth and is never stored in meeting records."
                : "Connect the Tambayayong Supabase project to enable accounts."}
            </p>
            <div className="my-6 flex items-center gap-3 text-[11px] text-muted-foreground">
              <span className="h-px flex-1 bg-border" /> NO ACCOUNT NEEDED TO
              GET STARTED <span className="h-px flex-1 bg-border" />
            </div>
            <Link
              href="/#meeting-workspace"
              className="ui-button-secondary w-full justify-center"
            >
              Continue as guest <ArrowRight className="h-4 w-4" />
            </Link>
          </section>

          <aside className="relative hidden flex-col justify-between overflow-hidden bg-[#173F32] p-10 text-white lg:flex">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -right-28 -top-28 h-80 w-80 rounded-full border border-white/10"
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -bottom-32 -left-24 h-96 w-96 rounded-full border border-white/10"
            />
            <div className="relative">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#B9D8C7]">
                A LITTLE CLARITY. A LOT OF MOMENTUM.
              </p>
              <h2 className="mt-7 text-4xl font-semibold leading-tight tracking-tight">
                Better meetings.
                <br />
                Shared momentum.
              </h2>
              <p className="mt-4 max-w-xs text-sm leading-7 text-[#D0E2D7]">
                For student orgs, community builders, and teams turning good
                conversations into something that matters.
              </p>
            </div>
            <div className="relative my-10 rounded-2xl border border-white/15 bg-white/[0.06] p-5">
              <p className="mb-5 text-[11px] font-medium uppercase tracking-widest text-[#B9D8C7]">
                FROM NOTES TO NEXT STEPS
              </p>
              {[
                "Bring everyone’s ideas together",
                "Know who’s doing what",
                "Leave with a plan you trust",
              ].map((text) => (
                <div
                  key={text}
                  className="my-3.5 flex items-center gap-3 text-sm"
                >
                  <span className="rounded-full bg-[#B9D8C7] p-1 text-[#173F32]">
                    <Check className="h-3 w-3" />
                  </span>
                  {text}
                </div>
              ))}
            </div>
            <div className="relative border-t border-white/15 pt-6">
              <p className="text-2xl font-medium tracking-tight">
                Walay mabilin.
              </p>
              <p className="mt-2 text-xs leading-5 text-[#B9D8C7]">
                No idea—or teammate—left behind.
                <br />
                English + Cebuano. Always human reviewed.
              </p>
            </div>
          </aside>
        </div>
      </main>
      <footer className="px-5 py-6 text-center text-xs text-muted-foreground">
        Made for shared purpose. Built with community in mind.
      </footer>
    </div>
  );
}
