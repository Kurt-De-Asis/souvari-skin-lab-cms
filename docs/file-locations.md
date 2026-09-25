# System & File Location Map

This document is the "where is it?" index for the IAVE Beauty & Co. Clinic Management System.
Every feature you see in the browser, and every API that powers it, lives in a predictable place.

> All paths below are relative to the project root (`/` = the repository folder that contains `client/`, `server/`, and `docs/`).

---

## 1. Project Map (top level)

| Path | What it is |
|------|-----------|
| `client/` | The **frontend** — a React + Vite + Tailwind single-page app (what users see in the browser) |
| `server/` | The **backend** — an Express + TypeScript API that all frontend requests talk to |
| `docs/` | Documentation (this file, plus architecture, API, database, business rules, deployment, testing) |
| `package.json` | Root scripts that run both the client and the server together |
| `docker-compose.yml` | Optional Docker setup (usually for running MySQL) |
| `.env.example` | Template of every environment variable the system needs |
| `README.md` | Project overview and "getting started" instructions |

---

## 2. Frontend — Entry, Routing & Setup

| What | File |
|------|------|
| Browser entry point (mounts the app) | `client/src/main.tsx` |
| **All URL routes → page files** (the single most useful file) | `client/src/App.tsx` |
| HTML shell, page `<title>`, favicon, Google Fonts | `client/index.html` |
| Vite config — port `5173`, `/api` proxy → `localhost:3000`, `@` alias | `client/vite.config.ts` |
| Tailwind design system — colors, fonts, tokens | `client/tailwind.config.js` |
| Global CSS — custom utility classes | `client/src/index.css` |

### The route map (from `App.tsx`)

| URL | Page file |
|-----|-----------|
| `/` | `client/src/pages/public/Home.tsx` |
| `/about` | `client/src/pages/public/About.tsx` |
| `/services` | `client/src/pages/public/PublicServices.tsx` |
| `/services/:id` | `client/src/pages/public/ServiceDetail.tsx` |
| `/booking` | `client/src/pages/public/BookingPage.tsx` |
| `/booking/confirmation` | `client/src/pages/public/BookingConfirmation.tsx` |
| `/membership-plans` | `client/src/pages/public/MembershipPlans.tsx` |
| `/contact` | `client/src/pages/public/Contact.tsx` |
| `/login` | `client/src/pages/auth/Login.tsx` |
| `/register` | `client/src/pages/auth/Register.tsx` |
| `/customer` (index) | `client/src/pages/customer/Dashboard.tsx` |
| `/customer/appointments` | `client/src/pages/customer/Appointments.tsx` |
| `/customer/book` | `client/src/pages/customer/BookAppointment.tsx` |
| `/customer/transactions` | `client/src/pages/customer/Transactions.tsx` |
| `/customer/notifications` | `client/src/pages/customer/Notifications.tsx` |
| `/customer/profile` | `client/src/pages/customer/Profile.tsx` |
| `/customer/chat` | `client/src/pages/customer/Chatbot.tsx` |
| `/customer/membership` | `client/src/pages/customer/Membership.tsx` |
| `/staff` (index) | `client/src/pages/staff/Dashboard.tsx` |
| `/staff/appointments` | `client/src/pages/staff/Appointments.tsx` |
| `/staff/calendar` | `client/src/pages/admin/Calendar.tsx` |
| `/staff/schedule` | `client/src/pages/staff/Schedule.tsx` |
| `/staff/notifications` | `client/src/pages/staff/Notifications.tsx` |
| `/admin` (index) | `client/src/pages/admin/Dashboard.tsx` |
| `/admin/customers` | `client/src/pages/admin/Customers.tsx` |
| `/admin/staff` | `client/src/pages/admin/Staff.tsx` |
| `/admin/shifts` | `client/src/pages/admin/Shifts.tsx` |
| `/admin/services` | `client/src/pages/admin/Services.tsx` |
| `/admin/services/new` (also `/edit`) | `client/src/pages/admin/NewService.tsx` |
| `/admin/products` | `client/src/pages/admin/Products.tsx` |
| `/admin/inventory` | `client/src/pages/admin/Inventory.tsx` |
| `/admin/appointments` | `client/src/pages/admin/Appointments.tsx` |
| `/admin/calendar` | `client/src/pages/admin/Calendar.tsx` |
| `/admin/transactions` | `client/src/pages/admin/Transactions.tsx` |
| `/admin/analytics` | `client/src/pages/admin/Analytics.tsx` |
| `/admin/settings` | `client/src/pages/admin/Settings.tsx` |
| `/admin/membership-plans` | `client/src/pages/admin/MembershipPlans.tsx` |
| `/admin/memberships` | `client/src/pages/admin/Memberships.tsx` |
| `/admin/packages` | `client/src/pages/admin/Packages.tsx` |
| `/admin/notifications` | `client/src/pages/admin/Notifications.tsx` |
| any other URL | `client/src/pages/errors/NotFound.tsx` |

