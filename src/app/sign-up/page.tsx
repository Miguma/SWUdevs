import type { Metadata } from "next";
import { AuthScreen } from "@/components/AuthScreen";
export const metadata: Metadata = { title: "Sign up · Tambayayong" };
export default function SignUpPage() {
  return <AuthScreen key="sign-up" mode="sign-up" />;
}
