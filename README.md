# Potato — Good Food. Zero Chaos.

> **Potato** is a premium food-delivery web application built around a **durable, deterministic kitchen order queue**. Unlike traditional delivery apps that dump unsequenced orders onto kitchen staff, Potato guarantees transactional FIFO dispatch, atomic order claiming (`FOR UPDATE SKIP LOCKED`), express priority jumping, and idempotent double-billing protection.

---

## 🥔 Core Architectural Principles

1. **Durable Kitchen Queue**: Orders are enqueued into PostgreSQL upon customer checkout. PostgreSQL is the single source of truth for all queue state.
2. **Deterministic Priority & FIFO**:
   - `EXPRESS` orders (Priority Rank 1) safely jump ahead of pending regular orders.
   - `REGULAR` orders (Priority Rank 2) are processed in strict arrival order (FIFO).
   - Once an order is claimed into preparation (`CLAIMED` / `PREPARING`), higher priority incoming tickets will **never** interrupt or reorder it.
3. **Atomic Concurrency Safety**: Kitchen workers claim tickets using PostgreSQL row-level locks (`SELECT ... FOR UPDATE SKIP LOCKED`), preventing double-claims across concurrent stations.
4. **Zero Double-Billing**: Every checkout attempt requires a client-generated `idempotencyKey` preventing duplicate orders on retries or network drops.
5. **Transactional Outbox**: Status transitions and new orders write to an `outbox_events` table within the same ACID transaction, periodically published by background workers.

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 18, Vite 5, TypeScript 5, Tailwind CSS, TanStack Query v5, React Hook Form + Zod, GSAP 3 (with `prefers-reduced-motion` safety), Lucide React |
| **Backend** | Java 21, Spring Boot 3.3.4, Spring Data JPA, Spring Security 6, Jakarta Validation, Flyway Migrations, Maven |
| **Primary Database** | PostgreSQL 16 with UUID primary keys & B-Tree indexes |
| **Event & Cache** | Redis 7 & Spring Data Redis |
| **Containers** | Multi-stage Dockerfiles & Docker Compose orchestrating DB, Redis, API, Worker, and Nginx |
| **Testing** | JUnit 5, Mockito, JaCoCo, Vitest, React Testing Library |

---

## 🎨 Visual Identity & Design Tokens

Designed with a warm editorial culinary aesthetic:
- **Background**: `#F4F1E8` (Warm Ivory)
- **Surface**: `#FFFEFA` (Porcelain)
- **Ink**: `#171914` (Deep Near-Black)
- **Muted**: `#64675D` (Warm Slate)
- **Olive**: `#303B2C` (Deep Hearth Olive)
- **Lime Accent**: `#D8F36A` (Restrained Acid Lime)
- **Border**: `#E1E0D6` (Fine Line)

---

## 👥 Seed Demo Accounts

The database is pre-seeded with 3 role-based demo accounts accessible via one-click login buttons on the `/login` page:

| Role | Email | Password | Permissions & Views |
|---|---|---|---|
| **Customer** | `customer@potato.local` | `PotatoDemo123!` | Browse restaurants, cart management, checkout, order tracking, order history |
| **Kitchen Staff** | `kitchen@potato.local` | `PotatoKitchen123!` | `/kitchen` live KDS queue, peek next, atomic claim, status state transitions |
| **Admin** | `admin@potato.local` | `PotatoAdmin123!` | `/admin` metrics, restaurant/menu catalogue management, user role inspection |

---

## 🚀 Quick Start Guide

### Option 1: Docker Compose (All-in-One)

Ensure Docker and Docker Compose are installed and running:

```bash
# 1. Clone or navigate to the repository
cd Potato

# 2. Copy the environment configuration
cp .env.example .env

# 3. Build and launch all services (postgres, redis, backend, worker, frontend)
docker compose up -d --build

# 4. Access the web app
# Frontend: http://localhost:5173
# API / Swagger / Actuator: http://localhost:8080/actuator/health
```

### Option 2: Running Locally for Development

#### Prerequisites
- Java 21 JDK
- Apache Maven 3.9+
- Node.js 20+ & npm
- PostgreSQL 16 & Redis 7 (or run via `docker compose up -d postgres redis`)