---

## 3. Frontend — Pages by Feature

### Public website (`client/src/pages/public/`)
| Feature | File |
|---------|------|
| Homepage (hero, marquee, stats, featured treatments) | `Home.tsx` |
| About (founder story, timeline, IAVE Method, medical side, CTA) | `About.tsx` |
| Services catalog / list | `PublicServices.tsx` |
| Single service detail | `ServiceDetail.tsx` |
| **Online booking flow** (single-treatment & multi-select modes) | `BookingPage.tsx` |
| Booking confirmation screen | `BookingConfirmation.tsx` |
| Membership plans showcase | `MembershipPlans.tsx` |
| Contact page + message form | `Contact.tsx` |

### Login / registration (`client/src/pages/auth/`)
| Feature | File |
|---------|------|
| Login | `Login.tsx` |
| Register | `Register.tsx` |

### Customer dashboard (`client/src/pages/customer/`)
| Feature | File |
|---------|------|
| Overview | `Dashboard.tsx` |
| My appointments | `Appointments.tsx` |
| Book an appointment (in-dashboard) | `BookAppointment.tsx` |
| Purchase history / treatment records | `Transactions.tsx` |
| Notifications | `Notifications.tsx` |
| Profile | `Profile.tsx` |
| Chat with the clinic bot | `Chatbot.tsx` |
| My membership & perks | `Membership.tsx` |

### Staff dashboard (`client/src/pages/staff/`)
| Feature | File |
|---------|------|
| Overview | `Dashboard.tsx` |
| My appointments + complete treatment | `Appointments.tsx` |
| Weekly schedule | `Schedule.tsx` |
| Notifications | `Notifications.tsx` |

### Admin dashboard (`client/src/pages/admin/`)
| Feature | File |
|---------|------|
| Overview KPIs | `Dashboard.tsx` |
| Customers | `Customers.tsx` |
| Staff & team | `Staff.tsx` |
| Staff shifts | `Shifts.tsx` |
| Services list | `Services.tsx` |
| Create / edit a service (form + inventory consumption + staff assignment) | `NewService.tsx` |
| Products / POS catalog | `Products.tsx` |
| Inventory & stock adjustments | `Inventory.tsx` |
| Appointments manager | `Appointments.tsx` |
| Calendar view | `Calendar.tsx` |
| Transactions / POS history | `Transactions.tsx` |
| Analytics charts | `Analytics.tsx` |
| Settings | `Settings.tsx` |
| Membership plans | `MembershipPlans.tsx` |
| Member enrollments | `Memberships.tsx` |
| Service packages | `Packages.tsx` |
| Notifications | `Notifications.tsx` |

> Extra admin pages that exist as files but are not routed: `Loyalty.tsx`, `MonthlyPerks.tsx`, `MembershipGifts.tsx`.

---

## 4. Frontend — Components

### Layout (`client/src/components/layout/`)
| File | Purpose |
|------|---------|
| `PublicLayout.tsx` | Header, footer, mobile nav + chatbot launcher for all public pages |
| `DashboardLayout.tsx` | Sidebar + topbar shell shared by customer/staff/admin dashboards |

### Reusable UI (`client/src/components/ui/`)
| File | Purpose |
|------|---------|
| `Modal.tsx` | Generic modal dialog |
| `Drawer.tsx` | Side-drawer panel |
| `Pagination.tsx` | Paged table controls |
| `StatusBadge.tsx` | Colored status pill (e.g., confirmed/completed) |

