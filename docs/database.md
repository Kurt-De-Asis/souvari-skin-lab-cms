# Database Schema

## Overview

The database uses MySQL 8.0 with InnoDB engine and utf8mb4 character set. It contains 26 tables and 6 analytics views.

The service catalog is seed-managed from `server/prisma/seed-catalog.ts`. It defines 18 sections (groups) mirroring `SOUVARI_UPDATED_PRICELIST_README.md` (the single source of truth), each with its own slug and sorted by `display_order`:

| Section | Display Order | Pricing Model |
|---------|--------------|----------------|
| FACIALS (`signature-facials`) | 1 | base (non_member = README price) |
| CARBON LASER BODY WHITENING (`body-whitening`) | 2 | base |
| DIODE LASER HAIR REMOVAL (`diode-laser`) | 3 | base |
| UltraTight® HIFU (`ultratight-hifu`) | 4 | base |
| Radio Frequency (RF) (`radio-frequency`) | 5 | base |
| 3 Session Series · UltraTight® (`ultratight-3`) | 6 | base + service_packages |
| 7 Session Series · RF (`rf-7-sessions`) | 7 | base + service_packages |
| 7 Session Series Body Whitening (`body-whitening-7`) | 8 | base + service_packages |
| 7 Session Series DIODE (`diode-7-sessions`) | 9 | base + service_packages |
| ESSENTIAL NAIL CARE (`nail-essential`) | 10 | base |
| GEL POLISH PREMIER (`nail-gel`) | 11 | base |
| NAIL EXTENSIONS AND SPECIALIZED (`nail-extensions`) | 12 | base |
| FOOT SPA AND HAND SPA (`foot-hand-spa`) | 13 | base |
| EYELASH EXTENSIONS (`lashes-brows`) | 14 | base |
| PERMANENT MAKE UP (`permanent-makeup`) | 15 | base |
| THREADING (`threading`) | 16 | base |
| HOT WAX HAIR REMOVAL (`hot-wax`) | 17 | base |
| DOCTORS PROCEDURES (`doctors-procedures`) | 18 | base (non-bookable) |

### Pricing Model

- **Base / standard pricing**: every catalog service stores a single base price (`non_member_price` = `price` = the README standard/base amount). `vip_price` is `NULL`, so member discounts are applied separately at pricing time from the membership plan configuration (`pricing-engine.core.ts`), never baked into the base price.
- **Resolution order** (server/src/services/pricing.service.ts): VIP → exact match → gender → staff tier → no_variant → regular_fallback; Non-member → exact → gender → staff → no_variant → null (no regular fallback). With `vip_price = null`, members resolve via their plan's `discount_pct`; non-members use `non_member_price`.
- **Membership expiry**: an active-VIP pricing lookup is only honored while `end_date` >= today (end-of-day). Expired memberships resolve to non_member pricing.
- **History is preserved**: quotes, transaction unit prices, and line totals are never rewritten. Only the new `price_type` column on appointments/transaction_items is backfilled from membership status at the time.

### Retire-not-delete

Services removed from the catalog are **retired**, not deleted: `is_active=false`, `status='inactive'`. Their `service_staff` rows and historical appointments/transactions remain intact so past records keep referencing real services. `retireOrphanedServices()` in `seed-catalog.ts` retires every active service whose slug is no longer in the catalog — including legacy demo services from `seed.ts` (which have no slug) and any admin/temp services — so the active catalog contains **exactly** the README services.

### Seed Workflow

```bash
npm run db:seed:catalog          # groups, services, base prices, packages (upsert + retire)
npm run db:verify:catalog        # assert DB active catalog == seed catalog (18 sections / 260 services)
npm run db:seed:service-staff    # rebuild service↔staff assignments
npm run db:seed:memberships      # membership plans + sample members
npx vitest run                   # pricing engine + helper regression tests
```

The catalog seed is idempotent: re-running it retires no extra services, backfills nothing new, and replaces stale data-issue rows. Provenance fields (`external_id`, `sku`, `treatment_type`) are written for SOURCE B imports.

## Entity Relationship Summary

