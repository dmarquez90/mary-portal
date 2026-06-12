# ADU Referral Tracking Portal

A referral tracking system for ADU (Accessory Dwelling Unit) consultations.
Independent sales agents share unique referral links with prospects. When a
prospect submits the form, the referral is recorded automatically — no manual
entry, no disputes over who referred whom.

**Stack:** Next.js 14 (App Router) · Supabase (Auth, Postgres, RLS, Realtime,
Edge Functions) · TypeScript (strict) · Tailwind CSS

---

## How it works

| Role | Access |
| --- | --- |
| **Prospect** | No login. Opens `/ref/<CODE>`, submits the consultation form. The lead is stored with the agent attached. |
| **Agent** | Logs in at `/login` → `/agent`. Sees only their own leads and commissions, plus their referral link with copy-to-clipboard. Read-only on lead status. |
| **Admin** | Logs in at `/login` → `/admin`. Sees everything: dashboard stats, all leads (live via Supabase Realtime), commissions workflow, agent management, agent creation. |

### Commission auto-trigger

When an admin changes a lead's status to **Contract Signed**, the server-side
API route `PATCH /api/leads/:id/status` creates a commission for the lead's
agent (`amount = agent.commission_per_contract`, status `pending`) — exactly
once per lead. Duplicates are impossible by construction:

1. The route checks for an existing commission before inserting.
2. A **unique index on `commissions.lead_id`** guarantees it at the database
   level, even under concurrent requests (unique-violation races are treated
   as success).

Admins then move commissions `pending → approved → paid` from the
Commissions page.

---

## Project structure

```
src/
  middleware.ts                  # Session refresh + auth gate for /admin, /agent
  app/
    page.tsx                     # Landing (redirects logged-in users to their portal)
    login/page.tsx               # Email/password login, role-based redirect
    ref/[code]/page.tsx          # PUBLIC referral capture page
    api/leads/[id]/status/route.ts  # Admin-only status update + commission auto-trigger
    admin/                       # Admin portal (layout enforces admin role)
      page.tsx                   #   Dashboard (stats + latest leads)
      leads/page.tsx             #   All leads, realtime, filters, status dropdown
      commissions/page.tsx       #   Approve / mark paid, filter by status
      agents/page.tsx            #   Create agent, stats, activate/deactivate
    agent/                       # Agent portal (layout enforces agent role + active status)
      page.tsx                   #   Dashboard (stats + referral link)
      leads/page.tsx             #   Own leads (read-only)
      commissions/page.tsx       #   Own commissions
  components/                    # UI components (tables, forms, shell, badges…)
  lib/
    supabase/client.ts           # Browser client (@supabase/ssr)
    supabase/server.ts           # Server Components / Route Handler client
    types.ts                     # Shared domain types
supabase/
  migrations/                    # Full SQL schema + RLS (already applied)
  functions/create-agent/        # Edge Function: admin-only agent creation
  functions/bootstrap-admin/     # Edge Function: one-time first-admin bootstrap
```

---

## Setup

### 1. Environment variables