### Shared (`client/src/components/shared/`)
| File | Purpose |
|------|---------|
| `LoadingSpinner.tsx` | Loading indicator |
| `EmptyState.tsx` | "Nothing here yet" placeholder |
| `GroupTabs.tsx` | Tabbed navigation |
| `PriceChip.tsx` | Price display chip |
| `VerificationBanner.tsx` | Email-verification notice |

### Booking flow (`client/src/components/booking/`)
| File | Purpose |
|------|---------|
| `BookingSteps.tsx` | Step indicator header |
| `CategorySelector.tsx` | Treatment-group picker (multi-mode home) |
| `TreatmentSelector.tsx` | Single-treatment picker |
| `ServiceSelector.tsx` | Multi-select services mode |
| `StaffSelector.tsx` | Choose a specialist |
| `DateSelector.tsx` | Pick a date |
| `TimeSlotPicker.tsx` | Pick an available time |
| `BookingSummary.tsx` | Review of the quote before confirming |

### Booking (admin side) (`client/src/components/booking/admin/`)
| File | Purpose |
|------|---------|
| `BookingGrid.tsx` | Calendar/time grid for admin |
| `CreateBookingDrawer.tsx` | Admin creates a booking |
| `EditAppointmentDrawer.tsx` | Admin edits a booking |
| `AppointmentDetailsDrawer.tsx` | Booking detail panel |
| `types.ts` | Shared types for the above |

### Analytics (`client/src/components/analytics/`)
| File | Purpose |
|------|---------|
| `ChartCard.tsx` | Wrapper for a chart |
| `KpiCard.tsx` | Big-number statistic card |
| `DeltaBadge.tsx` | Up/down percentage badge |
| `StaffPerformanceTable.tsx` | Provider performance table |

### Chatbot (`client/src/components/chatbot/`)
| File | Purpose |
|------|---------|
| `ChatbotWidget.tsx` | Floating chat button (mounted in `PublicLayout`, Login, Register, Contact, BookingConfirmation) |
| `ChatbotWindow.tsx` | The chat window + conversation UI |

---

## 5. Frontend — Data Layer, State & Utilities

| What | File |
|------|------|
| Axios setup — base URL `/api`, token headers, 401 refresh queue | `client/src/api/axios.ts` |
| **All API client objects** (`authApi`, `appointmentsApi`, … mapping to backend endpoints) | `client/src/api/index.ts` |
| Auth state provider (current user, login/logout) | `client/src/context/AuthContext.tsx` |
| Currency / date / percent formatters | `client/src/utils/format.ts` |
| Service category label helper | `client/src/utils/formatCategory.ts` |

### Styling system
| What | File |
|------|------|
| Custom classes: `.btn-gold`, `.btn-outline-light`, `.text-outline`, `.input-field`, `.label`, `.animate-marquee` | `client/src/index.css` |
| Palette: `primary` (brass `#b08d57`), `neutral` (ivory/charcoal `#1c1a15`), `charcoal` `#17171c`, `ink` `#101014` | `client/tailwind.config.js` |
| Fonts: Inter (sans / body), Cormorant Garamond (`font-display` / headings) | `client/tailwind.config.js` + `client/index.html` |
| Images (home hero, portraits, treatments) | `client/public/images/` |

---

## 6. Backend — Entry, Config & Middleware

| What | File |
|------|------|
| Server bootstrap (port 3000, connects DB) | `server/src/server.ts` |
| Express app — security, CORS, rate limit, **all module mounts** | `server/src/app.ts` |
| Environment variables (validated with Zod) | `server/src/config/env.ts` |
| Prisma client singleton | `server/src/config/database.ts` |
| JWT verification middleware | `server/src/middleware/auth.ts` |
| Role check middleware (admin/staff/customer) | `server/src/middleware/authorize.ts` |
| Zod validation middleware | `server/src/middleware/validate.ts` |
| Global error handler + 404 | `server/src/middleware/errorHandler.ts` |

`server/src/app.ts` mounts every feature behind `/api/<name>`. Those mounts are listed in the
module table below; changing the mount path is a one-line edit there.