#### 1. Backend Service
```bash
cd backend
mvn clean spring-boot:run
```
*Backend runs on `http://localhost:8080` (Flyway automatically runs migrations `V1__init_schema.sql` and `V2__seed_data.sql`).*

#### 2. Frontend Application
```bash
cd frontend
npm install
npm run dev
```
*Frontend runs on `http://localhost:5173`.*

---

## 🧪 Test Suite & Verification Results

All tests have been executed locally. Below is the honest report of verified suites:

### Backend Test Results (Maven + JUnit 5 + Mockito)
```text
[INFO] Results:
[INFO] Tests run: 22, Failures: 0, Errors: 0, Skipped: 0
[INFO] BUILD SUCCESS
```
- `AuthServiceTest`: Registration, duplicate email conflict, password hashing, login verification, token rotation, and logout token revocation.
- `KitchenQueueServiceTest`: Empty queue exception handling (409), strict FIFO arrival order, express priority jumping (Rank 1 over Rank 2), non-mutating peek operations, and status transition constraints (`QUEUED` ➔ `CLAIMED` ➔ `PREPARING` ➔ `READY` ➔ `DISPATCHED` ➔ `DELIVERED`).
- `KitchenQueueConcurrencyTest`: Multi-threaded atomic claims verifying zero double-allocations under contention.
- `OrderServiceTest`: Idempotency key preservation, server-side `BigDecimal` rounding for totals/tax/delivery, customer order isolation, and cancellation rules.
- `CartServiceTest`: Cart calculations, item updates, and restaurant exclusivity validation.

### Frontend Test Results (Vitest + React Testing Library)
```text
 ✓ src/lib/utils.test.ts (4 tests)
 ✓ src/components/ui/Card.test.tsx (2 tests)
 ✓ src/components/ui/Badge.test.tsx (3 tests)
 ✓ src/components/ui/Button.test.tsx (3 tests)

 Test Files  4 passed (4)
      Tests  12 passed (12)
```
- Tested type safety and production compilation: `tsc && vite build` built clean with 0 errors.

---

## 📡 REST API Specification (`/api/v1`)

All API responses strictly adhere to standardized response envelopes:
- **Success Envelope**: `{ "success": true, "data": ..., "message": "...", "timestamp": "..." }`
- **Error Envelope**: `{ "success": false, "error": { "code": "...", "message": "..." }, "timestamp": "..." }`

### Endpoints
- `POST /api/v1/auth/register` — Create customer account
- `POST /api/v1/auth/login` — Sign in and receive JWT + Refresh Token
- `POST /api/v1/auth/refresh` — Rotate refresh token
- `POST /api/v1/auth/logout` — Revoke active token
- `GET  /api/v1/auth/me` — Current user profile
- `GET  /api/v1/restaurants` — Searchable & filterable restaurant listings
- `GET  /api/v1/restaurants/:slug` — Restaurant details and menu categories
- `GET  /api/v1/cart` — User's active cart with calculated subtotal, tax, and fees
- `POST /api/v1/cart/items` — Add dish to cart (enforces single restaurant)
- `PUT  /api/v1/cart/items/:id` — Update item quantity
- `DELETE /api/v1/cart/items/:id` — Remove item from cart
- `DELETE /api/v1/cart` — Clear entire cart
- `POST /api/v1/checkout` — Place order with idempotency key and demo payment
- `GET  /api/v1/orders/:id` — Order status timeline and item snapshots
- `POST /api/v1/orders/:id/cancel` — Cancel queued order (owner or admin only)
- `GET  /api/v1/account/orders` — Customer order history
- `GET  /api/v1/kitchen/queue` — Full pending order queue in priority/FIFO order
- `GET  /api/v1/kitchen/status` — Real-time telemetry (total, express, regular pending)
- `GET  /api/v1/kitchen/queue/peek` — Non-mutating peek of next eligible order
- `POST /api/v1/kitchen/queue/process-next` — Concurrency-safe atomic claim
- `PATCH /api/v1/kitchen/orders/:id/status` — Advance preparation state
- `GET  /api/v1/kitchen/orders/recent` — Recently completed tickets
- `GET  /api/v1/admin/metrics` — Platform-wide performance and revenue metrics
- `GET  /actuator/health` — Spring Boot health check
