# Business Rules

## Appointment Booking Rules

1. **No double booking**: Server checks for overlapping appointments for the same staff member on the same date. Overlap = existing.start_time < new.end_time AND existing.end_time > new.start_time.

2. **Staff must be active**: Only staff with status='active' can receive appointments.

3. **Service must be active**: Only services with status='active' can be booked.

4. **Within business hours**: Appointments must fall within clinic operating hours (default 9:00 AM - 6:00 PM).

5. **Within staff schedule**: Staff must have an active schedule for the appointment day of week.

6. **No break overlap**: Appointment cannot overlap with staff break period.

7. **Duration matches service**: Appointment end_time = start_time + service.duration_minutes.

8. **Valid status transitions**:
   - pending → confirmed, cancelled
   - confirmed → checked_in, cancelled
   - checked_in → in_progress, no_show
   - in_progress → completed

## Transaction Rules

1. **Atomic checkout**: All operations (transaction creation, stock deduction, inventory logging) happen in a single database transaction. If any step fails, everything rolls back.

2. **Stock validation**: Retail products must have sufficient stock before checkout.

3. **Service inventory consumption**: When a service is in a transaction, the system automatically deducts configured quantities from service_inventory_items.

4. **Transaction number format**: TXN-YYYYMMDD-XXXXX (date + sequential 5-digit number).

5. **Void reverses inventory**: Voiding a transaction creates return-type inventory movements to restore stock.

6. **Refund creates new transaction**: Refunding creates a separate refund transaction and restores inventory.

## Inventory Rules

1. **Audit trail required**: Every stock modification creates an inventory_movements record.

2. **Movement types**: purchase (stock in), sale (stock out), adjustment (manual), consumption (service use), return (reversal), damage, transfer, opening_stock.

3. **Low-stock alert**: When current_stock ≤ minimum_stock, the system generates a notification and includes the product in dashboard alerts.

4. **No negative stock**: The system prevents deductions that would make stock negative.

5. **Configurable units**: Products support piece, ml, mg, unit, vial, tablet, bottle, box.

## Service Consumption Rules

1. **Configurable per service**: Each service defines which products it consumes and in what quantity.

2. **Automatic deduction**: When a transaction includes a service, the system looks up service_inventory_items and deducts the configured quantities.

3. **Atomic**: Consumption deductions happen within the same database transaction as the POS checkout.

## AI Safety Rules

1. **No diagnosis**: The chatbot must never diagnose conditions.

2. **No medication advice**: Never prescribe or recommend specific medications.

3. **No emergency advice**: Direct users to emergency services for urgent matters.

4. **Service-based recommendations only**: Only recommend services that exist in the system's service catalog.

5. **Disclaimer required**: All recommendations include a disclaimer to consult clinic professionals.

6. **Graceful fallback**: If the AI service is unavailable, the rule-based fallback handles the conversation.

## Authentication Rules

1. **Password hashing**: bcrypt with 12 salt rounds.

2. **Access token lifetime**: 15 minutes.

3. **Refresh token lifetime**: 7 days, stored in httpOnly cookie.

4. **Token refresh**: On 401, frontend automatically attempts token refresh before redirecting to login.

## Role-Based Access Rules

| Resource | Customer | Staff | Admin |
|----------|----------|-------|-------|
| Browse services | Yes | Yes | Yes |
| Book appointments | Yes | — | Yes |
| View own data | Yes | Assigned only | All |
| Process POS | — | Yes | Yes |
| Complete services | — | Yes | Yes |
| Manage services | — | — | Yes |
| Manage staff | — | — | Yes |
| Manage inventory | — | View only | Full |
| View analytics | — | — | Yes |
| Manage settings | — | — | Yes |
