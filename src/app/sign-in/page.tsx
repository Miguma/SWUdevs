import type { Metadata } from "next";
import { AuthScreen } from "@/components/AuthScreen";
export const metadata: Metadata = { title: "Sign in · Tambayayong" };
export default function SignInPage() {
  return <AuthScreen key="sign-in" mode="sign-in" />;
}
