# Customer Intelligence Pipeline

A production-ready event ingestion and customer profiling system built with Next.js, Prisma, and PostgreSQL.

## Overview

This application implements a complete **Events → Profiles → Segments** pipeline for tracking and targeting customer behavior:

- **Event Ingestion**: RESTful API endpoint (`POST /api/events`) accepts first-party events with properties and timestamps
- **Idempotent Processing**: Database-level composite unique constraint (`customerId` + `idempotencyKey`) prevents duplicate event ingestion
- **Customer Upsert**: Automatically creates or updates customer profiles by email
- **Timeline View**: Browse all customers and view their complete event history sorted chronologically
- **Audience Segments**: Define rule-based segments evaluated against live event data, with real-time preview of matching customers
- **Smart Generate**: Natural language → segment definition helper (mock by default, pluggable for any LLM provider)

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
pnpm test         # Run Jest unit tests
pnpm test:watch   # Run Jest in watch mode
pnpm test:e2e     # Run Playwright e2e tests (requires dev server)
pnpm test:e2e:ui  # Run Playwright with interactive UI
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
│   │   └── smart-generate/segment/
│   │       └── route.ts                   # POST /api/smart-generate/segment
│   ├── ingest/
│   │   └── page.tsx                       # Event ingestion form
│   ├── customers/
│   │   ├── page.tsx                       # Customer list
│   │   └── [id]/page.tsx                  # Customer timeline
│   ├── segments/
│   │   ├── page.tsx                       # Segment list
│   │   ├── new/page.tsx                   # Create segment (+ Smart Generate)
│   │   └── [id]/page.tsx                  # Segment detail + preview
│   ├── layout.tsx                         # Root layout
│   ├── page.tsx                           # Landing page
│   └── globals.css                        # Global styles
├── lib/
│   ├── __tests__/
│   │   ├── utils.test.ts                  # Email validation tests
│   │   ├── event-validation.test.ts       # Event validation tests
│   │   ├── segments.test.ts               # Segment definition validation tests
│   │   └── smartGenerate.test.ts          # Smart Generate mock parsing tests
│   ├── smartGenerate/
│   │   ├── types.ts                       # SmartGenerateProvider interface
│   │   ├── mock.ts                        # Keyword-based mock provider
│   │   └── client.ts                      # Provider registry + export
│   ├── prisma.ts                          # Prisma client singleton
│   ├── segments.ts                        # SegmentDefinition types + validation
│   ├── segmentPreview.ts                  # Segment evaluation logic
│   └── utils.ts                           # Utility functions
├── e2e/
│   ├── home.spec.ts                       # Landing page tests
│   ├── event-ingestion.spec.ts            # Event flow tests
│   └── segments.spec.ts                   # Segment flow tests
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

## Testing

### Unit Tests

```bash
pnpm test
```

**Coverage** (40 tests across 4 suites):

- Email validation and normalization (`utils.test.ts`)
- Event field validation (`event-validation.test.ts`)
- Segment definition validation — all 3 rule kinds, all error cases (`segments.test.ts`)
- Smart Generate mock parsing — 7 prompt scenarios (`smartGenerate.test.ts`)

All validation logic is tested independently of the API layer.

### E2E Tests

```bash
# Terminal 1: Start dev server (if not already running)
pnpm dev

# Terminal 2: Run tests
pnpm test:e2e
```

**Coverage** (28 tests across 3 spec files, Chromium + Firefox):

- `home.spec.ts`: Landing page smoke tests
- `event-ingestion.spec.ts`: Full ingestion flow, idempotency, API validation
- `segments.spec.ts`:
  - Full flow: create segment via form → auto-preview → verify matching customers
  - Segment list page
  - Smart Generate fills the form
  - `event_count_gte` segment: verifies only frequent users match
  - API validation (missing name, invalid definition)

Tests run on Chromium and Firefox (WebKit disabled for macOS ARM compatibility).

---

## CI/CD

GitHub Actions workflow runs on every push and pull request:

1. **Lint**: ESLint + Prettier checks
2. **Unit Tests**: Jest tests
3. **E2E Tests**: Playwright tests (headless)

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