---

## 7. Backend — Modules (the heart of the system)

Every feature module uses the **same 4-file convention**:

```
server/src/modules/<feature>/
├── <feature>.routes.ts       # URL endpoints for the module
├── <feature>.controller.ts   # Request/response handling
├── <feature>.service.ts      # Business logic + database access (Prisma)
└── <feature>.validation.ts   # Zod input schemas
```

| API base path (in `app.ts`) | Module folder | Feature |
|-----------------------------|---------------|---------|
| `/api/auth` | `modules/auth/` | Login, register, refresh, logout, profile |
| `/api/customers` | `modules/customers/` | Customer records & self-service |
| `/api/staff` | `modules/staff/` | Staff, schedules, availability, service assignment |
| `/api/services` | `modules/services/` | Service catalog, browse, staff & inventory config |
| `/api/products` | `modules/products/` | POS products & categories |
| `/api/appointments` | `modules/appointments/` | **Booking**, availability, calendar, status, group bookings |
| `/api/inventory` | `modules/inventory/` | Stock levels, adjustments, purchases |
| `/api/transactions` | `modules/transactions/` | POS sales, void, refund |
| `/api/treatment-records` | `modules/treatment-records/` | Post-treatment documentation |
| `/api/notifications` | `modules/notifications/` | In-app notification center |
| `/api/analytics` | `modules/analytics/` | Dashboard KPIs, revenue, trends, services, inventory charts |
| `/api/chat` | `modules/ai/` | AI chatbot |
| `/api/settings` | `modules/settings/` | Clinic settings (public + admin) |
| `/api/membership-plans` | `modules/membership-plans/` | Membership plan catalog |
| `/api/memberships` | `modules/memberships/` | Member enrollments, status, extend, validation |
| `/api/loyalty` | `modules/loyalty/` | Loyalty milestones & progress |
| `/api/monthly-perks` | `modules/monthly-perks/` | Monthly membership perks |
| `/api/membership-gifts` | `modules/membership-gifts/` | Gift benefits & approval |
| `/api/service-packages` | `modules/service-packages/` | Bundled treatment packages |
| `/api/pos` | `modules/pos/` | Point-of-sale cart / checkout |
| `/api/service-categories` | `modules/service-categories/` | Service grouping |
| `/api/resources` | `modules/resources/` | Clinic resources & assignment to services |
| `/api/service-addons` | `modules/service-addons/` | Add-on upsell items |
| `/api/contact` | `modules/contact/` | Contact form messages |

> The **frontend ↔ backend bridge** is `client/src/api/index.ts`: every `*Api` object there calls
> the endpoints defined in the matching `*.routes.ts` file above.

---

## 8. Backend — Services & Utilities

| What | File |
|------|------|
| AI provider selection | `server/src/services/ai.service.ts` |
| Rule-based chatbot fallback (no API key) | `server/src/services/rule-based-ai.provider.ts` |
| Pricing math (prices/variants matrix) | `server/src/services/pricing-engine.core.ts` (+ `.core.test.ts`) |
| Pricing service wrapper | `server/src/services/pricing.service.ts` |
| Notification dispatch (in-app/SMS routing) | `server/src/services/notification-dispatch.service.ts` |
| SMS layer + mock/semaphore/textbee providers | `server/src/services/sms.service.ts`, `mock-sms.provider.ts`, `semaphore-sms.provider.ts`, `textbee-sms.provider.ts` |
| JWT helpers | `server/src/utils/jwt.ts` |
| Password hashing | `server/src/utils/password.ts` |
| Pagination helpers | `server/src/utils/pagination.ts` |
| Logging (Winston) | `server/src/utils/logger.ts` |
| Express type augmentation | `server/src/types/express.d.ts` |

---

## 9. Database (Prisma + MySQL)

| What | Files |
|------|-------|
| **Schema — every table** (36 models) | `server/prisma/schema.prisma` |
| Generated migrations (history of DB schema changes) | `server/prisma/migrations/` |
| Main seed (users, customers, services, appointments, transactions…) | `server/prisma/seed.ts` |
| Product/service catalog seed | `server/prisma/seed-catalog.ts` |
| Membership & loyalty seeds | `server/prisma/seed-memberships.ts`, `seed-loyalty.ts` |
| Employee/team seed | `server/prisma/seed-employees.ts` |
| Service↔staff assignment seed | `server/prisma/seed-service-staff.ts` |
| One-off data-fix scripts | `server/prisma/fix-booking-data.ts`, `fix-treatment-records.ts`, `backfill-*.ts`, `add-queenie.ts` |

