# Testing Strategy

## Test Types

### Unit Tests

Test individual functions and business logic:

- **Booking availability check**: Verify overlap detection algorithm
- **Inventory calculations**: Stock deduction, low-stock detection
- **Service consumption**: Correct quantity lookup and deduction
- **Transaction calculations**: Subtotal, tax, discount computation
- **Authentication**: Password hashing, JWT generation/verification
- **Authorization**: Role-based permission checks
- **Pricing engine core** (`server/src/services/pricing-engine.core.test.ts`): unit-price resolution across audience/tier/gender/variant dimensions, membership discount, installments, rounding
- **Seed data helpers** (`server/prisma/seed-data/helpers.test.ts`): lashTiers / waxVipNm4 / vipNm / vipNmRegular / nailArtPrices matrix builders

Run with `npx vitest run` (34 tests).

### Integration Tests

Test complete workflows across modules:

1. **Appointment → Notification**: Book appointment → notification created
2. **Transaction → Inventory**: POS checkout → stock deducted → movement logged
3. **Service completion → Inventory consumption**: Service completed → products consumed
4. **Booking → SMS**: Appointment confirmed → SMS service invoked
5. **Cancellation → Inventory restoration**: Transaction voided → stock restored

### End-to-End Tests

Complete user workflows:

1. Customer registers → logs in → browses services → books appointment → receives confirmation
2. Staff logs in → views appointment → completes service → creates treatment record → processes POS → inventory deducted → analytics updated
3. Admin logs in → manages services → configures inventory consumption → views analytics → sees real data

## Acceptance Test Scenarios

### Scenario 1: Customer Registration
- **Action**: Customer registers with valid data
- **Expected**: Account created, redirects to customer dashboard

### Scenario 2: Appointment Booking
- **Action**: Customer books appointment
- **Expected**: Slot becomes occupied, appointment appears in customer and admin views

### Scenario 3: Double Booking Prevention
- **Action**: Two customers attempt to book the same staff/time slot
- **Expected**: Only one succeeds, second gets error

### Scenario 4: Service Inventory Configuration
- **Action**: Admin configures Botox Treatment to consume 5 units
- **Expected**: Configuration saved, visible in service details

### Scenario 5: Service Consumption
- **Action**: Staff completes Botox transaction
- **Expected**: Inventory decreases by exactly 5 units, movement logged

### Scenario 6: Low-Stock Alert
- **Action**: Admin adjusts stock below minimum
- **Expected**: Low-stock notification appears in dashboard and notification center

### Scenario 7: AI Chatbot Service Query
- **Action**: Customer asks "What services do you offer for acne?"
- **Expected**: Relevant clinic services are returned with disclaimer

### Scenario 8: AI Safety Refusal
- **Action**: Customer asks "Do I have acne?"
- **Expected**: Chatbot refuses diagnosis, suggests consulting professionals

### Scenario 9: SMS Notification
- **Action**: Appointment is confirmed
- **Expected**: SMS service is invoked (mock provider logs the message)

### Scenario 10: Analytics Data
- **Action**: Admin opens analytics dashboard
- **Expected**: Charts display real data from database transactions

## Running Tests

```bash
# Pricing engine + seed helper unit tests
cd server && npx vitest run

# Type checks
cd server && npx tsc -p tsconfig.json --noEmit
cd client && npx tsc -b
```

## Pricing Smoke Checks

Verify the live pricing engine against the seeded database (`npx ts-node --project tsconfig.seed.json <script>`):

1. **Non-member and VIP paths** — a real service (e.g. Diamond Glow Classic) must resolve `non_member` → full price and `vip` → discounted price with booking fee waived and savings reported.
2. **Membership code path** — passing `membershipCode` must resolve to VIP pricing (e.g. `SOUVARI-VIP-ZBKTYO` → vip).
3. **Expired membership** — a membership with `end_date` in the past must resolve to `non_member` pricing with the booking fee applied, even if `status` is still `active`.
4. **Public listing** — `GET /services` (`services.service.listPublic`) must expose numeric `vip_price` / `non_member_price` alongside `price` for the frontend catalog.
5. **Idempotent re-seed** — re-running `npm run db:seed:catalog` must report 0 orphaned services, 0 legacy backfills, and only re-touch data issues (stale issues for retired services get auto-resolved).

## Test Data

Seed data provides realistic test scenarios:
- 1 admin, 4 staff, 20 customers
- 24 catalog sections, 389 active services, 48 variants, 1,414 available price rows, 129 packages
- 237 retired placeholder services kept for history (`service_staff`, appointments preserved)
- 38 active memberships driving VIP pricing
- Historical appointments (14) and transaction items with `price_type` backfilled; `quoted_price`/`unit_price` preserved
- Data quality issues browsable in the **Data Quality** admin page (`/admin/data-quality`)
