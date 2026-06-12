import Link from "next/link";
import { redirect } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase/server";

export default async function HomePage() {
  const supabase = createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    if (profile?.role === "admin") redirect("/admin");
    if (profile?.role === "agent") redirect("/agent");
  }

  return (
    <div className="flex min-h-screen flex-col bg-navy-800">
      <header className="flex items-center justify-between px-6 py-5 sm:px-10">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent-500 text-base font-black text-white">
            A
          </span>
          <span className="text-base font-bold text-white">
            ADU <span className="text-accent-400">Portal</span>
          </span>
        </div>
        <Link
          href="/login"
          className="rounded-lg border border-navy-500 px-4 py-2 text-sm font-semibold text-white transition hover:border-accent-400 hover:text-accent-300"
        >
          Sign in
        </Link>
      </header>

      <main className="flex flex-1 items-center justify-center px-6 pb-20">
        <div className="max-w-2xl text-center">
          <p className="mb-4 inline-block rounded-full border border-accent-500/40 bg-accent-500/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-accent-300">
            Referral Tracking Portal
          </p>
          <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
            Every referral counted.
            <span className="block text-accent-400">Every commission earned.</span>
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-navy-200">
            Agents share a unique link. Prospects request their free ADU
            consultation. Referrals are recorded automatically — no manual
            entry, no disputes.
          </p>
          <div className="mt-8">
            <Link href="/login" className="btn-primary px-6 py-3 text-base">
              Sign in to your portal
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
