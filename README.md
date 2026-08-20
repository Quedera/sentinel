# QUEDERA SENTINEL

> Two-sided consultant marketplace with a controlled contracting workflow.
> Wireframe-to-prototype scaffold (Tier 1).

**Source brief:** `~/.openclaw/workspace/sentinel/source/sentinel-wireframes.pdf`
**Brand source:** `~/.openclaw/workspace/sentinel/source/sentinel-logo.jpg`

## What this is

A clickable Next.js scaffold that turns the 18 wireframe screens into routable
pages with mock data. Pure UI — no backend, no real auth, no real file uploads
or e-signature, no persistence. The point is to demo the user flow.

This is **Tier 1** of a three-tier plan:

1. **Wireframe scaffold** *(this)* — Next.js + TypeScript + Tailwind, all 18
   screens as clickable routes, mocked data, no backend. Run locally with
   `npm run dev`.
2. **Working vertical slice** — one critical path end-to-end working with real
   auth, real DB, real contract storage.
3. **Production MVP** — everything wired including KYC, audit trail, e-sig
   compliance. Needs third-party providers.

## Tech stack

- **Next.js 14** (App Router) + **TypeScript**
- **Tailwind CSS** with a custom palette (QUEDERA navy + SENTINEL green)
- **Inter** font
- Mock data in `lib/mock-data.ts`
- No external UI libraries — everything is hand-rolled to keep the install
  footprint small

## Running it

```bash
cd ~/.openclaw/workspace/sentinel
npm install
npm run dev
# → http://localhost:3000
```

For a production build:

```bash
npm run build
npm run start
```

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
│   └── mock-data.ts        # Sample consultants, engagements, audit events
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

## Open questions (still pending)

Blockers for Tier 2 / Tier 3:

1. **Owner** — solo or co-driven with Craig? (Affects whether we share DUET infra.)
2. **Target date** — even rough (Q4 2026 / 2027?).
3. **SENTINEL vs DUET relationship** — same brand family / sibling / standalone?
4. **E-signature provider** — DocuSign / Adobe Sign / built-in?
5. **Hosting target** — Azure (if DUET-family) / Vercel / something else?
6. **DB + contract storage** — Postgres + S3 / Cosmos if Azure-native?

## Audit trail

The wireframe brief explicitly calls out an audit trail for every state change.
This scaffold includes a read-only audit view at `/admin/audit` with sample
events. Tier 2 will need to actually write events here.

## Things deliberately not built in Tier 1

- Real authentication (forms are visual, not wired)
- Real file uploads (drag-drop is visual)
- Real e-signature (typed-name is a placeholder — flagged in the wireframe
  brief as a thing that should be designed properly before production)
- Real-data persistence (everything is mock data)
- Real search filtering (results page filters by sector + skill only)
- Real notifications (5-day countdown is shown but not enforced)
- Real payment/invoicing
- Real identity verification

All of these are Tier 2 / Tier 3 concerns.
