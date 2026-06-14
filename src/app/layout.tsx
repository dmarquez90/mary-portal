import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Mary Portal",
    template: "%s | Mary Portal",
  },
  description:
    "Referral tracking portal for Mary Sales consultations — agents share links, leads are tracked automatically.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="min-h-screen font-sans">{children}</body>
    </html>
  );
}
