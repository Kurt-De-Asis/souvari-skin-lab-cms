# Integrated Smart Clinic Management System with Inventory Tracking and Descriptive Analytics

## IAVE Beauty & Co.

A production-quality academic capstone web application for aesthetic clinic management, featuring inventory tracking, descriptive analytics, AI chatbot, and appointment management.

---

## Features

### Core Features
- **Customer Management** — Registration, profiles, treatment history
- **Appointment Booking** — Multi-step booking with real-time availability checking
- **Staff Management** — Schedules, service assignments, working hours
- **Service Management** — Full CRUD with inventory consumption configuration
- **Digital Treatment Records** — Post-treatment documentation and history

### Business Operations
- **POS System** — Internal point-of-sale with cart, checkout, and transaction history
- **Inventory Management** — Products with units, stock levels, movement audit trail
- **Service-Based Inventory Consumption** — Automatic stock deduction on service completion
- **Low-Stock Alerts** — Dashboard and notification-based warnings

### Communication
- **SMS Notifications** — One-way SMS with mock provider for development
- **Internal Notifications** — User notification center with read/unread tracking
- **AI Chatbot** — Clinic-focused conversational AI with safety guardrails

### Analytics & Reporting
- **Descriptive Analytics** — Revenue, appointments, services, inventory charts
- **Real Database Data** — All analytics computed from actual transactional records
- **Date Range Filters** — Today, this week, this month, custom ranges

### Access Control
- **Role-Based Access Control** — Admin, Staff, Customer roles with permission middleware
- **JWT Authentication** — Access token + httpOnly cookie refresh token strategy

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, Tailwind CSS 3.4, TypeScript |
| Backend | Node.js, Express.js, TypeScript |
| Database | MySQL 8.0 (via Prisma ORM) |
| Authentication | JWT (access + refresh tokens), bcryptjs |
| Charts | Chart.js + react-chartjs-2 |
| Validation | Zod (shared frontend/backend) |
| Icons | Lucide React |

---

## Getting Started

### Prerequisites
- Node.js 20+ (via [nvm](https://github.com/nvm-sh/nvm) or [nodejs.org](https://nodejs.org))
- MySQL 8.0 (or Docker)
- npm or yarn

### 1. Clone & Install

```bash
git clone <repository-url>
cd capstone-clinic-management-system

# Install server dependencies
cd server && npm install && cd ..

# Install client dependencies
cd client && npm install && cd ..

# Install root dependencies
npm install
```

### 2. Database Setup

**Option A: Using Docker**
```bash
docker-compose up -d
```

**Option B: Using Local MySQL**
Create a database named `iave_clinic` in your MySQL instance.

### 3. Environment Configuration

```bash
cp .env.example server/.env
```

Edit `server/.env` with your database credentials and secrets:

```env
DATABASE_URL="mysql://root:password@localhost:3306/iave_clinic"
JWT_ACCESS_SECRET="your-access-secret-change-in-production"
JWT_REFRESH_SECRET="your-refresh-secret-change-in-production"
FRONTEND_URL="http://localhost:5173"
BACKEND_URL="http://localhost:3000"
AI_API_KEY=""
SMS_PROVIDER="mock"
NODE_ENV="development"
PORT=3000
```

### 4. Database Migration & Seeding

```bash
cd server

# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev --name init

# Seed the database
npx prisma db seed

cd ..
```

### 5. Run Development

```bash
npm run dev
```

This starts both:
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3000

### Demo Accounts

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@iave.local | password123 |
| Staff | maria.santos@iave.local | password123 |
| Customer | juan.delacruz@email.com | password123 |

---

## Project Structure

```
├── client/              # React frontend
│   ├── src/
│   │   ├── api/         # Axios client + API modules
│   │   ├── components/  # Reusable UI components
│   │   ├── context/     # React context (auth)
│   │   ├── pages/       # Route-level pages
│   │   │   ├── public/  # Public clinic website
│   │   │   ├── auth/    # Login, Register
│   │   │   ├── customer/# Customer dashboard
│   │   │   ├── staff/   # Staff dashboard
│   │   │   ├── admin/   # Admin dashboard
│   │   │   └── errors/  # 404 page
│   │   └── types/       # TypeScript types
│   └── package.json
├── server/              # Express backend
│   ├── src/
│   │   ├── config/      # Environment, database
│   │   ├── middleware/   # Auth, validation, errors
│   │   ├── modules/     # Feature modules
│   │   │   ├── auth/
│   │   │   ├── customers/
│   │   │   ├── staff/
│   │   │   ├── services/
│   │   │   ├── appointments/
│   │   │   ├── products/
│   │   │   ├── inventory/
│   │   │   ├── transactions/
│   │   │   ├── treatment-records/
│   │   │   ├── notifications/
│   │   │   ├── analytics/
│   │   │   ├── ai/
│   │   │   └── settings/
│   │   ├── services/    # External service abstractions
│   │   └── utils/       # JWT, password, logger
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── seed.ts
│   └── package.json
├── docs/                # Documentation
├── docker-compose.yml
├── README.md
└── .env.example
```

---

## API Documentation

See [docs/api.md](docs/api.md) for complete API documentation.

### Base URL
```
http://localhost:3000/api
```

### Key Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /auth/register | Register new customer |
| POST | /auth/login | Login (returns JWT) |
| GET | /services/browse | Browse public services |
| POST | /appointments | Book appointment |
| GET | /appointments/availability | Check available slots |
| POST | /transactions | POS checkout |
| POST | /chat | AI chatbot message |
| GET | /analytics/dashboard | Admin dashboard KPIs |

---

## Architecture

See [docs/architecture.md](docs/architecture.md) for detailed architecture documentation.

### Request Flow
```
Frontend (React) → REST API → Express Router → Controller → Service → Prisma → MySQL
```

### External Services
- **AI**: OpenAI API with rule-based fallback when API key is unavailable
- **SMS**: Mock provider (logs to console) — switch to Semaphore (`SMS_PROVIDER=semaphore`) or TextBee (`SMS_PROVIDER=textbee`)

---

## Build for Production

```bash
# Build frontend
cd client && npm run build

# Build backend
cd server && npm run build

# Start production server
cd server && npm start
```

---

## Database Schema

20 tables with proper foreign keys, indexes, and constraints. See [docs/database.md](docs/database.md).

Key entities:
- `users`, `customers`, `staff`, `staff_schedules`
- `services`, `service_staff`, `service_inventory_items`
- `products`, `product_categories`, `inventory_movements`
- `appointments`, `appointment_status_history`
- `treatment_records`
- `transactions`, `transaction_items`
- `notifications`, `sms_logs`
- `chat_sessions`, `chat_messages`
- `system_settings`

---

## License

Academic capstone project. Not for commercial use.
