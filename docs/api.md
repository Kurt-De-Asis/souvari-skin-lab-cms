# API Documentation

## Base URL

```
http://localhost:3000/api
```

## Authentication

### Headers
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

Refresh tokens are sent via httpOnly cookies automatically.

## Response Format

### Success
```json
{
  "success": true,
  "data": {},
  "message": "Operation successful"
}
```

### Error
```json
{
  "success": false,
  "message": "Error description",
  "errors": [
    { "field": "email", "message": "Invalid email address" }
  ]
}
```

---

## Authentication Endpoints

### POST /auth/register
Register a new customer account.

**Body:**
```json
{
  "email": "customer@email.com",
  "password": "password123",
  "first_name": "Juan",
  "last_name": "Dela Cruz",
  "phone": "+639171234567"
}
```

### POST /auth/login
Login and receive JWT tokens.

**Body:**
```json
{
  "email": "customer@email.com",
  "password": "password123"
}
```

### POST /auth/refresh
Refresh access token (uses httpOnly cookie).

### POST /auth/logout
Clear refresh token cookie.

### GET /auth/profile
Get current user profile. **Requires auth.**

---

## Customer Endpoints

### GET /customers
List customers (admin/staff only).

**Query:** `page`, `limit`, `search`, `gender`, `sort`

### GET /customers/:id
Get customer details.

### POST /customers
Create customer (admin only).

### PUT /customers/:id
Update customer (admin only).

### DELETE /customers/:id
Soft delete customer (admin only).

---

## Staff Endpoints

### GET /staff
List staff members.

**Query:** `page`, `limit`, `search`, `position`, `status`

### GET /staff/:id
Get staff details with schedules.

### POST /staff
Create staff member (admin only).

### PUT /staff/:id
Update staff (admin only).

### DELETE /staff/:id
Soft delete staff (admin only).

### GET /staff/:id/schedules
Get staff weekly schedule.

### PUT /staff/:id/schedules
Update staff schedule (admin only).

### GET /staff/service/:serviceId
Get staff assigned to a specific service.

---

## Service Endpoints

### GET /services/browse
Browse active services (public, no auth).

**Query:** `page`, `limit`, `category`, `search`

### GET /services
List all services (auth required).

### GET /services/:id
Get service details with staff and inventory config.

### POST /services
Create service (admin only).

### PUT /services/:id
Update service (admin only).

### DELETE /services/:id
Soft delete service (admin only).

### POST /services/:id/staff
Assign staff to service (admin only).

### DELETE /services/:id/staff/:staffId
Remove staff from service (admin only).

### POST /services/:id/inventory
Configure service inventory consumption (admin only).

### PUT /services/:id/inventory/:itemId
Update inventory consumption config (admin only).

### DELETE /services/:id/inventory/:itemId
Remove inventory item from service (admin only).

---

## Appointment Endpoints

### GET /appointments
List appointments. Role-based: customers see own, staff see assigned, admin sees all.

**Query:** `page`, `limit`, `start_date`, `end_date`, `status`, `staff_id`, `customer_id`

### GET /appointments/calendar
Calendar view with date range.

**Query:** `start_date`, `end_date`

### GET /appointments/availability
Check available time slots.

**Query:** `staff_id`, `service_id`, `date`

Returns array of available time slots (30-min intervals).

### GET /appointments/:id
Get appointment details.

### POST /appointments
Create appointment. Server validates:
- No double booking
- Staff availability
- Service is active
- Within business hours

### PATCH /appointments/:id/status
Update appointment status.

**Body:**
```json
{
  "status": "confirmed",
  "reason": "Optional reason"
}
```

Valid status transitions:
- pending → confirmed, cancelled
- confirmed → checked_in, cancelled
- checked_in → in_progress, no_show
- in_progress → completed

### PATCH /appointments/:id
Reschedule appointment.

---

## Product Endpoints

### GET /products
List products.

**Query:** `page`, `limit`, `search`, `category_id`, `status`, `is_retail`, `is_consumable`, `low_stock`

### GET /products/low-stock
Get products below minimum stock.

### GET /products/:id
Get product details.

### GET /products/:id/movements
Get product inventory movement history.

### POST /products
Create product (admin only). Auto-generates SKU if not provided.

### PUT /products/:id
Update product (admin only).