```
users (1) ──────── (1) customers
users (1) ──────── (1) staff
users (1) ──────── (N) notifications
users (1) ──────── (N) sms_logs
users (1) ──────── (N) chat_sessions

staff (1) ──────── (N) staff_schedules
staff (1) ──────── (N) appointments
staff (1) ──────── (N) transactions
staff (1) ──────── (N) treatment_records
staff (1) ──────── (N) service_staff (M2M)

customers (1) ──── (N) appointments
customers (1) ──── (N) transactions
customers (1) ──── (N) treatment_records

services (1) ───── (N) appointments
services (1) ───── (N) service_staff (M2M)
services (1) ───── (N) service_inventory_items
services (1) ───── (N) transaction_items
services (1) ───── (1) treatment_records

product_categories (1) ── (N) products
products (1) ────── (N) inventory_movements
products (1) ────── (N) transaction_items
products (1) ────── (N) service_inventory_items

appointments (1) ── (N) appointment_status_history
appointments (1) ── (1) treatment_records
appointments (1) ── (0..1) transactions

transactions (1) ── (N) transaction_items

chat_sessions (1) ── (N) chat_messages
```

## Tables

### users
| Column | Type | Description |
|--------|------|-------------|
| id | INT PK AUTO_INCREMENT | Unique identifier |
| email | VARCHAR(255) UNIQUE | Login email |
| password_hash | VARCHAR(255) | bcrypt hashed password |
| role | ENUM | admin, staff, customer |
| status | ENUM | active, inactive, suspended |
| phone | VARCHAR(20) | Contact number |
| created_at | TIMESTAMP | Record creation |
| updated_at | TIMESTAMP | Last update |
| deleted_at | TIMESTAMP NULL | Soft delete |

### customers
| Column | Type | Description |
|--------|------|-------------|
| id | INT PK AUTO_INCREMENT | Unique identifier |
| user_id | INT UNIQUE FK → users | Linked user account |
| first_name | VARCHAR(100) | First name |
| last_name | VARCHAR(100) | Last name |
| date_of_birth | DATE | DOB |
| gender | ENUM | male, female, other, prefer_not_to_say |
| address | TEXT | Full address |
| created_at | TIMESTAMP | Record creation |
| updated_at | TIMESTAMP | Last update |
| deleted_at | TIMESTAMP NULL | Soft delete |

### staff
| Column | Type | Description |
|--------|------|-------------|
| id | INT PK AUTO_INCREMENT | Unique identifier |
| user_id | INT UNIQUE FK → users | Linked user account |
| first_name | VARCHAR(100) | First name |
| last_name | VARCHAR(100) | Last name |
| position | ENUM | doctor, nurse, aesthetician, therapist, receptionist, manager |
| status | ENUM | active, on_leave, inactive, terminated |
| hire_date | DATE | Employment start |
| created_at | TIMESTAMP | Record creation |
| updated_at | TIMESTAMP | Last update |
| deleted_at | TIMESTAMP NULL | Soft delete |

### staff_schedules
| Column | Type | Description |
|--------|------|-------------|
| id | INT PK AUTO_INCREMENT | Unique identifier |
| staff_id | INT FK → staff | Staff member |
| day_of_week | ENUM | monday–sunday |
| start_time | VARCHAR(5) | "09:00" |
| end_time | VARCHAR(5) | "18:00" |
| break_start | VARCHAR(5) NULL | "12:00" |
| break_end | VARCHAR(5) NULL | "13:00" |
| is_active | BOOLEAN | Schedule active |

Unique constraint: (staff_id, day_of_week)