### Tables in `schema.prisma`

`users`, `customers`, `staff`, `staff_schedules`, `services`, `service_staff`,
`service_inventory_items`, `service_groups`, `service_variants`, `service_packages`,
`product_categories`, `products`, `inventory_movements`, `appointments`,
`appointment_status_history`, `treatment_records`, `transactions`, `transaction_items`,
`notifications`, `sms_logs`, `chat_sessions`, `chat_messages`, `system_settings`,
`membership_plans`, `membership_installment_options`, `memberships`, `membership_benefits`,
`loyalty_progress`, `loyalty_milestones`, `monthly_perks`, `membership_gifts`,
`membership_activity_logs`, `service_categories`, `resources`, `service_resources`, `service_addons`.

---

## 10. "Where is X?" — Quick Index

| I want to find… | Go to |
|-----------------|-------|
| The homepage | `client/src/pages/public/Home.tsx` |
| The About page (founder story) | `client/src/pages/public/About.tsx` |
| The booking flow | `client/src/pages/public/BookingPage.tsx` + `client/src/components/booking/` |
| The booking confirmation screen | `client/src/pages/public/BookingConfirmation.tsx` |
| The login form | `client/src/pages/auth/Login.tsx` |
| The admin dashboard | `client/src/pages/admin/Dashboard.tsx` |
| The admin appointments manager | `client/src/pages/admin/Appointments.tsx` |
| The analytics charts | `client/src/pages/admin/Analytics.tsx` + `client/src/components/analytics/` |
| The admin settings page | `client/src/pages/admin/Settings.tsx` |
| The customer "my bookings" page | `client/src/pages/customer/Appointments.tsx` |
| The staff appointment/complete view | `client/src/pages/staff/Appointments.tsx` |
| How pages map to URLs | `client/src/App.tsx` |
| All API client calls (frontend) | `client/src/api/index.ts` (axios: `client/src/api/axios.ts`) |
| Appointment/booking API (backend) | `server/src/modules/appointments/appointments.service.ts` (+ `.routes.ts`) |
| Login/auth API | `server/src/modules/auth/auth.service.ts` |
| Services CRUD API | `server/src/modules/services/services.service.ts` |
| Analytics logic | `server/src/modules/analytics/analytics.service.ts` |
| Which URL each backend module serves | `server/src/app.ts` |
| The database schema | `server/prisma/schema.prisma` |
| Colors / fonts / design tokens | `client/tailwind.config.js` |
| Custom button classes | `client/src/index.css` |
| The chatbot | `client/src/components/chatbot/` + `server/src/modules/ai/` + `server/src/services/rule-based-ai.provider.ts` |
| Environment variables | `.env.example` + `server/src/config/env.ts` |
| How to run everything | root `package.json` scripts + `README.md` |

---

## 11. Common Commands

| Command (run from project root) | What it does |
|--------------------------------|--------------|
| `npm run dev` | Starts backend (`:3000`) and frontend (`:5173`) together |
| `npm run build` | Builds the frontend (`client/dist`) |
| `npm run db:migrate` | Apply Prisma migrations |
| `npm run db:generate` | Regenerate the Prisma client |
| `npm run db:seed` | Run the main seed |
| `npm run db:studio` | Open Prisma Studio (visual DB explorer at a local URL) |
| `npm run db:reset` | Reset and re-migrate the database |

Per-project scripts live in `client/package.json` (`dev`, `build`, `preview`) and
`server/package.json` (`dev`, `build`, `start`, `db:*`).

> Formal reference docs: `docs/api.md` (endpoints), `docs/architecture.md` (system design),
> `docs/business-rules.md` (rules), `docs/database.md` (schema details), `docs/deployment.md`,
> `docs/testing.md`. For a plain-language tour of the code, see `docs/client-guide.md`.