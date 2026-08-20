# QUEDERA SENTINEL — Architecture (Tier 2 groundwork)

This document describes the architectural decisions that **don't depend on
Craig's two remaining answers** (e-sig provider + hosting target / DB).
Everything in this document can be implemented and changed without committing
to a specific provider.

---

## 1. Data model (`prisma/schema.prisma`)

Postgres-first, swappable to Cosmos PostgreSQL API by changing one line
in the datasource block. All models are relational.

### Status machine

The `Engagement.status` enum is **not** a free-form string. It enforces the
11-state machine from the wireframe brief §15:

```
DRAFT
  ↓
HIRE_REQUESTED
  ↓
CONTRACT_UPLOADED
  ↓
AWAITING_CONSULTANT
  ↓
VIEWED
  ↓
SIGNED
  ↓
CONFIRMED ────→ ACTIVE ────→ COMPLETED
```

Branches: `CONTRACT_UPLOADED → DECLINED`, `CONTRACT_UPLOADED → EXPIRED`,
`AWAITING_CONSULTANT → DECLINED`, `AWAITING_CONSULTANT → EXPIRED`,
`VIEWED → DECLINED`, `VIEWED → EXPIRED`. The TypeScript helper
`canTransition(from, to)` in `lib/api/contract.ts` enforces valid transitions.

### Three-tier data exposure

The data model exposes the same shape across tiers; what changes is which
fields the API returns (enforced via TypeScript types in `lib/api/contract.ts`):

| Tier | Public response type | Fields |
|---|---|---|
| 1. Public / searchable | `PublicConsultant` | name, title, skills, exp, sector, location, day rate, availability |
| 2. Authenticated client | `DetailedConsultant` | + professional summary, expanded CV |
| 3. Post-selection | `FullConsultant` | + references, phone, email |

This is the key commercial lever James flagged — it gives QUEDERA control
over who sees what, when.

### Audit trail

`AuditEvent` is append-only. The `AuditAction` enum is the canonical list of
state changes that must be audited (per wireframe brief §14). Every state
change in Tier 2+ writes an event; the admin view at `/admin/audit` reads
from this table.

### Cosmos migration

To switch to Azure Cosmos DB (PostgreSQL API): change `provider = "postgresql"`
in the datasource, point `DATABASE_URL` at the Cosmos endpoint. All models
work as-is. If the team later needs Cosmos NoSQL API, the schema will need
to be reshaped into container-based denormalised documents — out of scope
for Tier 2.

---

## 2. Auth (`lib/auth/`)

Pluggable provider interface. Application code only ever imports
`authProvider` from `lib/auth/index.ts`. Swap providers via the
`AUTH_PROVIDER` env var.

| Provider | Status | Use case |
|---|---|---|
| `NoOpAuthProvider` | wired | Tier 1 / scaffold (accepts any creds) |
| `NextAuthProvider` | stub | Tier 2 if going standalone (NextAuth.js + Prisma) |
| `EntraAuthProvider` | stub | Tier 2 if sharing DUET infra (Microsoft Entra ID SSO) |

The choice between `nextauth` and `entra` is **Craig's call** — that's the
"hosting target + auth" answer he's been deferred on. The pluggable
interface means the decision can wait until Tier 2 wiring without blocking
any of the rest of the work.

### Auth interface (`lib/auth/types.ts`)

```typescript
export interface AuthProvider {
  readonly name: string;
  signInWithPassword(email, password): Promise<AuthenticatedUser | null>;
  signInWithToken(token): Promise<AuthenticatedUser | null>;
  resolveSession(token): Promise<AuthenticatedUser | null>;
  issueSession(user): Promise<AuthSession>;
  hashPassword(password): Promise<string>;
  verifyPassword(password, hash): Promise<boolean>;
  registerUser(input): Promise<AuthenticatedUser>;
}
```

---

## 3. API surface (`lib/api/contract.ts` + `app/api/`)

REST-style route handlers under `app/api/`. Three example handlers shipped
as templates:

- `POST /api/auth/login` — auth, session issuance
- `GET /api/search/consultants` — search with all 6 filters
- `POST /api/engagements/[id]/sign` — state machine transition with audit

### Endpoint catalog

#### Auth
- `POST /api/auth/register/consultant` — consultant self-registration
- `POST /api/auth/register/client` — client self-registration
- `POST /api/auth/login` — email + password
- `POST /api/auth/logout`
- `GET /api/auth/me` — current session

#### Consultant
- `POST /api/consultants` — create profile (called after register)
- `GET /api/consultants/[id]` — public profile (tier 1 data)
- `GET /api/consultants/[id]?view=detailed` — authenticated-client view (tier 2)
- `GET /api/consultants/[id]?view=full` — post-hire view (tier 3)
- `PUT /api/consultants/[id]` — update profile
- `POST /api/consultants/[id]/cv` — upload CV (blob storage)
- `POST /api/consultants/[id]/references` — add reference
- `PUT /api/consultants/[id]/availability` — bulk update availability

#### Search
- `GET /api/search/consultants` — search with filters

#### Engagement
- `POST /api/engagements` — create hire request (HIRE_REQUESTED)
- `GET /api/engagements` — list mine
- `GET /api/engagements/[id]` — engagement detail
- `PUT /api/engagements/[id]/contract` — upload contract
- `POST /api/engagements/[id]/sign` — sign (with e-sig provider)
- `POST /api/engagements/[id]/decline` — consultant declines

#### Admin
- `POST /api/admin/consultants/[id]/approve`
- `POST /api/admin/consultants/[id]/reject`
- `POST /api/admin/consultants/[id]/suspend`
- `GET /api/admin/audit` — audit trail
- `GET /api/admin/audit?resourceType=engagement&resourceId=...` — scoped audit

---

## 4. Open questions still blocking Tier 2

These are the two Craig hasn't answered:

1. **E-sig provider** — DocuSign / Adobe Sign / built-in?
   Affects: the `sign` route handler signature, `Engagement.signedAt` semantics,
   legal compliance for the eIDAS / ESIGN Act requirements.

2. **Hosting target + DB / contract storage** — Azure (DUET-family) / Vercel /
   something else?
   Affects: deploy pipeline, where `DATABASE_URL` points, where the CV/contract
   blobs live, whether we share `duet-rg` / Entra app registration.

Neither blocks the architecture above. Both block wiring.

---

## 5. Tier 2 vertical slice (target: 1 Sept 2026)

If we read "1 Sept" as **(b) scoped + signed off** (per the clarification
asked of James), Tier 2 deliverable is:

- One critical path end-to-end: consultant registers → admin approves →
  client searches → hires → contract uploaded → e-signed → engagement
  confirmed
- Real auth (provider chosen by Craig)
- Real DB (Postgres or Cosmos, depending on Craig's hosting choice)
- Real contract storage (Azure Blob or S3)
- State machine transitions enforced
- Audit events written at every transition

The scaffold is structured so Tier 2 can drop in any of the above without
re-architecting. The interface boundaries (`authProvider`, `canTransition`,
`ApiResult<T>`) are the swap points.

---

## 6. What is NOT in this groundwork

- Real DB (Prisma not installed; schema is documentation-only until Tier 2)
- Real auth (NoOp only)
- Real blob storage (CV / contract upload is a UI placeholder)
- Real notifications (the 5-day deadline is computed but not enforced)
- Identity verification / KYC
- Payment / invoicing
- Production-grade error handling

All of those are Tier 2 / 3 concerns and have clear owners (Craig).
