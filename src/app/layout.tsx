import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AuthProvider } from "@/components/AuthProvider";

export const viewport: Viewport = {
  themeColor: "#f8faf8",
};

export const metadata: Metadata = {
  title: {
    default: "Tambayayong | Meeting notes to action plans",
    template: "Tambayayong | %s",
  },
  applicationName: "Tambayayong",
  description:
    "Turn bilingual meeting notes into reviewed action plans with owners and dates. Free, open source, and private by default.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased bg-background text-foreground min-h-screen flex flex-col">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
