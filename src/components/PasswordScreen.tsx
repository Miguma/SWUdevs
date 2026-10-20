"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { ArrowLeft, ArrowRight, LockKeyhole, Mail } from "lucide-react";
import { Brand } from "@/components/Brand";
import { createClient } from "@/lib/supabase/client";

export function PasswordScreen({ mode }: { mode: "request" | "update" }) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const isUpdate = mode === "update";

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage("");
    setError("");
    const supabase = createClient();
    if (!supabase) {
      setError("Account access is not configured yet.");
      return;
    }
    const form = new FormData(event.currentTarget);
    setSubmitting(true);
    try {
      if (isUpdate) {
        const { error: updateError } = await supabase.auth.updateUser({
          password: String(form.get("password") ?? ""),
        });
        if (updateError) throw updateError;
        router.replace("/");
        router.refresh();
      } else {
        const email = String(form.get("email") ?? "").trim();
        const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
        });
        if (resetError) throw resetError;
        setMessage("Check your email for a secure password reset link.");
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The request failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="mx-auto flex w-full max-w-5xl items-center justify-between px-5 py-6 sm:px-8">
        <Brand />
        <Link href="/sign-in" className="inline-flex items-center gap-2 text-sm font-semibold text-primary">
          <ArrowLeft className="h-4 w-4" /> Back to sign in
        </Link>
      </header>
      <main className="mx-auto flex max-w-lg px-5 py-16 sm:px-8">
        <section className="w-full rounded-[1.75rem] border border-border bg-white p-7 shadow-[0_12px_60px_-30px_rgba(23,43,36,0.22)] sm:p-10">
          <div className="mb-6 flex h-11 w-11 items-center justify-center rounded-xl bg-primary-light text-primary">
            <LockKeyhole className="h-5 w-5" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">{isUpdate ? "Choose a new password" : "Reset your password"}</h1>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            {isUpdate ? "Use at least 12 characters for your new password." : "We’ll send a secure reset link to your email address."}
          </p>
          <form onSubmit={submit} className="mt-7 space-y-5">
            {isUpdate ? (
              <div>
                <label htmlFor="new-password" className="auth-label">New password</label>
                <div className="auth-input-wrap"><LockKeyhole className="h-4 w-4 text-muted-foreground" /><input id="new-password" name="password" type="password" autoComplete="new-password" minLength={12} maxLength={128} required className="auth-input" /></div>
              </div>
            ) : (
              <div>
                <label htmlFor="reset-email" className="auth-label">Email address</label>
                <div className="auth-input-wrap"><Mail className="h-4 w-4 text-muted-foreground" /><input id="reset-email" name="email" type="email" autoComplete="email" required className="auth-input" /></div>
              </div>
            )}
            {message && <p role="status" className="rounded-xl border border-primary/20 bg-primary-light p-3 text-sm text-primary">{message}</p>}
            {error && <p role="alert" className="rounded-xl border border-danger/20 bg-danger-light p-3 text-sm text-danger">{error}</p>}
            <button type="submit" disabled={submitting} className="ui-button-primary w-full justify-center">
              {submitting ? "Please wait…" : isUpdate ? "Update password" : "Send reset link"}<ArrowRight className="h-4 w-4" />
            </button>
          </form>
        </section>
      </main>
    </div>
  );
}
