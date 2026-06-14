import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Mary Portal",
    template: "%s | Mary Portal",
  },
  description:
    "Agent portal for MARY — manage referral agents and resellers, track referrals, and calculate recurring commissions automatically.",
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