### services
| Column | Type | Description |
|--------|------|-------------|
| id | INT PK AUTO_INCREMENT | Unique identifier |
| name | VARCHAR(255) | Service name |
| description | TEXT | Full description |
| category | ENUM | facial, body, hair_removal, skin_rejuvenation, injection, laser, consultation, package, other |
| category_id | INT FK | Legacy service category |
| pricing_type | VARCHAR(20) | fixed (other pricing models TBD) |
| price | DECIMAL(12,2) | Regular (non-VIP) price in PHP |
| vip_price | DECIMAL(12,2) NULL | VIP price (legacy fallback column) |
| non_member_price | DECIMAL(12,2) NULL | Non-member price (legacy fallback column) |
| duration_minutes | INT | Duration |
| is_active | BOOLEAN | Active flag (0 = retired, never deleted) |
| status | ENUM | active, inactive, draft |
| group_id | INT FK → service_groups | Catalog section this service belongs to |
| slug | VARCHAR(255) UNIQUE NULL | Stable catalog identifier (th-chin, di-hair-removal, hx-…) |
| inclusions | JSON NULL | What the service includes |
| is_legacy | BOOLEAN | True = pre-catalog service not managed by the seed |
| needs_verification | BOOLEAN | Flagged for manual price review from source |
| external_id | VARCHAR(100) NULL | SOURCE B (Doctors-Procedures.xlsx) Service ID |
| sku | VARCHAR(120) NULL | SOURCE B SKU |
| treatment_type | VARCHAR(100) NULL | SOURCE B treatment type |
| online_booking | VARCHAR(20) | Enabled/Disabled |
| available_for | VARCHAR(30) | Everyone (or restricted group) |
| voucher_sales | VARCHAR(20) | Enabled/Disabled |
| commissions | VARCHAR(20) | Enabled/Disabled |

### service_groups
| Column | Type | Description |
|--------|------|-------------|
| id | INT PK AUTO_INCREMENT | Unique identifier |
| slug | VARCHAR(80) UNIQUE | Section slug (signature-facials, premium-iv-drips, …) |
| name | VARCHAR(150) | Display name |
| description | TEXT NULL | Group description |
| display_order | INT | Section order in the catalog |
| is_bookable | BOOLEAN | False for SOURCE B groups (advance procedures / IV drips) |

### service_variants
| Column | Type | Description |
|--------|------|-------------|
| id | INT PK AUTO_INCREMENT | Unique identifier |
| service_id | INT FK → services | Parent service |
| variant_key | ENUM | session, per_nail, full_set, fill_up, … |
| label | VARCHAR(150) | Display label |
| duration_minutes | INT NULL | Per-variant duration |
| is_active | BOOLEAN | Active flag |

Unique constraint: `(service_id, variant_key)`

### service_prices (multi-dimensional pricing matrix)
| Column | Type | Description |
|--------|------|-------------|
| id | INT PK AUTO_INCREMENT | Unique identifier |
| service_id | INT FK → services | Service |
| service_variant_id | INT FK → service_variants NULL | Variant (per_nail, etc.) |
| audience | ENUM | vip, non_member, regular |
| staff_tier | ENUM | technician, standard, senior, guru |
| gender_scope | ENUM | any, male, female |
| amount | DECIMAL(12,2) | Price for this dimension combination |
| is_available | BOOLEAN | False = option offered (e.g. male wax where PDF shows dash) |
| needs_verification | BOOLEAN | Manual review flag |
| source_ref | VARCHAR(120) | "PDF p.48 · Threading" |

Unique constraint: `(service_id, service_variant_id, audience, staff_tier, gender_scope)`

### service_packages
| Column | Type | Description |
|--------|------|-------------|
| id | INT PK AUTO_INCREMENT | Unique identifier |
| service_id | INT FK → services | Parent service |
| sessions_included | INT | Sessions in package |
| session_price | DECIMAL(12,2) | **Per-session** rate (vip ÷ sessions) |
| ten_session_price | DECIMAL(12,2) NULL | 10-session VIP rate |
| inclusions | JSON NULL | What the package includes |
| savings_note | VARCHAR(255) | Displayed savings message |

### service_data_issues
| Column | Type | Description |
|--------|------|-------------|
| id | INT PK AUTO_INCREMENT | Unique identifier |
| service_id | INT FK NULL | Related service |
| price_id | INT FK NULL | Related price row |
| issue_type | ENUM | pdf_mismatch, ambiguous_pricing, unavailable_option, … |
| severity | ENUM | info, warning, critical |
| status | ENUM | open, resolved, waived |
| title | VARCHAR(255) | Issue summary |
| details | JSON | Structured details (amounts, source refs) |
| resolved_by | INT FK NULL | Who resolved it |
| resolved_at | DATETIME NULL | When resolved/waived |

### service_staff (M2M junction)
| Column | Type | Description |
|--------|------|-------------|
| service_id | INT FK → services | Service |
| staff_id | INT FK → staff | Staff member |

