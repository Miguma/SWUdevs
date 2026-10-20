import type { Metadata } from "next";
import { PasswordScreen } from "@/components/PasswordScreen";

export const metadata: Metadata = { title: "Choose a new password · Tambayayong" };
export default function ResetPasswordPage() { return <PasswordScreen mode="update" />; }
