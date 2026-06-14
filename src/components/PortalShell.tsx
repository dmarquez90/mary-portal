"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import SignOutButton from "@/components/SignOutButton";

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
}

const ICONS = {
  dashboard: (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
    </svg>
  ),
  referrals: (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM3.75 12h.007v.008H3.75V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm-.375 5.25h.007v.008H3.75v-.008zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
    </svg>
  ),
  commissions: (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  partners: (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
    </svg>
  ),
  promo: (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.31a10.452 10.452 0 003.926-4.926c.5-1.42.5-2.97 0-4.39M9.568 3l9.581 9.581a2.25 2.25 0 010 3.182l-2.25 2.25M9.568 3H5.25M6 6h.008v.008H6V6z" />
    </svg>
  ),
  payouts: (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
    </svg>
  ),
  training: (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.438 60.438 0 00-.491 6.347A48.62 48.62 0 0112 20.904a48.62 48.62 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.636 50.636 0 00-2.658-.813A59.906 59.906 0 0112 3.493a59.903 59.903 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5" />
    </svg>
  ),
};

const ADMIN_NAV: NavItem[] = [
  { href: "/admin", label: "Dashboard", icon: ICONS.dashboard },
  { href: "/admin/partners", label: "Agents", icon: ICONS.partners },
  { href: "/admin/referrals", label: "Referrals", icon: ICONS.referrals },
  { href: "/admin/commissions", label: "Commissions", icon: ICONS.commissions },
  { href: "/admin/promo-codes", label: "Promo Codes", icon: ICONS.promo },
  { href: "/admin/payouts", label: "Payouts", icon: ICONS.payouts },
  { href: "/admin/training", label: "Training", icon: ICONS.training },
];

const PARTNER_NAV: NavItem[] = [
  { href: "/portal", label: "Dashboard", icon: ICONS.dashboard },
  { href: "/portal/referrals", label: "Referrals", icon: ICONS.referrals },
  { href: "/portal/commissions", label: "Commissions", icon: ICONS.commissions },
  { href: "/portal/promo-codes", label: "Promo Codes", icon: ICONS.promo },
  { href: "/portal/payouts", label: "Payouts", icon: ICONS.payouts },
  { href: "/portal/training", label: "Training", icon: ICONS.training },
];

interface PortalShellProps {
  variant: "admin" | "partner";
  userName: string;
  children: React.ReactNode;
}

export default function PortalShell({ variant, userName, children }: PortalShellProps) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const nav = variant === "admin" ? ADMIN_NAV : PARTNER_NAV;
  const home = variant === "admin" ? "/admin" : "/portal";
  const roleLabel = variant === "admin" ? "Admin" : "Agent";

  const navLinks = (
    <nav className="flex flex-1 flex-col gap-1">
      {nav.map((item) => {
        const active =
          item.href === home ? pathname === home : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setMenuOpen(false)}
            className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
              active
                ? "bg-accent-500/15 text-accent-300"
                : "text-navy-100 hover:bg-navy-700/60 hover:text-white"
            }`}
          >
            {item.icon}
            {item.label}
          </Link>
        );
      })}
    </nav>
  );

  const brand = (
    <Link href={home} className="flex items-center gap-2.5">
      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent-500 text-base font-black text-white">
        M
      </span>
      <span className="text-base font-bold text-white">
        Mary <span className="text-accent-400">Portal</span>
      </span>
    </Link>
  );

  return (
    <div className="min-h-screen lg:flex">
      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 flex-col bg-navy-800 px-4 py-6 lg:flex">
        <div className="mb-8 px-2">{brand}</div>
        {navLinks}
        <div className="mt-auto border-t border-navy-700 pt-4">
          <p className="mb-2 truncate px-3 text-xs font-medium uppercase tracking-wide text-navy-300">
            {userName} · {roleLabel}
          </p>
          <SignOutButton />
        </div>
      </aside>

      {/* Mobile header */}
      <div className="sticky top-0 z-20 flex items-center justify-between bg-navy-800 px-4 py-3 lg:hidden">
        {brand}
        <button
          type="button"
          onClick={() => setMenuOpen((open) => !open)}
          className="rounded-lg p-2 text-navy-100 hover:bg-navy-700"
          aria-label="Toggle menu"
        >
          {menuOpen ? (
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            </svg>
          )}
        </button>
      </div>

      {/* Mobile slide-down menu */}
      {menuOpen ? (
        <div className="fixed inset-x-0 top-[60px] z-10 border-t border-navy-700 bg-navy-800 px-4 pb-6 pt-4 shadow-xl lg:hidden">
          {navLinks}
          <div className="mt-4 border-t border-navy-700 pt-4">
            <p className="mb-2 truncate px-3 text-xs font-medium uppercase tracking-wide text-navy-300">
              {userName} · {roleLabel}
            </p>
            <SignOutButton />
          </div>
        </div>
      ) : null}

      <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-10 lg:py-10">
        {children}
      </main>
    </div>
  );
}
