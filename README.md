# UrbanFix — Backend API

A RESTful API for the UrbanFix home-services marketplace, built with **NestJS**, **MongoDB** (via Mongoose), and **JWT authentication**. Exposes endpoints for users, providers, categories, reviews, and bookings — all protected by role-based access control.

Interactive docs available at `/api/docs` (Swagger UI) when the server is running.

---

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | NestJS 10 |
| Database | MongoDB via Mongoose 8 |
| Authentication | Passport + JWT (RS256-compatible, HS256 by default) |
| Validation | `class-validator` + `class-transformer` |
| API Docs | Swagger / OpenAPI 3 |
| Package Manager | pnpm |
| Containerisation | Docker + Docker Compose |

---

## Project Structure

```
urbanfix-backend/
├── src/
│   ├── main.ts                     # Bootstrap — global pipes, CORS, Swagger, port
│   ├── app.module.ts               # Root module — wires all features + MongoDB
│   │
│   ├── auth/
│   │   ├── auth.module.ts          # JWT + Passport wiring; exports JwtModule
│   │   ├── auth.service.ts         # register() and login() — issues JWT on success
│   │   ├── auth.controller.ts      # POST /auth/register, POST /auth/login, GET /auth/me
│   │   ├── auth.types.ts           # JwtPayload type (sub, name, email, role)
│   │   ├── dto/register.dto.ts     # Validation DTO for registration
│   │   ├── dto/login.dto.ts        # Validation DTO for login
│   │   ├── guards/jwt-auth.guard.ts      # Extends AuthGuard('jwt')
│   │   └── strategies/jwt.strategy.ts   # Passport strategy — validates bearer token
│   │
│   ├── users/
│   │   ├── users.module.ts         # Exports UsersService for AuthModule
│   │   ├── users.service.ts        # CRUD + bcrypt password hashing/validation
│   │   ├── users.controller.ts     # GET/PATCH/DELETE /users — scoped by role
│   │   ├── schemas/user.schema.ts  # Mongoose schema (passwordHash never returned)
│   │   └── dto/update-user.dto.ts
│   │
│   ├── providers/
│   │   ├── providers.module.ts     # Exports ProvidersService for ReviewsModule
│   │   ├── providers.service.ts    # List with filters, CRUD, verify/unverify, updateRating()
│   │   ├── providers.controller.ts # Public list/detail + auth-gated write endpoints
│   │   ├── schemas/provider.schema.ts   # Embedded services array, rating cache
│   │   ├── dto/create-provider.dto.ts
│   │   └── dto/update-provider.dto.ts
│   │
│   ├── categories/
│   │   ├── categories.module.ts
│   │   ├── categories.service.ts   # findAll() sorted A-Z, CRUD
│   │   ├── categories.controller.ts # GET public, POST/PATCH/DELETE admin-only
│   │   ├── schemas/category.schema.ts
│   │   ├── dto/create-category.dto.ts
│   │   └── dto/update-category.dto.ts
│   │
│   ├── reviews/
│   │   ├── reviews.module.ts       # Imports ProvidersModule for rating sync
│   │   ├── reviews.service.ts      # Create with one-per-user check; recalculates avg
│   │   ├── reviews.controller.ts   # GET public, POST/DELETE auth-gated
│   │   ├── schemas/review.schema.ts     # Compound unique index (userId + providerId)
│   │   └── dto/create-review.dto.ts
│   │
│   ├── bookings/
│   │   ├── bookings.module.ts
│   │   ├── bookings.service.ts     # Role-scoped list; status lifecycle with RBAC
│   │   ├── bookings.controller.ts  # All routes require JWT
│   │   ├── schemas/booking.schema.ts    # Status enum: pending→confirmed→in_progress→completed
│   │   ├── dto/create-booking.dto.ts
│   │   └── dto/update-booking-status.dto.ts
│   │
│   ├── common/
│   │   ├── decorators/
│   │   │   ├── current-user.decorator.ts  # @CurrentUser() — extracts JWT payload
│   │   │   └── roles.decorator.ts         # @Roles('admin') — sets metadata for RolesGuard
│   │   ├── guards/
│   │   │   └── roles.guard.ts             # Reads @Roles() metadata; checks user.role
│   │   └── filters/
│   │       └── http-exception.filter.ts   # Uniform { statusCode, message, path } envelope
│   │
│   └── seed.ts                     # One-time DB seed — drops and recreates demo data
├── .env.example                    # Required environment variables
├── Dockerfile                      # Multi-stage production image
└── docker-compose.yml              # API + MongoDB for local development
```

---

## Getting Started

### Prerequisites

- **Node.js** ≥ 20
- **pnpm** ≥ 9
- **MongoDB** running locally on port 27017 **or** use Docker Compose (see below)

### Option A — Docker Compose (recommended)

Starts the API and MongoDB together with a single command:

