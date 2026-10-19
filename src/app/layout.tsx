import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Tambayayong — From conversation to action. Walay mabilin!",
  description:
    "Open-source bilingual meeting intelligence for student groups, communities, and open-source teams. Transform messy multilingual notes into accountable action plans with local AI.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased bg-background text-foreground min-h-screen flex flex-col">
        {children}
      </body>
    </html>
  );
}
