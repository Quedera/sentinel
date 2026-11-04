# QUEDERA SENTINEL

> Two-sided consultant marketplace with a controlled contracting workflow.
> Wireframe-to-prototype — Tier 1 UI complete, Tier 2 data layer in progress.

**Source brief:** `~/.openclaw/workspace/sentinel/source/sentinel-wireframes.pdf`
**Brand source:** `~/.openclaw/workspace/sentinel/source/sentinel-logo.jpg`

## What this is

All 18 wireframe screens implemented as routable Next.js pages, plus a Tier 2
data layer: Prisma schema (7 models), pluggable auth / e-signature / storage
providers, and working API routes for search, contract signing and DocuSign
webhooks.

This is **Tier 1 of 3, with Tier 2 plumbing landed**:

1. **Wireframe scaffold** *(complete)* — all 18 screens as clickable routes
   with mock data. Runs with no database.
2. **Working vertical slice** *(in progress)* — real DB (Postgres), pluggable
   auth, real contract storage, real server-side search filtering.
   See [Database setup](#database-setup).
3. **Production MVP** *(not started)* — KYC, full audit trail, e-sign compliance.
   Needs third-party provider accounts.

### Provider matrix

Swapped via env var, no code change:

| Layer | Provider(s) | Env var |
|---|---|---|
| Auth | `noop` / `nextauth` / `entra` | `AUTH_PROVIDER` |
| E-signature | `mock` / `docusign` | `EIG_PROVIDER` |
| Contract storage | `local` / `azureblob` | `CONTRACT_STORAGE` |

`noop` accepts any email + any non-empty password and auto-creates a stub user
row. **Never use in production.**

## Tech stack

- **Next.js 14** (App Router) + **TypeScript**
- **Tailwind CSS** with a custom palette (QUEDERA navy + SENTINEL green)
- **Inter** font
- **Prisma 5** + **Postgres 16** — 7 models, engagement state machine per brief §15
- **DocuSign eSignature** SDK (`docusign-esign`) for the contract-signing path
- Mock data in `lib/mock-data.ts` (Tier 1 fallback); seeded DB data via `prisma/seed.js`
- No external UI libraries — everything is hand-rolled to keep the install
  footprint small

## Running it

### UI only (no database)

```bash
cd ~/.openclaw/workspace/sentinel
npm install
npm run dev
# → http://localhost:3000
```

### With the database

See [Database setup](#database-setup), then `npm run dev`.

For a production build:

```bash
npm run build
npm run start
```

> **Port note:** `3000` and `3001` are already taken on `openclaw130`
> (homepage, PULSE frontend). Use `npx next start -p 3002 -H 0.0.0.0`
> to bind SENTINEL on its own port and reach it over the LAN.

## Database setup

```bash
# 1. Postgres on 5433, bound to loopback only (matches DATABASE_URL in .env.example)
docker run -d --name sentinel-pg \
  -p 127.0.0.1:5433:5432 \
  -e POSTGRES_USER=sentinel \
  -e POSTGRES_PASSWORD=sentinel \
  -e POSTGRES_DB=sentinel \
  -e POSTGRES_HOST_AUTH_METHOD=scram-sha-256 \
  postgres:16-alpine

# 2. Env file — Prisma CLI reads .env, NOT .env.local
cp .env.example .env
# set DATABASE_URL="postgresql://sentinel:sentinel@localhost:5433/sentinel"

# 3. Schema + seed
npm run db:migrate      # creates prisma/migrations/ and applies the schema
npm run db:seed         # demo data across all 11 engagement states

# 4. Run
npm run dev
```

Also: `npm run db:reset` (drop + re-migrate + re-seed), `npm run db:studio`
(Prisma Studio on localhost:5555).

> The Postgres port is published to `127.0.0.1` only, and `scram-sha-256` is
> enforced for TCP connections — the container's own loopback stays `trust`,
> which is the postgres image default and never leaves the container.

### Seeded logins

The `noop` auth provider accepts **any** password for a known email:

| Email | Role |
|---|---|
| `admin@quedera.example` | ADMIN |
| `client@abc-corp.example` | CLIENT |
| `jane.smith@example.com` | CONSULTANT |
| `david.jones@example.com` | CONSULTANT |
| `priya.sharma@example.com` | CONSULTANT |
| `elena.volkov@example.com` | CONSULTANT |
| `marcus.reid@example.com` | CONSULTANT (profile incomplete — excluded from search) |

## Routes

### Public / auth
- `/` — Landing (with hero search + clients/consultants CTAs)
- `/login` — Login form
- `/register/consultant` — Consultant registration step 1 (personal details)
- `/register/client` — Client registration

### Consultant onboarding wizard (6 steps)
- `/register/consultant` — Step 1: Personal details
- `/register/consultant/profile` — Step 2: Professional profile
- `/register/consultant/documents` — Step 3: CV & references
- `/register/consultant/skills` — Step 4: Skills & experience
- `/register/consultant/availability` — Step 5: Availability & day rate
- `/register/consultant/review` — Step 6: Review & submit

### Consultant flow
- `/consultant/dashboard` — Profile completeness + contract requests
- `/consultant/contract/[id]` — Contract review (5-day countdown)
- `/consultant/contract/[id]/sign` — E-signature
- `/consultant/confirm/[id]` — Engagement confirmation

### Client flow
- `/client/search` — Search filter form
- `/client/results` — Search results
- `/client/consultant/[id]` — Client-facing consultant profile
- `/client/hire/[id]` — Stage 1: Hire request
- `/client/contract/[id]` — Stage 2: Contract upload
- `/client/dashboard` — Active engagements + pending requests

### Admin
- `/admin` — Admin home (consultant counts + recent activity)
- `/admin/consultants` — Consultant review table
- `/admin/audit` — Audit trail

## Project structure

```
sentinel/
├── app/                    # Next.js App Router pages
│   ├── page.tsx            # Landing
│   ├── login/
│   ├── register/
│   ├── consultant/
│   ├── client/
│   └── admin/
├── components/             # Shared React components
│   ├── Header.tsx          # Top nav with QUEDERA / SENTINEL logo lockup
│   ├── StepIndicator.tsx   # Onboarding wizard stepper
│   ├── ConsultantCard.tsx  # Consultant summary card
│   ├── AvailabilityCalendar.tsx
│   ├── StatusBadge.tsx
│   ├── EngagementRow.tsx
│   └── PageHeader.tsx
├── lib/
│   ├── types.ts            # EngagementStatus, Consultant, Client, AuditEvent
│   ├── mock-data.ts        # Sample consultants, engagements, audit events
│   ├── db.ts               # Prisma singleton (survives Next.js HMR)
│   ├── api/contract.ts     # Shared API request/response contracts
│   ├── auth/               # Pluggable auth (noop | nextauth | entra)
│   ├── eig/                # Pluggable e-signature (mock | docusign)
│   └── storage/            # Pluggable contract storage (local | azureblob)
├── prisma/
│   ├── schema.prisma       # 7 models + engagement state machine
│   └── seed.js             # Local dev seed — all 11 engagement states
├── scripts/
│   └── smoke-test-sign.js  # DocuSign e-signature smoke test
├── public/brand/           # (drop the logo here when ready)
├── app/globals.css         # Tailwind + base styles
├── tailwind.config.ts      # QUEDERA navy + SENTINEL green palette
└── package.json
```

## Brand palette

| Token        | Hex      | Use                       |
|--------------|----------|---------------------------|
| `quedera-navy` | `#0A1F3D` | Primary text, dark CTAs |
| `quedera-ink`  | `#1A2A40` | Body text                |
| `quedera-slate` | `#475569` | Muted/label text        |
| `sentinel`    | `#2EBA8E` | Primary CTAs, brand mark |
| `sentinel-dark` | `#1F9D78` | Hover / accent          |
| `sentinel-tint` | `#E5F8F1` | Soft backgrounds, badges |

## Open questions

**Locked** (Craig, 2026-10-18):

- Positioning — "two-sided marketplace"
- E-signature — **DocuSign**
- Identity verification — at registration, on signing the **Sentinel Service Confirmation**
- Money flow — **invoicing**
- Disputes / mid-engagement cancellation — contract termination penalty, both sides
- Profile completeness — pure UX, weighted, soft nudge, no gating
- Notifications — **email**
- Search ranking — most-recently-active, then by rating (refine post-launch)
- Owner — Craig. Target — **November 2026**

**Still open:**

1. **SENTINEL vs DUET relationship** — same brand family / sibling / standalone?
2. **Hosting target** — Azure (if DUET-family) / Vercel / something else?
3. **Contract storage** — `local` is wired; `azureblob` needs a connection string

## Audit trail

The wireframe brief explicitly calls out an audit trail for every state change.
`AuditEvent` is a first-class model with 25 action types, and the seed writes
real events (profile created, CV uploaded, hire requested, signed, search
performed). The read-only view lives at `/admin/audit`.

Still to do: emit `SEARCH_PERFORMED` from the live search route when the caller
is signed in (currently a TODO in the route handler).

## Not yet wired

- **Identity verification** — Sentinel Service Confirmation at registration
- **Invoicing** — no invoice model in the schema
- **Termination penalties** — no fields for dispute / cancellation handling
- **Email notifications** — no mailer wired
- **Rating tiebreak** — search orders by `createdAt desc` only
- **Profile completeness weighting** — the dashboard shows a static figure
- **Real e-signature** — DocuSign SDK is integrated but needs sandbox credentials
  (`scripts/smoke-test-sign.js` exercises it); the typed-name fallback remains in the UI
- **Contract storage** — `local` provider only

All of these are Tier 2 / Tier 3 concerns.