### service_inventory_items
| Column | Type | Description |
|--------|------|-------------|
| service_id | INT FK → services | Service |
| product_id | INT FK → products | Consumable product |
| quantity_per_session | DECIMAL(10,3) | Quantity consumed per service |

### product_categories
| Column | Type | Description |
|--------|------|-------------|
| id | INT PK AUTO_INCREMENT | Unique identifier |
| name | VARCHAR(150) UNIQUE | Category name |
| is_active | BOOLEAN | Active flag |

### products
| Column | Type | Description |
|--------|------|-------------|
| id | INT PK AUTO_INCREMENT | Unique identifier |
| product_category_id | INT FK → product_categories | Category |
| name | VARCHAR(255) | Product name |
| sku | VARCHAR(100) UNIQUE | Stock keeping unit |
| unit | ENUM | piece, ml, mg, unit, vial, tablet, bottle, box |
| unit_cost | DECIMAL(12,2) | Purchase cost |
| unit_price | DECIMAL(12,2) | Selling price |
| current_stock | DECIMAL(12,3) | Current quantity |
| minimum_stock | DECIMAL(12,3) | Low-stock threshold |
| maximum_stock | DECIMAL(12,3) NULL | Maximum capacity |
| is_retail | BOOLEAN | Available for retail sale |
| is_consumable | BOOLEAN | Used during services |
| status | ENUM | active, inactive, discontinued |

### inventory_movements
| Column | Type | Description |
|--------|------|-------------|
| id | INT PK AUTO_INCREMENT | Unique identifier |
| product_id | INT FK → products | Product |
| type | ENUM | purchase, sale, adjustment, consumption, return, damage, transfer, opening_stock |
| quantity | DECIMAL(12,3) | Quantity change (positive or negative) |
| unit_cost | DECIMAL(12,2) | Cost at time of movement |
| running_stock_after | DECIMAL(12,3) | Stock snapshot after movement |
| reference_type | VARCHAR(50) | "transaction", "appointment", "manual" |
| reference_id | INT | Related entity ID |
| performed_by | INT FK → users | User who made the change |

### appointments
| Column | Type | Description |
|--------|------|-------------|
| id | INT PK AUTO_INCREMENT | Unique identifier |
| customer_id | INT FK → customers | Customer |
| staff_id | INT FK → staff | Assigned staff |
| service_id | INT FK → services | Service |
| appointment_date | DATE | Appointment date |
| start_time | VARCHAR(5) | "14:00" |
| end_time | VARCHAR(5) | "15:00" |
| status | ENUM | pending, confirmed, checked_in, in_progress, completed, cancelled, no_show |
| quoted_price | DECIMAL(12,2) NULL | Price quoted at booking (preserved literally) |
| price_type | VARCHAR(20) NULL | vip / non_member / regular snapshot at booking |
| membership_code | VARCHAR(50) NULL | Membership code that determined the price |
| cancellation_reason | TEXT | Reason for cancellation |
| reminder_sent | BOOLEAN | SMS reminder sent |

### appointment_status_history
| Column | Type | Description |
|--------|------|-------------|
| id | INT PK AUTO_INCREMENT | Unique identifier |
| appointment_id | INT FK → appointments | Appointment |
| old_status | ENUM NULL | Previous status |
| new_status | ENUM | New status |
| changed_by | INT FK → users | Who changed it |
| reason | TEXT | Change reason |

### treatment_records
| Column | Type | Description |
|--------|------|-------------|
| id | INT PK AUTO_INCREMENT | Unique identifier |
| appointment_id | INT UNIQUE FK → appointments | Completed appointment |
| staff_id | INT FK → staff | Treating staff |
| customer_id | INT FK → customers | Customer |
| service_id | INT FK → services | Service performed |
| treatment_date | DATE | Date of treatment |
| notes | TEXT | Treatment notes |
| recommendations | TEXT | Post-treatment recommendations |
| satisfaction_rating | INT (1-5) | Patient satisfaction |

