# Customer Intelligence Pipeline

A production-ready event ingestion and customer profiling system built with Next.js, Prisma, and PostgreSQL.

## Overview

This application implements a complete **Events → Profiles → Segments → Campaigns** pipeline for tracking and targeting customer behavior:

- **Event Ingestion**: RESTful API endpoint (`POST /api/events`) accepts first-party events with properties and timestamps
- **Idempotent Processing**: Database-level composite unique constraints prevent duplicate event ingestion and duplicate sends
- **Customer Upsert**: Automatically creates or updates customer profiles by email
- **Timeline View**: Browse all customers and view their complete event history sorted chronologically
- **Audience Segments**: Define rule-based segments evaluated against live event data, with real-time preview of matching customers
- **Smart Generate**: Natural language → segment definition helper (mock by default, pluggable for any LLM provider)
- **Campaigns**: Target a segment, auto-generate personalised email drafts per customer (Smart Draft), approve drafts, and simulate sends
- **Smart Draft**: Template-based email copy generator (mock by default, pluggable for any LLM provider)

Built with modern TypeScript patterns, comprehensive test coverage, and production-ready architecture.

---

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **Database**: PostgreSQL (hosted Supabase recommended)
- **ORM**: Prisma v6
- **Testing**: Jest (unit), Playwright (e2e)
- **CI/CD**: GitHub Actions
- **Package Manager**: pnpm

---

## Key Design Decisions

### 1. Idempotency via Composite Unique Constraint

Events are idempotent at the database level using a composite unique constraint on `[customerId, idempotencyKey]`. This ensures duplicate prevention happens in the database, not application logic:

```prisma
@@unique([customerId, idempotencyKey])
```

- Idempotency is **opt-in**: Clients send an `Idempotency-Key` header
- If no key provided, `idempotencyKey` is stored as `null` (allows duplicate events)
- Attempting to re-ingest with the same key returns the existing event with `created: false`

### 2. Customer Upsert by Email

Customer records are created or updated automatically during event ingestion:

```typescript
await prisma.customer.upsert({
  where: { email: normalizedEmail },
  update: {},
  create: { email: normalizedEmail },
});
```

- Email is normalized (lowercase, trimmed) before storage
- No separate customer creation endpoint needed
- Simplifies client integration

### 3. Lightweight Validation Philosophy

Input validation is intentionally minimal:

- **Email**: Format validation only (regex check)
- **Event Type**: Any non-empty string
- **Properties**: Must be a JSON object (defaults to `{}`)

This keeps the API flexible while preventing basic errors. More complex validation can be added later without breaking changes.

### 4. Testing Strategy

- **Jest**: Covers validation logic, email normalization, and edge cases
- **Playwright**: End-to-end coverage of the full ingestion → timeline flow, including idempotency behavior

---

## Demo Flow

### 1. Ingest an Event

Navigate to **http://localhost:3000/ingest** and submit an event:

- **Email**: `demo@example.com`
- **Event Type**: `page_view`
- **Properties**: `{"page": "/home", "referrer": "google"}`

The system will:

- Create a customer record for `demo@example.com` (or find existing)
- Store the event with a timestamp
- Return `{ created: true, eventId: "...", customerId: "..." }`

### 2. View Customers

Navigate to **http://localhost:3000/customers** to see:

- List of all customers
- Event count for each customer
- Link to individual timelines

### 3. View Timeline

Click "View Timeline" for any customer to see:

- Customer email
- All events sorted by `occurredAt` (newest first)
- Event properties displayed as formatted JSON
- Idempotency badge (if event has an idempotency key)

### 4. Test Idempotency

Re-submit the same event with an **Idempotency Key**:

- Add a value like `key-123` to the form
- Submit the event
- Submit again with the same key
- Second submission returns `created: false` and the original event ID
- Timeline shows only **one** event (not duplicated)

---

## Getting Started

### Prerequisites

- **Node.js**: v20 or higher
- **pnpm**: v10 or higher
- **PostgreSQL**: Hosted Supabase recommended (local Postgres also works)

### Setup

1. **Clone and install dependencies**:

   ```bash
   pnpm install
   ```

