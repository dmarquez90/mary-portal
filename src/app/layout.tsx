import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "ADU Referral Portal",
    template: "%s | ADU Referral Portal",
  },
  description:
    "Referral tracking portal for ADU consultations — agents share links, leads are tracked automatically.",
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
