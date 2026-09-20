# Explaining the System to Clients — A Presenter's Guide

This guide is for *you* (the person who owns or handles the code) to explain the system to someone
who is **not a developer** — a clinic owner, a manager, a capstone panel, or a new client. It works
two ways:

1. **Tell me what it is** — a short, plain-language summary you can give in 30 seconds.
2. **Show me the code** — a literal, step-by-step tour you can follow and repeat, so you can teach
   anyone where things live and how the pieces fit.

No prior coding knowledge is assumed. When a technical name appears, a plain explanation follows.

---

## 1. The System in One Breath

> "IAVE is a clinic management website with **three kinds of screens**. Customers see the **public
> website** — the homepage, services, booking, and contact. After logging in, there are three
> **dashboards**: one for **customers**, one for **staff**, and a bigger one for the **admin**.
> Everything you see on any screen is saved in a **database**, and the website talks to the database
> through a middle layer called the **API**. If a page shows it, the API fetched it; if you save it,
> the API stored it."

That's the whole mental model: **Screen → API → Database**.

---

## 2. The Three Big Ideas to Teach First

### Idea #1 — The three tiers

```
┌────────────────┐   request   ┌────────────────┐    SQL    ┌──────────────┐
│   The Screens   │ ──────────► │  The API       │ ─────────► │ The Database  │
│  (React app)    │ ◄────────── │  (Express API) │ ◄───────── │ (MySQL)      │
│  client/        │  response   │  server/       │           │ prisma/*     │
└────────────────┘             └────────────────┘           └──────────────┘
```

- **The Screens** = the "face" of the app. All code that draws buttons, forms, and charts lives in `client/`.
- **The API** = the "receptionist". It receives every request, checks who is asking, applies the rules, and talks to the database. All its code lives in `server/`. Every URL it serves starts with `/api/...`.
- **The Database** = the "filing cabinet". Every customer, appointment, and payment is stored here. The structure of the cabinet is described in one file (`server/prisma/schema.prisma`).

### Idea #2 — The three user worlds

| World | Who | Path | Example |
|-------|-----|------|---------|
| **Public** | Anyone visiting | `/`, `/services`, `/booking` | Browse treatments, book online, contact the clinic |
| **Customer** | A logged-in client | `/customer/...` | View own bookings, history, membership |
| **Staff / Admin** | Clinic employees | `/staff/...`, `/admin/...` | Manage schedules, clients, inventory, money, reports |

Every screen in the system belongs to exactly one of these worlds, and each world has its own folder
under `client/src/pages/` — `public/`, `customer/`, `staff/`, `admin/`. **If you know the world, you
can guess the folder.**

### Idea #3 — Every backend feature follows the same recipe

Backend features live in `server/src/modules/<feature>/` and always have the same 4 files:

```
appointments.routes.ts       → the "menu" of URLs for this feature
appointments.controller.ts   → the "waiter" who receives the order
appointments.service.ts      → the "kitchen" where the real work happens
appointments.validation.ts   → the "order form" that checks what was typed
```

Once you've seen one feature, you've seen them all. If someone asks "how does X work?", you open
`X.service.ts` and read.

---

## 3. The Request Flow, Told Like a Restaurant

1. A visitor clicks **"Book"** on a page.
2. The page file calls an API helper — e.g. `appointmentsApi.create(...)` in `client/src/api/index.ts`.
3. That helper sends a message to the API: `POST /api/appointments`.
4. `server/src/app.ts` received the message and passes it to the `appointments` module.
5. The module's `service.ts` checks the rules (is the slot free? is the customer real?) and saves the
   booking to the **appointments table** in MySQL.
6. The result travels back the same way: Database → service → controller → API → page → screen.

Most things in the system are exactly this: a button, an API call, a rule, a database row.

---

## 4. The Guided Tour Script (repeatable)

Open the project in a code editor (VS Code recommended). Then follow this order — it takes ~15
minutes and covers the whole system.

**Step 1 — Show the map of the whole site.**
Open `client/src/App.tsx`. Point out that this one file is the "directory" — every URL on the left
maps to a page file on the right. Ask the client to name any screen; show them its line.

**Step 2 — Show the Homepage.**
Open `client/src/pages/public/Home.tsx`. Note how the page is built from **sections** (hero, marquee,
stats, treatments) stacked together. Show the hero — this is where you'd change the headline, and the
images come from `client/public/images/`.

**Step 3 — Walk the booking flow end-to-end (the classic demo).**
1. `client/src/pages/public/BookingPage.tsx` — the booking wizard (from here it drives all the steps).
2. `client/src/components/booking/` — the step pieces: choose treatment → date → time → review.
3. The actual "save" happens by calling the API: `client/src/api/index.ts` → find `appointmentsApi.create`.
4. That hits the backend: `server/src/modules/appointments/appointments.service.ts` (business logic)
   and `.routes.ts` (the URL).