2. **Configure database**:

   Create a `.env` file (copy from `.env.example`):

   ```bash
   DATABASE_URL="postgresql://user:password@host:port/database"
   ```

   **Recommended**: Use [Supabase](https://supabase.com) for hosted PostgreSQL (free tier available). Use the **Session Pooler** connection string for best compatibility.

   **Alternative**: Local PostgreSQL also works (ensure it's running on port 5432).

3. **Push database schema**:

   ```bash
   pnpm exec prisma db push
   ```

   This creates the `customers` and `events` tables with proper indexes and constraints.

4. **Generate Prisma client**:

   ```bash
   pnpm exec prisma generate
   ```

5. **Start development server**:

   ```bash
   pnpm dev
   ```

6. **Open the app**:

   Navigate to **http://localhost:3000**

---

## Available Scripts

### Development

```bash
pnpm dev          # Start dev server (http://localhost:3000)
pnpm build        # Build for production
pnpm start        # Start production server
```

### Code Quality

```bash
pnpm lint         # Run ESLint
pnpm format       # Format code with Prettier
pnpm format:check # Check formatting (CI)
```

### Testing

```bash
pnpm test              # Run Jest unit tests
pnpm test:watch        # Run Jest in watch mode
pnpm test:integration  # Run DB integration tests (requires DATABASE_URL)
pnpm test:e2e          # Run Playwright e2e tests (requires dev server)
pnpm test:e2e:ui       # Run Playwright with interactive UI
```

### Database

```bash
pnpm exec prisma db push      # Sync schema to database (dev)
pnpm exec prisma generate     # Generate Prisma client
pnpm exec prisma studio       # Open Prisma Studio (GUI)
```

---

## Project Structure

```
customer-intelligence-pipeline/
├── app/
│   ├── api/
│   │   ├── events/
│   │   │   └── route.ts                   # POST /api/events
│   │   ├── segments/
│   │   │   ├── route.ts                   # POST /api/segments, GET /api/segments
│   │   │   └── [id]/
│   │   │       ├── route.ts               # GET /api/segments/[id]
│   │   │       └── preview/
│   │   │           └── route.ts           # GET /api/segments/[id]/preview
│   │   ├── smart-generate/segment/
│   │   │   └── route.ts                   # POST /api/smart-generate/segment
│   │   ├── smart-draft/email/
│   │   │   └── route.ts                   # POST /api/smart-draft/email
│   │   └── campaigns/
│   │       ├── route.ts                   # POST /api/campaigns, GET /api/campaigns
│   │       └── [id]/
│   │           ├── route.ts               # GET /api/campaigns/[id]
│   │           ├── generate-drafts/
│   │           │   └── route.ts           # POST /api/campaigns/[id]/generate-drafts
│   │           ├── drafts/[draftId]/
│   │           │   └── route.ts           # PATCH /api/campaigns/[id]/drafts/[draftId]
│   │           └── send/
│   │               └── route.ts           # POST /api/campaigns/[id]/send
│   ├── ingest/
│   │   └── page.tsx                       # Event ingestion form
│   ├── customers/
│   │   ├── page.tsx                       # Customer list
│   │   └── [id]/page.tsx                  # Customer timeline
│   ├── segments/
│   │   ├── page.tsx                       # Segment list
│   │   ├── new/page.tsx                   # Create segment (+ Smart Generate)
│   │   └── [id]/page.tsx                  # Segment detail + preview
│   ├── campaigns/
│   │   ├── page.tsx                       # Campaign list
│   │   ├── new/page.tsx                   # Create campaign (segment picker)
│   │   └── [id]/page.tsx                  # Campaign detail (drafts + send)
│   ├── layout.tsx                         # Root layout
│   ├── page.tsx                           # Landing page
│   └── globals.css                        # Global styles
├── lib/
│   ├── __tests__/
│   │   ├── utils.test.ts                  # Email validation tests
│   │   ├── event-validation.test.ts       # Event validation tests
│   │   ├── segments.test.ts               # Segment definition validation tests
│   │   ├── smartGenerate.test.ts          # Smart Generate mock parsing tests
│   │   ├── campaignUtils.test.ts          # extractRecommendedSku / extractRecentEventType
│   │   ├── smartDraft.test.ts             # Smart Draft mock provider tests
│   │   └── integration/
│   │       └── campaigns.integration.test.ts  # DB-backed campaign CRUD tests
│   ├── smartGenerate/
│   │   ├── types.ts                       # SmartGenerateProvider interface
│   │   ├── mock.ts                        # Keyword-based mock provider
│   │   └── client.ts                      # Provider registry + export
│   ├── smartDraft/
│   │   ├── types.ts                       # SmartDraftProvider interface
│   │   ├── mock.ts                        # Template-based mock provider
│   │   └── client.ts                      # Provider registry + export
│   ├── prisma.ts                          # Prisma client singleton
│   ├── segments.ts                        # SegmentDefinition types + validation
│   ├── segmentPreview.ts                  # Segment evaluation logic
│   ├── campaignUtils.ts                   # extractRecommendedSku / extractRecentEventType
│   └── utils.ts                           # Utility functions
├── e2e/
│   ├── home.spec.ts                       # Landing page tests
│   ├── event-ingestion.spec.ts            # Event flow tests
│   ├── segments.spec.ts                   # Segment flow tests
│   └── campaigns.spec.ts                  # Campaign flow tests
├── prisma/
│   └── schema.prisma                      # Database schema
├── .github/workflows/
│   └── ci.yml                             # GitHub Actions CI
├── .env                                   # Environment variables (gitignored)
├── .env.example                           # Environment template
└── [config files]                         # Jest, Playwright, ESLint, etc.
```

---

## Database Schema

### Customer

```prisma
model Customer {
  id        String   @id @default(uuid()) @db.Uuid
  email     String   @unique
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  events    Event[]

  @@index([email])
  @@index([createdAt])
  @@map("customers")
}
```

### Event

```prisma
model Event {
  id             String   @id @default(uuid()) @db.Uuid
  customerId     String   @db.Uuid
  customer       Customer @relation(fields: [customerId], references: [id], onDelete: Cascade)
  type           String
  properties     Json
  occurredAt     DateTime
  idempotencyKey String?
  createdAt      DateTime @default(now())

  @@unique([customerId, idempotencyKey])
  @@index([customerId])
  @@index([occurredAt])
  @@map("events")
}
```

**Key Features**:

- `@@unique([customerId, idempotencyKey])` - Prevents duplicate events
- `onDelete: Cascade` - Deleting a customer removes their events
- `occurredAt` - Event timestamp (defaults to ingestion time if not provided)
- `properties` - Flexible JSON field for arbitrary event data
- `@@index([type, occurredAt])` - Composite index for fast segment evaluation

### Segment

```prisma
model Segment {
  id          String   @id @default(uuid()) @db.Uuid
  name        String
  description String?
  definition  Json
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([name])
  @@map("segments")
}
```

The `definition` field holds a typed JSON object (one of three supported rule kinds — see [Segment Definitions](#segment-definitions) below).

---

## API Reference

### POST /api/events

Ingest a new event for a customer.

**Request Body**:

```json
{
  "email": "user@example.com",
  "type": "page_view",
  "properties": {
    "page": "/home",
    "referrer": "google"
  },
  "occurredAt": "2026-02-11T10:30:00Z"
}
```

**Headers** (optional):

```
Idempotency-Key: unique-key-123
```

**Response** (201 Created):

```json
{
  "created": true,
  "eventId": "550e8400-e29b-41d4-a716-446655440000",
  "customerId": "7c9e6679-7425-40de-944b-e07fc1f90ae7"
}
```

**Response** (200 OK - duplicate idempotency key):

```json
{
  "created": false,
  "eventId": "550e8400-e29b-41d4-a716-446655440000",
  "customerId": "7c9e6679-7425-40de-944b-e07fc1f90ae7"
}
```

**Validation Errors** (400):

- `Email is required`
- `Invalid email format`
- `Event type is required`
- `Properties must be a JSON object`

---

### POST /api/segments

Create a new segment.

**Request Body**:

```json
{
  "name": "Cart Abandoners",
  "description": "Users who added to cart in the last 7 days",
  "definition": {
    "kind": "event_type_in_last_days",
    "eventType": "added_to_cart",
    "days": 7
  }
}
```

**Response** (201 Created):

```json
{ "segmentId": "uuid" }
```

---

### GET /api/segments

List all segments.

**Response**:

```json
{
  "segments": [
    {
      "id": "uuid",
      "name": "Cart Abandoners",
      "description": "...",
      "updatedAt": "..."
    }
  ]
}
```

---

### GET /api/segments/[id]

Fetch a single segment with its definition.

---

### GET /api/segments/[id]/preview

Evaluate a segment against live event data. Returns up to 50 matching customers.

**Response**:

```json
{
  "count": 12,
  "customers": [{ "id": "uuid", "email": "user@example.com" }]
}
```

---

### POST /api/campaigns

Create a new campaign targeting a segment. Snapshots the segment definition at creation time.

**Request Body**:

```json
{
  "name": "Cart Re-engagement",
  "description": "Optional description",
  "segmentId": "uuid"
}
```

**Response** (201 Created):

```json
{ "campaignId": "uuid" }
```

---

### POST /api/campaigns/[id]/generate-drafts

Evaluate the campaign's segment snapshot, then generate and upsert a personalised email draft for each matching customer. Idempotent — safe to call multiple times.

**Response**:

```json
{ "draftedCount": 12 }
```

---

### PATCH /api/campaigns/[id]/drafts/[draftId]

Transition a draft's status. Only `generated → approved` or `generated → rejected` transitions are permitted.

**Request Body**:

```json
{ "status": "approved" }
```

---

### POST /api/campaigns/[id]/send

Simulate sending emails for all `approved` drafts. Upserts Send records and advances campaign status to `sent`.

**Response**:

```json
{ "sentCount": 10, "failedCount": 0 }
```

---

### POST /api/smart-draft/email

Generate an email subject + body for a given customer context.

**Request Body**:

```json
{
  "customerEmail": "alice@example.com",
  "recentEventType": "added_to_cart",
  "recommendedSku": "WIDGET-42"
}
```

**Response**:

```json
{
  "subject": "Still thinking about WIDGET-42?",
  "body": "Hi alice,\n\nWe noticed you added to cart..."
}
```

---

### POST /api/smart-generate/segment

Generate a segment definition from a natural language prompt.

**Request Body**:

```json
{ "prompt": "Users who added to cart in the last 7 days" }
```

**Response**:

```json
{
  "definition": {
    "kind": "event_type_in_last_days",
    "eventType": "added_to_cart",
    "days": 7
  }
}
```

---

## Segment Definitions

Three rule kinds are supported (MVP):

### 1. `event_type_in_last_days`

Customers who performed a specific event within the last N days.

```json
{
  "kind": "event_type_in_last_days",
  "eventType": "added_to_cart",
  "days": 7
}
```

### 2. `event_property_equals`

Customers who performed an event where a specific property equals a value.

```json
{
  "kind": "event_property_equals",
  "eventType": "page_view",
  "path": "path",
  "value": "/pricing",
  "days": 7
}
```

### 3. `event_count_gte_in_last_days`

Customers who performed an event at least N times within the last N days.

```json
{
  "kind": "event_count_gte_in_last_days",
  "eventType": "page_view",
  "days": 30,
  "minCount": 3
}
```

---

## Smart Generate

The Smart Generate feature converts a natural language prompt into a segment definition JSON. It is **fully optional** and works out of the box with no API keys.

**Architecture**: A provider interface (`SmartGenerateProvider`) with a default mock implementation that uses keyword parsing. To plug in a real LLM:

```typescript
// lib/smartGenerate/client.ts
import { setSmartGenerateProvider } from "@/lib/smartGenerate/client";
import { MyOpenAIProvider } from "./openai"; // your implementation

setSmartGenerateProvider(new MyOpenAIProvider());
```

**Mock provider keyword mappings**:

| Phrase                   | Parsed as                                              |
| ------------------------ | ------------------------------------------------------ |
| "added to cart"          | `eventType: added_to_cart`                             |
| "purchase" / "purchased" | `eventType: purchase`                                  |
| "signed up"              | `eventType: signup`                                    |
| "pricing" / "/pricing"   | `event_property_equals`, path=`path`, value=`/pricing` |
| "at least N" / ">= N"    | `event_count_gte`, minCount=N                          |
| "last 7 days"            | `days: 7`                                              |
| "last week"              | `days: 7`                                              |
| "last month"             | `days: 30`                                             |

---

## Demo: How to Use Segments

### Step 1 — Ingest some events

Navigate to **http://localhost:3000/ingest** and submit a few events for different customers:

```
email: alice@example.com  type: added_to_cart  properties: {}
email: bob@example.com    type: page_view       properties: { "path": "/pricing" }
email: carol@example.com  type: added_to_cart  properties: {}
```

### Step 2 — Create a segment manually

Navigate to **http://localhost:3000/segments/new**:

- **Name**: `Cart Abandoners`
- **Rule Type**: `Event type in last N days`
- **Event Type**: `added_to_cart`
- **Days**: `30`
- Click **Create Segment**

### Step 3 — Try Smart Generate

On the same page, paste a natural language description into the Smart Generate box:

```
Users who added to cart in the last 7 days
```

Click **Smart Generate** — the form fields are auto-populated with the parsed definition.

### Step 4 — Preview

After creating a segment, you are redirected to `/segments/[id]`. The preview loads automatically and shows all matching customers with a link to their event timeline.

### Step 5 — Browse all segments

Navigate to **http://localhost:3000/segments** to see all segments, their descriptions, and links to each detail page.

---

## Demo: How to Use Campaigns

### Step 1 — Create a campaign

Navigate to **http://localhost:3000/campaigns/new**:

- **Campaign Name**: `Cart Re-engagement`
- **Target Segment**: select any existing segment
- Click **Create Campaign**

### Step 2 — Generate drafts

On the campaign detail page, click **Generate Drafts**. The system:

- Evaluates the segment snapshot against live events
- Generates a personalised email subject + body for each matching customer
- Displays all drafts with status `generated`

### Step 3 — Review and approve drafts

Click **Approve** on each draft you want to send. Approved drafts show a green badge.

### Step 4 — Send

Click **Send Approved (N)**. The system simulates sending to all approved customers and updates the campaign status to `sent`.

---

## Smart Draft

The Smart Draft feature generates personalised email copy per customer. It is **fully optional** and works out of the box with no API keys.

**Architecture**: A provider interface (`SmartDraftProvider`) with a default template-based mock. To plug in a real LLM:

```typescript
import { setSmartDraftProvider } from "@/lib/smartDraft/client";
import { MyOpenAIProvider } from "./openai";

setSmartDraftProvider(new MyOpenAIProvider());
```

**Mock template logic**:

| Input            | Output subject                        |
| ---------------- | ------------------------------------- |
| SKU + event type | `"Still thinking about {sku}?"`       |
| SKU only         | `"Still thinking about {sku}?"`       |
| Event type only  | `"We have something special for you"` |
| No context       | `"We have something special for you"` |

---

## Testing

### Unit Tests

```bash
pnpm test
```

**Coverage** (56 tests across 6 suites):

- Email validation and normalization (`utils.test.ts`)
- Event field validation (`event-validation.test.ts`)
- Segment definition validation — all 3 rule kinds, all error cases (`segments.test.ts`)
- Smart Generate mock parsing — 7 prompt scenarios (`smartGenerate.test.ts`)
- Campaign utilities — `extractRecommendedSku`, `extractRecentEventType` (`campaignUtils.test.ts`)
- Smart Draft mock provider — all 4 copy branches, edge cases (`smartDraft.test.ts`)

All validation and pure-function logic is tested independently of the API layer.

**Integration Tests** (requires `DATABASE_URL`):

```bash
pnpm test:integration
```

Covers campaign CRUD, draft upsert idempotency, status transitions, and Send record upsert — all against a real Postgres database.

### E2E Tests

```bash
# Terminal 1: Start dev server (if not already running)
pnpm dev

# Terminal 2: Run tests
pnpm test:e2e
```

**Coverage** (42 tests across 4 spec files, Chromium + Firefox):

- `home.spec.ts`: Landing page smoke tests
- `event-ingestion.spec.ts`: Full ingestion flow, idempotency, API validation
- `segments.spec.ts`:
  - Full flow: create segment via form → auto-preview → verify matching customers
  - Segment list page
  - Smart Generate fills the form
  - `event_count_gte` segment: verifies only frequent users match
  - API validation (missing name, invalid definition)
- `campaigns.spec.ts`:
  - Full happy-path: create → generate drafts → approve → send → status is `sent`
  - Campaign list page
  - Empty segment (0 drafts)
  - PATCH draft: valid approved transition
  - PATCH draft: invalid status returns 400
  - API validation (missing segmentId)
  - Smart Draft email endpoint

Tests run on Chromium and Firefox (WebKit disabled for macOS ARM compatibility).

---

## CI/CD

GitHub Actions workflow runs on every push and pull request:

1. **Lint**: ESLint + Prettier checks
2. **Unit Tests**: Jest tests (no DB required)
3. **E2E Tests**: Integration tests (DB) + Playwright tests (headless, real Postgres container)

See [`.github/workflows/ci.yml`](.github/workflows/ci.yml) for configuration.

---

## VSCode Setup

For automatic formatting on save, add to `.vscode/settings.json`:

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode"
}
```

---

---

## Author

Sakthiabinav Chandramohan  
Computer Science Student @UMD
GitHub: https://github.com/shakc04

## License

This project is for portfolio and demonstration purposes.