### DELETE /products/:id
Soft delete product (admin only).

### POST /products/stock-adjustments
Adjust stock quantity (admin only).

**Body:**
```json
{
  "product_id": 1,
  "quantity": 10,
  "type": "adjustment",
  "notes": "Stock count correction"
}
```

### GET /products/categories
List product categories.

### POST /products/categories
Create category (admin only).

### PUT /products/categories/:id
Update category (admin only).

### DELETE /products/categories/:id
Delete category (admin only, must have no products).

---

## Inventory Endpoints

### GET /inventory
List inventory movements.

**Query:** `page`, `limit`, `product_id`, `type`, `start_date`, `end_date`

### GET /inventory/low-stock
Get low-stock products.

### POST /inventory/adjustments
Create manual stock adjustment.

### POST /inventory/purchase
Record stock purchase.

**Body:**
```json
{
  "product_id": 1,
  "quantity": 50,
  "unit_cost": 250.00,
  "notes": "Supplier order #1234"
}
```

### GET /inventory/product/:productId
Get movement history for a specific product.

---

## Transaction Endpoints

### GET /transactions
List transactions.

**Query:** `page`, `limit`, `start_date`, `end_date`, `type`, `payment_status`, `customer_id`, `staff_id`

### GET /transactions/:id
Get transaction details with items.

### POST /transactions
Create transaction (POS checkout).

**Body:**
```json
{
  "customer_id": 1,
  "staff_id": 2,
  "appointment_id": null,
  "items": [
    { "product_id": 1, "description": "Sunscreen SPF50+", "quantity": 2, "unit_price": 1500 },
    { "service_id": 3, "description": "HydraFacial", "quantity": 1, "unit_price": 4500 }
  ],
  "payment_method": "cash",
  "discount_amount": 0
}
```

**Atomic operation:** Creates transaction, deducts retail stock, consumes service inventory, creates movement logs.

### POST /transactions/:id/void
Void a transaction (admin only). Restores inventory.

### POST /transactions/:id/refund
Refund a transaction (admin/staff). Creates refund transaction and restores inventory.

---

## Treatment Records Endpoints

### GET /treatment-records
List treatment records. Role-based access.

**Query:** `page`, `limit`, `customer_id`, `staff_id`, `start_date`, `end_date`

### GET /treatment-records/:id
Get treatment record details.

### POST /treatment-records
Create treatment record (staff only). Requires completed appointment.

### PUT /treatment-records/:id
Update treatment record.

---

## Notification Endpoints

### GET /notifications
List current user's notifications.

**Query:** `page`, `limit`, `type`, `status`

### GET /notifications/unread-count
Get count of unread notifications.

### PATCH /notifications/:id/read
Mark notification as read.

### PATCH /notifications/read-all
Mark all notifications as read.

### DELETE /notifications/:id
Delete notification.

---

## Analytics Endpoints (Admin only)

### GET /analytics/dashboard
Dashboard KPIs:
- Total appointments (this month)
- Completed, cancelled, no_show counts
- Total revenue (this month)
- Total customers, total staff
- Low stock product count

### GET /analytics/revenue
Revenue over time.

**Query:** `start_date`, `end_date`, `group_by` (day/week/month)

### GET /analytics/appointments
Appointment trends over time.

**Query:** `start_date`, `end_date`

### GET /analytics/services
Service distribution and popularity.

### GET /analytics/inventory
Inventory summary (total products, total value, low stock, out of stock).

---

## AI Chat Endpoint

### POST /chat
Send message to AI chatbot.

**Body:**
```json
{
  "message": "What services do you offer for acne?",
  "session_token": "optional-existing-session"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "response": "We offer several services for acne treatment...",
    "session_token": "abc123"
  }
}
```

The chatbot:
- Answers clinic FAQs
- Recommends relevant services
- Provides pricing information
- Refuses medical diagnoses
- Includes safety disclaimers

---

## Settings Endpoints

### GET /settings
Get all settings (admin only).

### GET /settings/public
Get public settings (no auth): clinic name, hours, phone.

### PUT /settings
Update settings (admin only).

**Body:**
```json
{
  "settings": [
    { "key": "clinic_name", "value": "\"IAVE Beauty & Co.\"" },
    { "key": "business_hours_start", "value": "\"09:00\"" }
  ]
}
```
