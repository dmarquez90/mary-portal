"use client";

import { useEffect, useId, useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { formatDateTime } from "@/lib/format";

interface PendingAgent {
  id: string;
  full_name: string;
  email: string;
  created_at: string;
}

interface NotificationBellProps {
  theme?: "dark" | "light";
}

export default function NotificationBell({ theme = "light" }: NotificationBellProps) {
  const supabase = useMemo(() => createClient(), []);
  const reactId = useId();
  const [pending, setPending] = useState<PendingAgent[]>([]);
  const [open, setOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let active = true;

    async function load() {
      const { data } = await supabase
        .from("profiles")
        .select("id, full_name, email, created_at")
        .eq("role", "agent")
        .eq("status", "pending")
        .order("created_at", { ascending: false });

      if (active) {
        setPending((data ?? []) as PendingAgent[]);
        setLoaded(true);
      }
    }

    load();

    const channel = supabase
      .channel(`admin-pending-agents-${reactId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "profiles" },
        () => load(),
      )
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, [supabase, reactId]);

  const count = pending.length;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`relative rounded-lg p-2 transition ${
          theme === "dark"
            ? "text-navy-100 hover:bg-navy-700/60 hover:text-white"
            : "text-slate-500 hover:bg-slate-100 hover:text-navy-800"
        }`}
        aria-label="Pending agent notifications"
      >
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
        </svg>
        {count > 0 ? (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold leading-none text-white">
            {count > 9 ? "9+" : count}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="absolute right-0 top-full z-30 mt-2 w-72 rounded-lg border border-slate-200 bg-white shadow-lg sm:left-0 sm:right-auto">
          <div className="border-b border-slate-100 px-4 py-3">
            <p className="text-sm font-semibold text-navy-800">Pending approvals</p>
          </div>
          <div className="max-h-72 overflow-y-auto">
            {!loaded ? (
              <p className="px-4 py-4 text-sm text-slate-400">Loading…</p>
            ) : count === 0 ? (
              <p className="px-4 py-4 text-sm text-slate-400">No pending sign-ups.</p>
            ) : (
              pending.map((agent) => (
                <Link
                  key={agent.id}
                  href="/admin/agents"
                  onClick={() => setOpen(false)}
                  className="block border-b border-slate-50 px-4 py-3 transition last:border-b-0 hover:bg-slate-50"
                >
                  <p className="text-sm font-medium text-slate-900">{agent.full_name}</p>
                  <p className="truncate text-xs text-slate-400">{agent.email}</p>
                  <p className="mt-0.5 text-xs text-slate-400">{formatDateTime(agent.created_at)}</p>
                </Link>
              ))
            )}
          </div>
          {count > 0 ? (
            <Link
              href="/admin/agents"
              onClick={() => setOpen(false)}
              className="block px-4 py-2.5 text-center text-xs font-semibold text-accent-600 transition hover:bg-accent-50"
            >
              Review in Agents
            </Link>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
