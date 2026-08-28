# Database Schema

## Overview

The database uses MySQL 8.0 with InnoDB engine and utf8mb4 character set. It contains 20 tables and 6 analytics views.

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
| price | DECIMAL(12,2) | Price in PHP |
| duration_minutes | INT | Duration |
| is_active | BOOLEAN | Active flag |
| status | ENUM | active, inactive, draft |

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
| unit_price | DECIMAL(12,2) | Price per unit |
| line_total | DECIMAL(12,2) | Line total |

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
