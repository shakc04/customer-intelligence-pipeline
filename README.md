# Customer Intelligence Pipeline

A full-stack event ingestion and customer targeting system built with Next.js, Prisma, and PostgreSQL. It models the core data pipeline behind a customer engagement platform: raw events flow in, customers are profiled automatically, rule-based segments identify the right audience, and email campaigns are generated, reviewed, and simulated — all through a working web UI and a typed REST API.

No third-party API keys required. The project runs end-to-end out of the box.

---

## Features

### Event Ingestion & Customer Profiles

- `POST /api/events` accepts first-party events (type, properties, optional timestamp)
- Customers are created or resolved by email on every ingest — no separate signup flow
- Optional `Idempotency-Key` header prevents duplicate ingestion at the database level (`@@unique([customerId, idempotencyKey])`)
- `/customers` and `/customers/[id]` pages show profiles and full event timelines

### Audience Segments

- Three rule kinds: `event_type_in_last_days`, `event_property_equals`, `event_count_gte_in_last_days`
- Segment definitions are stored as typed JSON and validated on write
- `/segments/[id]` evaluates the segment against live events and shows matching customers in real time
- Segment definitions can also be generated from a plain-English description via Smart Assist (see below)

### Campaigns, Drafts & Simulated Sends

- A campaign targets a segment; its definition is **snapshotted at creation** so later edits to the segment don't affect in-flight campaigns
- `POST /api/campaigns/[id]/generate-drafts` evaluates the snapshot, generates a personalised email draft for each matched customer, and upserts records — safe to call multiple times (idempotent via `@@unique([campaignId, customerId])`)
- Each draft can be individually approved or rejected through the UI or API
- `POST /api/campaigns/[id]/send` simulates delivery for all approved drafts, records results in a `Send` table, and advances the campaign status to `sent`

### Smart Assist (mock-first, provider-pluggable)

Both AI-style helpers work without any API key. They use deterministic mock implementations by default and expose a provider interface so a real LLM can be swapped in with a single call:

- **Smart Generate** (`POST /api/smart-generate/segment`): converts a plain-English prompt into a segment definition JSON
- **Smart Draft** (`POST /api/smart-draft/email`): generates an email subject + body personalised to a customer's recent activity and recommended SKU

```typescript
// Plug in a real provider at startup (optional)
import { setSmartGenerateProvider } from "@/lib/smartGenerate/client";
import { setSmartDraftProvider } from "@/lib/smartDraft/client";

setSmartGenerateProvider(new MyLLMSegmentProvider());
setSmartDraftProvider(new MyLLMDraftProvider());
```

### Reliability & Correctness

- Duplicate events blocked at DB level (not in application code)
- Duplicate drafts and sends blocked by unique constraints — `generate-drafts` and `send` are safe to retry
- Status machine for campaigns (`draft → drafted → sent`) and drafts (`generated → approved | rejected`) — invalid transitions return `409`
- Email normalized (lowercase + trim) before storage

### Testing & CI

- **57 Jest unit tests** across 6 suites (pure functions, no DB required)
- **5 Jest integration tests** run against a real Postgres database
- **42 Playwright e2e tests** across 4 spec files (Chromium + Firefox)
- GitHub Actions CI: lint → unit tests → integration tests → e2e tests, all on every push

---

## Architecture

```
Browser
  │
  ├── /ingest          → POST /api/events
  ├── /customers/[id]  → GET  /api/customers/[id]
  │
  ├── /segments/new    → POST /api/smart-generate/segment (optional)
  │                    → POST /api/segments
  ├── /segments/[id]   → GET  /api/segments/[id]/preview
  │
  ├── /campaigns/new   → POST /api/campaigns
  └── /campaigns/[id]  → POST /api/campaigns/[id]/generate-drafts
                       → POST /api/smart-draft/email        (per customer)
                       → PATCH /api/campaigns/[id]/drafts/[draftId]
                       → POST /api/campaigns/[id]/send

Next.js API Routes (App Router)
  └── Prisma ORM
        └── PostgreSQL (Supabase Session Pooler recommended)
```

---

## Data Model

| Model        | Purpose                                                               | Key constraints                                |
| ------------ | --------------------------------------------------------------------- | ---------------------------------------------- |
| `Customer`   | One record per email address                                          | `email UNIQUE`                                 |
| `Event`      | Immutable event record with arbitrary JSON properties                 | `UNIQUE(customerId, idempotencyKey)`           |
| `Segment`    | Named rule definition (typed JSON)                                    | —                                              |
| `Campaign`   | Targets a segment; stores a snapshot of the definition at create time | Status enum: `draft → drafted → sent / failed` |
| `EmailDraft` | One personalised draft per (campaign, customer) pair                  | `UNIQUE(campaignId, customerId)`               |
| `Send`       | Simulated send result per (campaign, customer) pair                   | `UNIQUE(campaignId, customerId)`               |

