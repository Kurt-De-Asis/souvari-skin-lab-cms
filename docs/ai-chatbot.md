# AI Chatbot

The customer-facing assistant for Souvari Skin Lab. It answers questions about
services, pricing, recommendations, clinic hours/location, retail products, and
general beauty/aesthetics topics — while refusing to diagnose, prescribe, or
invent information.

- **Endpoint:** `POST /api/chat` (no auth required; optional auth links the
  session to a logged-in user)
- **Request:** `{ "message": string, "session_token"?: string }`
- **Response:** `{ "success": true, "data": { "session_token": string, "response": string } }`

## Source files

| File | Responsibility |
|------|----------------|
| `server/src/modules/ai/ai.service.ts` | Router, intent handling, product lookup, recommendation engine, prompt building, error handling |
| `server/src/modules/ai/product-knowledge.ts` | Retail product matching, intents, replies |
| `server/src/modules/ai/clinic-safety.ts` | Emergency and medical-advice detection + referral copy |
| `server/src/modules/ai/aftercare-knowledge.ts` | Preparation/aftercare intent + confirmed knowledge base |
| `server/src/modules/ai/fallback-responses.ts` | Technical/AI-unavailable/retrieval/unrecognized fallback copy |
| `server/src/modules/ai/ai.controller.ts` | HTTP controller |
| `server/src/modules/ai/ai.routes.ts` | Route registration |
| `server/src/modules/ai/ai.validation.ts` | Request validation |
| `client/src/components/chatbot/*`, `client/src/pages/customer/Chatbot.tsx` | Chat UI |

## Routing order

Every message runs through a safety-first, deterministic pipeline **before** the
language model is ever called. When `AI_API_KEY` is unset, the deterministic
engine answers on its own.

1. **Emergency** — possible serious reaction (difficulty breathing, facial/lip/
   tongue/throat swelling, chest pain, fainting, severe bleeding, allergic
   reaction). → emergency-services guidance. Checked first so a message that also
   looks like a greeting is never swallowed.
2. **Medical advice / suitability / contraindications** — pregnancy,
   breastfeeding, prescription medication, chronic conditions, allergies, "is it
   safe", "am I a candidate", "who shouldn't get this". → referral to clinic
   professionals (and the free consultation). Never a diagnosis or a guarantee.
3. **Clinic info** — "tell me about your clinic", "who are you?". → grounded
   overview built only from stored settings.
4. **Thanks / greeting** — pleasantries.
5. **Help** — "help", "what can you do?".
6. **Preparation / aftercare** — "how do I prepare", "what should I do after".
   → confirmed knowledge base if present, otherwise an honest "not on file" reply.
7. **Retail products** — database lookup; answers only from stored fields, never
   invents.
8. **Relevance gate** — anything not about the clinic is refused with the
   off-topic reply.
9. **Recommendations / hours / pricing / contact / service details** — deterministic
   rule engine.
10. **LLM** — only for on-topic questions the deterministic engine did not already
    answer. Falls back to the rule engine on any provider error; returns
    `AI_UNAVAILABLE_REPLY` only if both fail.

## Safety rules

- Never diagnose, prescribe, or assess a medical condition.
- Never guarantee, promise, or claim a result or cure.
- Emergencies are always directed to emergency services (911 / nearest ER).
- Medical and suitability questions are referred to clinic professionals.
- Only services that exist in the database are ever recommended.
- Every recommendation ends with the consultation disclaimer.
- Responses are English-only; never Tagalog.
- The model never sees off-topic or medical/safety messages, and product/service
  facts always come from the database, not the model.

See `docs/business-rules.md` → **AI Safety Rules** for the canonical policy list.

## Fallback messages

Defined in `fallback-responses.ts`, so the customer never sees an internal error:

| Constant | When |
|----------|------|
| `TECHNICAL_ERROR_REPLY` | Unexpected failure handling a message (database/routing) |
| `AI_UNAVAILABLE_REPLY` | Model unreachable **and** the rule engine also failed |
| `RETRIEVAL_ERROR_REPLY` | The service catalog could not be read |
| `UNRECOGNIZED_REPLY` | On-topic question with no stored answer (honest gap) |
| `OFF_TOPIC_REPLY` | Question unrelated to the clinic |

Technical errors are logged for developers (`category`, `name`, `message`) with
no customer text and no secrets. The customer always gets a safe sentence.

## Aftercare knowledge base

`aftercare-knowledge.ts` ships **empty on purpose** — the assistant must not
invent treatment-specific medical instructions. Until entries are added, prep and
aftercare questions get an honest "not on file, please ask our staff" reply.

To add confirmed content, key an entry by lowercased service name or category:

```ts
export const AFTERCARE_KNOWLEDGE: Record<string, AftercareEntry> = {
  '10 in 1 hydrafacial': {
    prep: 'Come with clean skin if possible. Avoid retinoids for 2 days before.',
    aftercare: 'Avoid direct sun and strenuous exercise for 24 hours.',
  },
};
```

Only add wording the clinic has approved. The assistant returns it verbatim plus
the standard consultation disclaimer.

## Needs clinic confirmation

The following are **not** invented by the assistant and should be confirmed/added
by the clinic:

- Aftercare, preparation, and contraindication text per service (knowledge base
  above is currently empty).
- Booking, cancellation, rescheduling, refund, warranty, and shipping policies.
- Confirmed clinic address, phone, and hours (the assistant composes hours from
  `business_hours_start`, `business_hours_end`, and `business_days`).
- Per-service descriptions/durations and per-product descriptions/purpose where
  missing, so answers stay grounded.

## Configuration

Environment variables (see `server/src/config/env.ts`):

| Variable | Purpose |
|----------|---------|
| `AI_API_KEY` | Enables the LLM path. Empty → deterministic rule engine only |
| `AI_MODEL` | Model name |
| `AI_BASE_URL` | Optional OpenAI-compatible base URL |

## Testing

```bash
cd server
npx vitest run          # unit tests (deterministic engine, no network)
npx tsc --noEmit        # typecheck
```

To exercise the deterministic engine manually, build and run with an empty key:

```bash
npx tsc
PORT=3100 AI_API_KEY='' SMS_PROVIDER=mock REMINDERS_ENABLED=false node dist/server.js
```

```bash
curl -s -X POST http://localhost:3100/api/chat \
  -H 'Content-Type: application/json' \
  -d '{"message":"recommend something for dryness","session_token":"demo"}'
```

To test the AI-failure fallback path, point `AI_BASE_URL` at an unreachable host
with a dummy key: the assistant falls back to the deterministic engine.