Copy `.env.example` to `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT-REF.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

> **Where is `SUPABASE_SERVICE_ROLE_KEY`?** This app never needs it at
> runtime. The only privileged operation (creating agent accounts) runs inside
> the `create-agent` **Supabase Edge Function**, where Supabase injects the
> service role key automatically. The Next.js server uses the caller's own
> session + RLS for everything else. This keeps the service key out of your
> hosting provider entirely. (The variable is listed in `.env.example` as an
> optional slot in case you later add server-side admin scripts.)

This repo's `.env.local` is already filled in for the **Mary-Portal**
Supabase project (`cawbihvcmvvyohdqbsmw`), where the schema and Edge
Functions are already deployed — so for this project you can skip straight
to **Run**.

### 2. Database (fresh project only)

Run the SQL in
[`supabase/migrations/20260611_adu_referral_portal_init.sql`](supabase/migrations/20260611_adu_referral_portal_init.sql)
in the Supabase SQL editor. It creates:

- `profiles`, `leads`, `commissions` tables (+ indexes, + unique
  `commissions.lead_id`)
- `is_admin()`, `get_agent_by_ref_code()`, `is_valid_referral()` helper
  functions (SECURITY DEFINER)
- All RLS policies (see below)
- Adds `leads` to the `supabase_realtime` publication

### 3. Edge Functions (fresh project only)

```bash
supabase functions deploy create-agent
supabase functions deploy bootstrap-admin
```

### 4. First admin account

`POST` once to the `bootstrap-admin` function (it permanently disables itself
as soon as one admin exists):

```bash
curl -X POST "https://YOUR-PROJECT-REF.supabase.co/functions/v1/bootstrap-admin" \
  -H "Authorization: Bearer YOUR-ANON-KEY" \
  -H "apikey: YOUR-ANON-KEY" \
  -H "Content-Type: application/json" \
  -d '{"full_name":"Your Name","email":"you@example.com","password":"a-strong-password"}'
```

> For the Mary-Portal project this is already done: the admin is
> **deybi911@gmail.com** (sign in with that account's existing password).

### 5. Run

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # production build
```

---

## Day-to-day usage

1. **Admin** signs in → **Agents** → *Create new agent* (name, email,
   password, ref code like `CARLOS-001`, commission amount).
2. Give the agent their login and their link:
   `https://yourdomain.com/ref/CARLOS-001` (agents also see it on their
   dashboard with a copy button).
3. Prospects submit the form → lead appears **instantly** on the admin Leads
   page (Realtime) and in the agent's portal.
4. Admin works the lead: `New → Contacted → In Progress → Contract Signed`
   (or `Lost`). On *Contract Signed* the commission is created automatically.
5. Admin approves and later marks the commission **paid**; the agent watches
   the status from their portal.

Invalid or deactivated referral codes show a friendly *“Invalid referral
link”* page; deactivated agents also lose portal access (with a clear notice)
until reactivated.

---

## Security model (RLS)

All three tables have Row Level Security **enabled**. The browser only ever
holds the anon key + the user's own session.

| Table | anon (public) | agent | admin |
| --- | --- | --- | --- |
| `profiles` | nothing (lookup only via `get_agent_by_ref_code()` RPC, which exposes name + code of *active agents* only) | SELECT own row | SELECT / INSERT / UPDATE all |
| `leads` | INSERT only, and only with `status='new'` **and** a matching active agent + ref code (`is_valid_referral()`) — forged agent/code combinations are rejected | SELECT own rows | SELECT / UPDATE all |
| `commissions` | nothing | SELECT own rows | ALL |

Extra hardening:

- `is_admin()` is SECURITY DEFINER, avoiding recursive policy evaluation.
- Agents cannot change lead status (no UPDATE policy) — verified by test.
- Realtime delivery respects RLS: only admins receive the lead INSERT stream.
- One commission per lead enforced by a unique index (race-proof).
- `create-agent` verifies the **caller's JWT is an admin** before doing
  anything, and rolls back the auth user if the profile insert fails.
- `bootstrap-admin` refuses to run once any admin profile exists.

---

## Verified end-to-end (2026-06-11)

The following flows were exercised against the live Supabase project and the
running app, then all test data was removed:

- Admin login → role redirect to `/admin`
- Agent creation through the `create-agent` Edge Function (UI → function → auth user + profile)
- Public form at `/ref/<code>` (case-insensitive lookup) → lead insert as anon
- Invalid code → “Invalid referral link” page
- Forged `agent_id`/`ref_code` insert rejected by RLS
- Lead status → *Contract Signed* → commission auto-created ($ from agent's profile)
- Status flipped away and back → **no duplicate commission**
- Commission `pending → approved → paid` from the admin UI
- Agent portal: own-data-only stats, read-only leads, referral link
- Agent blocked from `/admin`; agent UPDATE on leads has no effect
- Realtime: lead inserted from outside appeared in the open admin Leads table without refresh