5. Save lands in the DB: `server/prisma/schema.prisma` → find the `appointments` model.

**Step 4 — Show one admin feature.**
Repeat the same "screen → API → service → table" path with a different example, e.g.:
- Screen: `client/src/pages/admin/Services.tsx`
- Calls: `servicesApi.list(...)` in `client/src/api/index.ts`
- Backend: `server/src/modules/services/services.service.ts`
- Table: `services` in `server/prisma/schema.prisma`

**Step 5 — Show the data itself.**
Open a terminal in `server/` and run `npx prisma studio`. A browser table opens listing the real
records. Search for a customer or appointment to prove the pages aren't mocked — they read from real
data.

**Step 6 — Show the design system (visual identity).**
Open `client/tailwind.config.js` (brand colors `primary` brass, `neutral`, dark `charcoal`/`ink`;
fonts Inter + Cormorant Garamond) and `client/src/index.css` (reusable button classes like
`.btn-gold`). This is where "the look" of the whole site is controlled.

---

## 5. Feature → File Fast Reference (for Q&A on the spot)

| "How do I change…" | Open this file |
|--------------------|----------------|
| The homepage | `client/src/pages/public/Home.tsx` |
| The about/founder story | `client/src/pages/public/About.tsx` |
| The booking steps | `client/src/pages/public/BookingPage.tsx` + `client/src/components/booking/` |
| The logo / site title / fonts | `client/index.html` (and images in `client/public/images/`) |
| Colors, fonts, spacing tokens | `client/tailwind.config.js` |
| Button styles | `client/src/index.css` (classes `btn-gold`, `btn-outline-light`) |
| Login page | `client/src/pages/auth/Login.tsx` (logic: `client/src/api/auth.api.ts`) |
| Admin dashboard | `client/src/pages/admin/Dashboard.tsx` |
| Analytics charts | `client/src/pages/admin/Analytics.tsx` + `client/src/components/analytics/` |
| Clinic settings | `client/src/pages/admin/Settings.tsx` + `server/src/modules/settings/` |
| Where URLs are defined | Client: `client/src/App.tsx` · API: `server/src/app.ts` |
| Where the database is described | `server/prisma/schema.prisma` |
| All API endpoints | `docs/api.md` |

---

## 6. Naming Conventions (how to guess where things are)

- **Pages** live in `client/src/pages/<world>/` and are named after the screen (`Home.tsx`, `Appointments.tsx`).
- **Reusable screen parts** live in `client/src/components/` and are grouped by job: `ui/` (buttons,
  modals), `booking/` (booking steps), `analytics/` (charts/tables), `layout/` (header, sidebar).
- **Backend features** live in `server/src/modules/<feature>/` with the same 4 filenames every time
  (see Idea #3 above).
- **API clients** in `client/src/api/index.ts` mirror the backend: `appointmentsApi` ↔ `/api/appointments`.

Rule of thumb: *if you can name the feature, you can find the folder.*

---

## 7. Golden Rules to Teach Along the Way

1. **Never change the database by hand.** Use the app, or Prisma (`npm run db:studio`) to inspect —
   real changes go through the code and `npm run db:migrate`.
2. **One change, one place.** Brand colors are tokens in `tailwind.config.js`, not scattered per page.
3. **Each backend feature is self-contained** — copying a module folder is how new features are added.
4. **All input is validated twice** — once in the browser, once by `*.validation.ts` on the server.
5. **What you see is real data** — no hardcoded pages; every list/stat comes from the database through
   the API (except a few fixed marketing numbers on the homepage, like the stats row).

---

## 8. Useful Commands (shown to the client)

Run these from the root of the project:

| Command | What happens |
|---------|--------------|
| `npm run dev` | Starts the site (`http://localhost:5173`) and API (`http://localhost:3000`) |
| `npm run db:studio` | Opens a visual database viewer in the browser |
| `npm run build` | Makes a production-ready copy of the site |
| `npm run db:seed` | Fills the database with sample data |

Environment setup lives in `.env.example`; the file to copy it to is `server/.env`.

---

## 9. Where the Deeper Docs Live

When the client wants to go further, point them at `docs/`:

| File | When to open |
|------|--------------|
| `docs/file-locations.md` | "Where is X in the code?" — the full file map |
| `docs/architecture.md` | How the whole system is designed |
| `docs/api.md` | Every API endpoint, request, and response |
| `docs/business-rules.md` | The rules (booking, inventory, roles) in detail |
| `docs/database.md` | Every database table explained |
| `docs/deployment.md` | How to put the system live |
| `docs/testing.md` | How the system is tested |