```bash
docker compose up --build
```

The API is available at `http://localhost:4000/api`.

### Option B — Local Node

**1. Install dependencies**

```bash
pnpm install
```

**2. Configure environment**

```bash
cp .env.example .env
```

Edit `.env` and set at minimum:

```env
MONGODB_URI=mongodb://localhost:27017/urbanfix
JWT_SECRET=replace-with-a-long-random-string
```

**3. Seed the database** *(first run only)*

```bash
pnpm seed
```

**4. Start the development server**

```bash
pnpm start:dev
```

API: `http://localhost:4000/api`
Swagger: `http://localhost:4000/api/docs`

---

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `MONGODB_URI` | `mongodb://localhost:27017/urbanfix` | MongoDB connection string |
| `JWT_SECRET` | `dev-secret-change-in-production` | HMAC secret for signing JWTs — **change in production** |
| `JWT_EXPIRES_IN` | `7d` | Token expiry (e.g. `1d`, `7d`, `30d`) |
| `PORT` | `4000` | HTTP port the server listens on |
| `FRONTEND_URL` | `http://localhost:3001` | Allowed CORS origin |

---

## API Overview

All routes are prefixed with `/api`. Full interactive documentation is at `/api/docs`.

### Auth — public
| Method | Path | Description |
|---|---|---|
| `POST` | `/auth/register` | Create a new account and receive a JWT |
| `POST` | `/auth/login` | Exchange credentials for a JWT |
| `GET` | `/auth/me` | Return the current user's profile (JWT required) |

### Categories — public reads
| Method | Path | Description |
|---|---|---|
| `GET` | `/categories` | List all categories |
| `GET` | `/categories/:id` | Get a single category |
| `POST` | `/categories` | Create category **(admin)** |
| `PATCH` | `/categories/:id` | Update category **(admin)** |
| `DELETE` | `/categories/:id` | Delete category **(admin)** |

### Providers — public reads
| Method | Path | Description |
|---|---|---|
| `GET` | `/providers` | List providers (filterable by category, location, rating, verified, search) |
| `GET` | `/providers/me` | Get the calling user's provider profile |
| `GET` | `/providers/:id` | Get a single provider |
| `POST` | `/providers` | Create provider profile **(provider / admin)** |
| `PATCH` | `/providers/:id` | Update provider **(owner / admin)** |
| `PATCH` | `/providers/:id/verify` | Verify provider **(admin)** |
| `PATCH` | `/providers/:id/unverify` | Remove verification **(admin)** |
| `DELETE` | `/providers/:id` | Delete provider **(owner / admin)** |

### Reviews — public reads
| Method | Path | Description |
|---|---|---|
| `GET` | `/reviews?providerId=…` | Paginated reviews for a provider |
| `POST` | `/reviews` | Submit a review **(authenticated, one per provider)** |
| `DELETE` | `/reviews/:id` | Delete a review **(owner / admin)** |

### Bookings — all authenticated
| Method | Path | Description |
|---|---|---|
| `GET` | `/bookings` | List bookings (auto-scoped: user → own, provider → theirs, admin → all) |
| `GET` | `/bookings/:id` | Get a single booking |
| `POST` | `/bookings` | Create a booking |
| `PATCH` | `/bookings/:id/status` | Update booking status |
| `PATCH` | `/bookings/:id/cancel` | Cancel a booking |

### Users — all authenticated
| Method | Path | Description |
|---|---|---|
| `GET` | `/users` | List all users **(admin)** |
| `GET` | `/users/:id` | Get a user (own profile or admin) |
| `PATCH` | `/users/:id` | Update a user (own profile or admin) |
| `DELETE` | `/users/:id` | Delete a user **(admin)** |

---

## Authorization Model

| Role | What they can do |
|---|---|
| `user` | Read public data, create bookings, write reviews, manage own profile |
| `provider` | Everything a user can do, plus create/manage their provider profile |
| `admin` | Full access — verify providers, manage all users and categories |

JWT payloads include `sub` (user ID), `name`, `email`, and `role`. Guards (`JwtAuthGuard` + `RolesGuard`) + the `@Roles()` decorator enforce access at the route level. Ownership checks (can only edit your own profile) happen inside service methods.

---

## Demo Accounts

Run `pnpm seed` to create these accounts (password: **`password123`**):

| Role | Email |
|---|---|
| User | `user@demo.com` |
| Provider | `provider@demo.com` |
| Admin | `admin@demo.com` |

---

## Scripts

```bash
pnpm start:dev    # Watch mode — auto-restarts on file changes
pnpm build        # Compile TypeScript to dist/
pnpm start        # Run compiled build (production)
pnpm seed         # Drop and reseed the database with demo data
pnpm lint         # ESLint
```

---

## Related

- [urbanfix-frontend](../urbanfix-frontend) — Next.js 16 frontend
