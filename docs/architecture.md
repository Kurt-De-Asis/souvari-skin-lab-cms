# System Architecture

## Overview

The IAVE Beauty & Co. Clinic Management System follows a three-tier architecture with clear separation of concerns.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    Client (React SPA)                        │
│  React 18 + Vite + Tailwind CSS + TypeScript                │
│                                                              │
│  ┌────────────┐ ┌────────────┐ ┌──────────────────────────┐ │
│  │   Public    │ │  Customer  │ │    Admin/Staff           │ │
│  │   Website   │ │  Dashboard │ │    Dashboard             │ │
│  │   /         │ │  /customer │ │    /admin, /staff        │ │
│  └────────────┘ └────────────┘ └──────────────────────────┘ │
│                                                              │
│  Axios Client (with auth interceptors + token refresh)      │
└─────────────────────────┬───────────────────────────────────┘
                          │ HTTP/REST (JSON)
                          │ Authorization: Bearer <token>
                          │ Cookie: refreshToken (httpOnly)
┌─────────────────────────┴───────────────────────────────────┐
│                  Server (Express.js)                          │
│  Node.js + Express + TypeScript + Prisma                     │
│                                                              │
│  ┌─────────┐  ┌──────────┐  ┌───────────┐  ┌───────────┐  │
│  │  Auth   │  │  Core    │  │ Inventory │  │ External  │  │
│  │ Module  │  │  Modules │  │  Module   │  │ Services  │  │
│  │ JWT +   │  │  CRUD +  │  │  Stock +  │  │ AI + SMS  │  │
│  │ RBAC    │  │ Business │  │  Movements│  │           │  │
│  │         │  │ Rules    │  │           │  │           │  │
│  └─────────┘  └──────────┘  └───────────┘  └───────────┘  │
│                                                              │
│  Routes → Controllers → Services → Prisma Client            │
└─────────────────────────┬───────────────────────────────────┘
                          │ Prisma ORM
┌─────────────────────────┴───────────────────────────────────┐
│                     MySQL 8.0                                 │
│  20 tables + 6 analytics views                               │
│  InnoDB, utf8mb4, foreign keys, indexes                      │
└─────────────────────────────────────────────────────────────┘
```

## Backend Architecture

### Module Pattern

Each feature module follows:

```
module/
├── module.routes.ts      # Express Router
├── module.controller.ts  # Request/Response handlers
├── module.service.ts     # Business logic
└── module.validation.ts  # Zod schemas
```

### Request Flow

```
1. HTTP Request → Express Router
2. Router → Validation Middleware (Zod)
3. Router → Auth Middleware (JWT verification)
4. Router → RBAC Middleware (role check)
5. Controller → Service (business logic)
6. Service → Prisma Client (database operations)
7. Service → Response → Controller → JSON Response
```

### Error Handling

- `AppError` class for operational errors (400, 404, 409, etc.)
- Global `errorHandler` middleware catches unhandled errors
- No stack traces exposed in production
- Structured JSON error responses

## Frontend Architecture

### Routing Structure

- `/` — Public pages (Home, About, Services, Contact, Booking)
- `/login`, `/register` — Authentication
- `/customer/*` — Customer dashboard (protected, role=customer)
- `/staff/*` — Staff dashboard (protected, role=staff)
- `/admin/*` — Admin dashboard (protected, role=admin)

### State Management

- React Context for authentication state
- Component-level state for page data
- API layer with Axios interceptors for token management

### Token Management

- Access token stored in JavaScript memory (React state)
- Refresh token in httpOnly cookie
- Automatic token refresh on 401 response
- Queue system for concurrent requests during refresh

## External Integrations

### AI Service (OpenAI)

```
IAIProvider interface
├── OpenAIProvider (when API key available)
└── RuleBasedAIProvider (fallback)
```

### SMS Service

```
ISMSProvider interface
├── MockSMSProvider (development - logs to console)
└── TwilioProvider (production - ready for integration)
```

## Security

- Password hashing with bcryptjs (12 rounds)
- JWT access tokens (15 min) + refresh tokens (7 days)
- httpOnly, secure cookies for refresh tokens
- Role-based access control (admin, staff, customer)
- CORS configured for frontend origin
- Rate limiting on API endpoints
- Helmet for security headers
- Input validation with Zod on all endpoints
- No secrets in source code