---

## Quickstart

**Requirements**: Node.js 20+, pnpm 10+, PostgreSQL (or a free Supabase project)

```bash
# 1. Install dependencies
pnpm install

# 2. Set database URL
cp .env.example .env
# Edit .env → DATABASE_URL="postgresql://user:pass@host:port/db"

# 3. Apply schema and generate client
pnpm exec prisma db push
pnpm exec prisma generate

# 4. Start dev server
pnpm dev
# → http://localhost:3000
```

> **Supabase users**: use the **Session Pooler** connection string (port 5432), not the Transaction Pooler. Prisma requires session-mode pooling for migrations and `db push`.

---

## 60-Second Demo

All steps use the running dev server at `http://localhost:3000`.

**1 — Ingest events** (`/ingest`)

Submit three events:

| Email               | Type            | Properties            |
| ------------------- | --------------- | --------------------- |
| `alice@example.com` | `added_to_cart` | `{"sku":"WIDGET-42"}` |
| `bob@example.com`   | `page_view`     | `{}`                  |
| `alice@example.com` | `purchase`      | `{"sku":"WIDGET-42"}` |

**2 — Browse profiles** (`/customers`)

Both customers appear. Click Alice to see her full event timeline with formatted JSON properties.

**3 — Create a segment** (`/segments/new`)

Option A — Manual form:

- Rule type: `Event type in last N days` · Event type: `added_to_cart` · Days: `30`

Option B — Smart Assist:

- Type `"Users who added to cart in the last 30 days"` → click **Smart Generate** → form auto-fills.

Name it `Cart Abandoners` and submit. You land on `/segments/[id]` where the live preview immediately shows Alice as the single match.

**4 — Create a campaign** (`/campaigns/new`)

- Name: `Cart Re-engagement`
- Segment: `Cart Abandoners`
- Click **Create Campaign**

**5 — Generate drafts** (`/campaigns/[id]`)

Click **Generate Drafts**. One draft appears for Alice, subject line `"Still thinking about WIDGET-42?"`, personalised body using her first name and recent event.

**6 — Approve and send**

Click **Approve** on the draft. The **Send Approved (1)** button appears. Click it — the campaign status changes to `sent` and a send record appears below the drafts.

---

## API Reference

### Event Ingestion

```bash
# Ingest an event (no idempotency key — allows duplicates)
curl -X POST http://localhost:3000/api/events \
  -H "Content-Type: application/json" \
  -d '{"email":"alice@example.com","type":"added_to_cart","properties":{"sku":"WIDGET-42"}}'

# Ingest with idempotency key — safe to retry
curl -X POST http://localhost:3000/api/events \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: order-session-abc123" \
  -d '{"email":"alice@example.com","type":"purchase","properties":{"total":99}}'
```

Second call with the same key returns `{ "created": false, "eventId": "..." }` and does not create a duplicate.

### Segments

```bash
# Create a segment
curl -X POST http://localhost:3000/api/segments \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Cart Abandoners",
    "definition": {
      "kind": "event_type_in_last_days",
      "eventType": "added_to_cart",
      "days": 30
    }
  }'
# → {"segmentId":"<uuid>"}

# Preview matching customers (live evaluation)
curl http://localhost:3000/api/segments/<uuid>/preview
# → {"count":1,"customers":[{"id":"...","email":"alice@example.com"}]}

# Smart Generate — plain English → definition JSON
curl -X POST http://localhost:3000/api/smart-generate/segment \
  -H "Content-Type: application/json" \
  -d '{"prompt":"Users who added to cart in the last 30 days"}'
```

### Campaigns

```bash
# Create campaign (snapshots the segment definition)
curl -X POST http://localhost:3000/api/campaigns \
  -H "Content-Type: application/json" \
  -d '{"name":"Cart Re-engagement","segmentId":"<segment-uuid>"}'
# → {"campaignId":"<uuid>"}

# Generate personalised drafts (idempotent)
curl -X POST http://localhost:3000/api/campaigns/<uuid>/generate-drafts
# → {"draftedCount":1}

# Approve a draft
curl -X PATCH http://localhost:3000/api/campaigns/<campaign-uuid>/drafts/<draft-uuid> \
  -H "Content-Type: application/json" \
  -d '{"status":"approved"}'

# Simulate sends for all approved drafts
curl -X POST http://localhost:3000/api/campaigns/<uuid>/send
# → {"sentCount":1,"failedCount":0}
```

### Segment Rule Kinds

```jsonc
// 1. Any customer who performed an event type within N days
{ "kind": "event_type_in_last_days", "eventType": "added_to_cart", "days": 7 }

// 2. Any customer whose event has a specific property value
{ "kind": "event_property_equals", "eventType": "page_view", "path": "path", "value": "/pricing", "days": 30 }

// 3. Any customer who performed an event at least N times within N days
{ "kind": "event_count_gte_in_last_days", "eventType": "page_view", "days": 30, "minCount": 3 }
```