### transactions
| Column | Type | Description |
|--------|------|-------------|
| id | INT PK AUTO_INCREMENT | Unique identifier |
| transaction_number | VARCHAR(50) UNIQUE | TXN-YYYYMMDD-XXXXX |
| customer_id | INT FK → customers | Customer |
| staff_id | INT FK → staff | Processed by |
| appointment_id | INT FK → appointments | Related appointment |
| type | ENUM | sale, refund, adjustment |
| subtotal | DECIMAL(12,2) | Subtotal |
| discount_amount | DECIMAL(12,2) | Discount |
| tax_amount | DECIMAL(12,2) | VAT (12%) |
| total_amount | DECIMAL(12,2) | Total |
| payment_method | ENUM | cash, credit_card, debit_card, bank_transfer, e_wallet, voucher |
| payment_status | ENUM | pending, paid, partial, refunded, voided |

### transaction_items
| Column | Type | Description |
|--------|------|-------------|
| id | INT PK AUTO_INCREMENT | Unique identifier |
| transaction_id | INT FK → transactions | Parent transaction |
| product_id | INT FK → products NULL | Product (if retail) |
| service_id | INT FK → services NULL | Service (if service item) |
| description | VARCHAR(255) | Item description |
| quantity | DECIMAL(10,3) | Quantity |
| unit_price | DECIMAL(12,2) | Price per unit (preserved literally) |
| price_type | VARCHAR(20) NULL | vip / non_member / regular snapshot at sale |
| discount | DECIMAL(12,2) | Line discount |
| tax | DECIMAL(12,2) | Line tax |
| line_total | DECIMAL(12,2) | Line total |

### memberships
| Column | Type | Description |
|--------|------|-------------|
| id | INT PK AUTO_INCREMENT | Unique identifier |
| customer_id | INT FK → customers | Member |
| plan_id | INT FK → membership_plans | Plan |
| code | VARCHAR(50) UNIQUE | SOUVARI-VIP-XXXXXX |
| status | ENUM | active, expired, suspended, cancelled, pending |
| start_date | DATE | Membership start |
| end_date | DATE | Membership expiry (drives active pricing) |
| total_spending | DECIMAL(12,2) | Lifetime spend |
| referral_credits | DECIMAL(12,2) | Referral credits |
| notes | TEXT NULL | Notes |

### notifications
| Column | Type | Description |
|--------|------|-------------|
| id | INT PK AUTO_INCREMENT | Unique identifier |
| user_id | INT FK → users | Recipient |
| type | ENUM | appointment_reminder, appointment_update, payment, promotion, system, low_stock |
| title | VARCHAR(255) | Notification title |
| message | TEXT | Notification message |
| status | ENUM | unread, read, archived |

### sms_logs
| Column | Type | Description |
|--------|------|-------------|
| id | INT PK AUTO_INCREMENT | Unique identifier |
| user_id | INT FK → users NULL | Related user |
| recipient_phone | VARCHAR(20) | Recipient |
| message | TEXT | SMS content |
| status | ENUM | queued, sent, delivered, failed |

### chat_sessions
| Column | Type | Description |
|--------|------|-------------|
| id | INT PK AUTO_INCREMENT | Unique identifier |
| user_id | INT FK → users NULL | User (if logged in) |
| session_token | VARCHAR(128) UNIQUE | Session identifier |
| status | ENUM | active, closed |

### chat_messages
| Column | Type | Description |
|--------|------|-------------|
| id | INT PK AUTO_INCREMENT | Unique identifier |
| session_id | INT FK → chat_sessions | Parent session |
| sender_type | ENUM | user, bot |
| content | TEXT | Message content |

### system_settings
| Column | Type | Description |
|--------|------|-------------|
| id | INT PK AUTO_INCREMENT | Unique identifier |
| setting_key | VARCHAR(100) UNIQUE | Setting name |
| setting_value | TEXT | JSON value |
| description | VARCHAR(500) | Setting description |

## Analytics Views

1. `v_daily_revenue` — Daily revenue summary from paid transactions
2. `v_staff_performance` — Staff metrics (appointments, revenue)
3. `v_low_stock_products` — Products below minimum stock
4. `v_service_popularity` — Service booking and revenue stats
5. `v_today_appointments` — Today's appointment schedule
6. `v_inventory_audit` — Full inventory movement audit trail
