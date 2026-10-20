import type { Metadata } from "next";
import { PasswordScreen } from "@/components/PasswordScreen";

export const metadata: Metadata = { title: "Reset password · Tambayayong" };
export default function ForgotPasswordPage() { return <PasswordScreen mode="request" />; }