---

## Testing

```bash
pnpm test                # Jest unit tests (57 tests, no DB needed)
pnpm test:integration    # Jest integration tests (5 tests, requires DATABASE_URL)
pnpm test:e2e            # Playwright e2e tests (42 tests, requires pnpm dev running)
pnpm lint                # ESLint
pnpm format:check        # Prettier check
```

**Unit tests** cover all validation logic, email normalisation, segment definition parsing, Smart Generate keyword mapping, `extractRecommendedSku`, `extractRecentEventType`, and Smart Draft copy branches — all without a database.

**Integration tests** (`jest.integration.config.ts`, `testEnvironment: node`) hit a real Postgres database and verify campaign creation, draft upsert idempotency, status transitions, and send record upsert.

**E2E tests** run two browsers (Chromium, Firefox) against the full dev server and cover:

- Full ingestion → customer timeline flow, including idempotency
- Create segment via form and via Smart Generate
- `event_count_gte` segment matching
- Full campaign flow: create → generate drafts → approve → send → status `sent`
- API validation (400s for missing/invalid fields, 409 for invalid status transitions)

---

## CI/CD

GitHub Actions (`.github/workflows/ci.yml`) runs on every push and pull request:

| Job            | What it does                                                                                               |
| -------------- | ---------------------------------------------------------------------------------------------------------- |
| **Lint**       | ESLint + Prettier format check                                                                             |
| **Unit Tests** | Jest unit suite — no DB, fast                                                                              |
| **E2E Tests**  | Spins up a Postgres 15 container; runs integration tests then Playwright e2e tests against a real database |

The E2E job exports a Playwright HTML report as a GitHub Actions artifact on failure.

---

## Project Structure

```
app/
  api/
    events/route.ts                          POST /api/events
    segments/route.ts                        POST + GET /api/segments
    segments/[id]/route.ts                   GET /api/segments/[id]
    segments/[id]/preview/route.ts           GET /api/segments/[id]/preview
    smart-generate/segment/route.ts          POST /api/smart-generate/segment
    campaigns/route.ts                       POST + GET /api/campaigns
    campaigns/[id]/route.ts                  GET /api/campaigns/[id]
    campaigns/[id]/generate-drafts/route.ts  POST (idempotent draft generation)
    campaigns/[id]/drafts/[draftId]/route.ts PATCH (approve / reject)
    campaigns/[id]/send/route.ts             POST (simulate sends)
    smart-draft/email/route.ts               POST /api/smart-draft/email
  ingest/page.tsx                            Event ingestion form
  customers/page.tsx                         Customer list
  customers/[id]/page.tsx                    Event timeline
  segments/page.tsx                          Segment list
  segments/new/page.tsx                      Segment builder + Smart Generate
  segments/[id]/page.tsx                     Segment detail + live preview
  campaigns/page.tsx                         Campaign list
  campaigns/new/page.tsx                     Campaign creation form
  campaigns/[id]/page.tsx                    Draft review + send
lib/
  segments.ts                                SegmentDefinition types + validation
  segmentPreview.ts                          Segment evaluation (3 rule kinds)
  campaignUtils.ts                           extractRecommendedSku / extractRecentEventType
  smartGenerate/{types,mock,client}.ts       Smart Generate provider pattern
  smartDraft/{types,mock,client}.ts          Smart Draft provider pattern
  prisma.ts                                  Prisma client singleton
  utils.ts                                   Email validation + normalisation
  __tests__/                                 Unit + integration tests
e2e/                                         Playwright specs
prisma/schema.prisma                         Full DB schema (6 models, 3 enums)
jest.config.ts                               Unit test config (excludes integration/)
jest.integration.config.ts                   Integration test config (node env)
.github/workflows/ci.yml                     GitHub Actions pipeline
```

---

## Troubleshooting

**`DATABASE_URL` / Supabase connection errors**

Use the **Session Pooler** URL from the Supabase dashboard (Settings → Database → Connection string → Session mode). The Transaction Pooler does not support the `db push` command that Prisma uses for schema sync.

**`pnpm test:integration` finds no tests**

This script uses `jest.integration.config.ts` which explicitly targets `lib/__tests__/integration/`. Make sure `DATABASE_URL` is set in your `.env` file before running.

**Stale Prisma client after schema changes**

After any `prisma db push` or `prisma migrate`, restart the dev server and clear the Next.js cache if needed:

```bash
rm -rf .next && pnpm dev
```

---

## Author

Sakthiabinav Chandramohan — Computer Science @ UMD
GitHub: [shakc04](https://github.com/shakc04)

## License

Portfolio / demonstration project.
