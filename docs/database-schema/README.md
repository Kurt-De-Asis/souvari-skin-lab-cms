# Souvari Skin Lab — Database Schema (Simplified ERD)

A single, readable, Microsoft Access-style entity-relationship diagram of the
core Souvari Skin Lab clinic system.

> This is a **deliberately simplified** view. The real MySQL database has ~39
> application tables; this diagram shows only the 16 tables that cover the main
> business areas requested: **customers, staff & admin, appointments, SMS
> notifications, the AI chatbot, and inventory**. It omits secondary columns and
> unrelated modules (memberships, packages, payroll, reviews, etc.).

### Conceptual elements (not 1:1 physical tables)

Two items in the diagram are **modelling aids**, not physical tables/columns in
the current database:

- **`admins`** — in the database, "admin" is simply `users.role = 'admin'`
  (roles are `admin`, `staff`, `customer`). For readability the diagram shows
  `admins` as a 1:1 specialisation of `users`, exactly like `customers` and
  `staff` have their own profile tables.
- **`system_settings.managed_by`** — `system_settings` is a real table, but it
  has no owner column today. The diagram adds `managed_by` to show that admins
  maintain the configuration.

Every other table and column shown exists in the live database.

## Files

| File | What it is |
| --- | --- |
| `souvari-database-schema.png` | High-resolution image (2×, ~2773×2717 px) |
| `souvari-database-schema.svg` | Scalable vector version |
| `souvari-database-schema.dot` | Graphviz source — **the single source of truth** |
| `build-erd.mjs` | Renderer (`.dot` → `.svg` → `.png`) with a geometry self-check |
| `package.json` | Isolated dependencies for the renderer only (app deps untouched) |

## How to read it

- Each box is one table.
- The **bold title** is the table name; the header is separated from the columns
  by a thin line.
- `PK` marks the primary key.
- `FK` marks a foreign key (a column that points at another table's primary key).
- Lines are relationships. The `1` and `∞` labels are cardinality:
  - `1 — ∞` **one-to-many** — the `1`-side table has one row; the `∞`-side can
    have many rows referencing it (e.g. one `customers` row → many
    `appointments`).
  - `1 — 1` **one-to-one** — exactly one row on each side.

A logged-in person is a `users` row. Depending on `role`, that same account has
exactly one of the profile rows: `customers`, `staff`, or `admins`.

## Tables (16)

| # | Table | Responsibility |
| --- | --- | --- |
| 1 | `users` | Login accounts for every person (admin, staff, customer) |
| 2 | `customers` | Customer profile linked 1:1 to a `users` account |
| 3 | `staff` | Staff profile linked 1:1 to a `users` account |
| 4 | `admins` | Admin profile linked 1:1 to a `users` account *(role specialisation)* |
| 5 | `staff_schedules` | Working days/hours for each staff member |
| 6 | `system_settings` | Admin-managed key/value configuration |
| 7 | `services` | Treatments/services offered, with price and duration |
| 8 | `appointments` | Bookings linking a customer, staff member and service |
| 9 | `treatment_records` | Clinical record produced 1:1 from an appointment |
| 10 | `product_categories` | Grouping for retail/products |
| 11 | `products` | Retail and consumable stock items |
| 12 | `inventory_movements` | Stock in/out ledger per product |
| 13 | `notifications` | In-app notifications for users |
| 14 | `sms_logs` | Outbound SMS messages and delivery status |
| 15 | `chat_sessions` | AI chatbot conversations |
| 16 | `chat_messages` | Individual messages within a chat session |

## Relationships (19)

### One-to-one (4)

| Parent | Child | Meaning |
| --- | --- | --- |
| `users` | `customers` | one account ↔ one customer profile |
| `users` | `staff` | one account ↔ one staff profile |
| `users` | `admins` | one account ↔ one admin profile |
| `appointments` | `treatment_records` | one appointment ↔ one treatment record |

### One-to-many (15)

| Parent (1) | Child (∞) | Foreign key |
| --- | --- | --- |
| `users` | `notifications` | `notifications.user_id` |
| `users` | `sms_logs` | `sms_logs.user_id` |
| `users` | `chat_sessions` | `chat_sessions.user_id` |
| `users` | `inventory_movements` | `inventory_movements.performed_by` |
| `admins` | `system_settings` | `system_settings.managed_by` |
| `staff` | `staff_schedules` | `staff_schedules.staff_id` |
| `customers` | `appointments` | `appointments.customer_id` |
| `staff` | `appointments` | `appointments.staff_id` |
| `services` | `appointments` | `appointments.service_id` |
| `customers` | `treatment_records` | `treatment_records.customer_id` |
| `staff` | `treatment_records` | `treatment_records.staff_id` |
| `services` | `treatment_records` | `treatment_records.service_id` |
| `product_categories` | `products` | `products.product_category_id` |
| `products` | `inventory_movements` | `inventory_movements.product_id` |
| `chat_sessions` | `chat_messages` | `chat_messages.session_id` |

## Regenerating

Requires Node.js. The renderer uses two small dev-only dependencies
(`@hpcc-js/wasm` for Graphviz and `@resvg/resvg-js` for rasterizing); it does
**not** touch the application's dependencies.

```bash
cd docs/database-schema
npm install       # first time only
npm run build     # reads the .dot, writes the .svg and .png
```

Edit `souvari-database-schema.dot`, then re-run `npm run build`. The build also
prints a geometry check (table count, edge count, no box overlaps, no edges
cutting through tables) and exits non-zero if something is wrong.
