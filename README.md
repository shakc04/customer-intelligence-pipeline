# Customer Intelligence Pipeline

A production-ready event ingestion and customer profiling system built with Next.js, Prisma, and PostgreSQL.

## Overview

This application implements a complete **Events → Profiles → Timeline** flow for tracking customer behavior:

- **Event Ingestion**: RESTful API endpoint (`POST /api/events`) accepts first-party events with properties and timestamps
- **Idempotent Processing**: Database-level composite unique constraint (`customerId` + `idempotencyKey`) prevents duplicate event ingestion
- **Customer Upsert**: Automatically creates or updates customer profiles by email
- **Timeline View**: Browse all customers and view their complete event history sorted chronologically

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
│   ├── api/events/
│   │   └── route.ts           # POST /api/events endpoint
│   ├── ingest/
│   │   └── page.tsx           # Event ingestion form
│   ├── customers/
│   │   ├── page.tsx           # Customer list
│   │   └── [id]/
│   │       └── page.tsx       # Customer timeline
│   ├── layout.tsx             # Root layout
│   ├── page.tsx               # Landing page
│   └── globals.css            # Global styles
├── lib/
│   ├── __tests__/
│   │   ├── utils.test.ts      # Email validation tests
│   │   └── event-validation.test.ts  # Event validation tests
│   ├── prisma.ts              # Prisma client singleton
│   └── utils.ts               # Utility functions
├── e2e/
│   ├── home.spec.ts           # Landing page tests
│   └── event-ingestion.spec.ts  # Event flow tests
├── prisma/
│   └── schema.prisma          # Database schema
├── .github/workflows/
│   └── ci.yml                 # GitHub Actions CI
├── .env                       # Environment variables (gitignored)
├── .env.example               # Environment template
└── [config files]             # Jest, Playwright, ESLint, etc.
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

## Testing

### Unit Tests

```bash
pnpm test
```

**Coverage**:

- Email validation and normalization
- Event type validation
- Properties validation (object type check)

All validation logic is tested independently of the API layer.

### E2E Tests

```bash
# Terminal 1: Start dev server
pnpm dev

# Terminal 2: Run tests
pnpm test:e2e
```

**Coverage**:

- Full flow: ingest event → navigate to customers → view timeline
- Idempotency: submit duplicate event with same key → verify no duplication
- Navigation: browse customers list → click timeline link

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