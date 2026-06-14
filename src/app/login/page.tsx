import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase/server";
import LoginForm from "@/components/LoginForm";

export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage() {
  const supabase = createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const { data: partner } = await supabase
      .from("partners")
      .select("role, status")
      .eq("user_id", user.id)
      .single();
    if (partner && partner.status !== "suspended") {
      redirect(partner.role === "admin" ? "/admin" : "/portal");
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-navy-800">
      <header className="px-6 py-5 sm:px-10">
        <Link href="/" className="inline-flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent-500 text-base font-black text-white">
            M
          </span>
          <span className="text-base font-bold text-white">
            Mary <span className="text-accent-400">Portal</span>
          </span>
        </Link>
      </header>

      <main className="flex flex-1 items-center justify-center px-4 pb-16">
        <div className="w-full max-w-md">
          <div className="card p-8">
            <h1 className="text-2xl font-bold text-navy-800">Welcome back</h1>
            <p className="mb-6 mt-1 text-sm text-slate-500">
              Sign in to your admin or agent portal.
            </p>
            <LoginForm />
          </div>
          <p className="mt-6 text-center text-xs text-navy-300">
            New agent? <Link href="/signup" className="font-semibold text-accent-400 hover:underline">Apply for access</Link>
          </p>
        </div>
      </main>
    </div>
  );
}
