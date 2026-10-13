/**
 * Clinic FAQ intents that are on-topic but for which the assistant has no
 * stored, confirmed answer yet: administrative policies (payments, deposits,
 * cancellations, parking, ...) and treatment logistics (duration, number of
 * sessions, discomfort, side effects, downtime).
 *
 * These are detected so the assistant can answer honestly and consistently
 * instead of refusing them as off-topic or, worse, inventing a policy or a
 * medical detail. Nothing here ever asserts a fact the clinic has not stored —
 * the caller may still answer from real settings (for example the clinic
 * e-mail) before falling back to the honest gap reply.
 */

export type PolicyArea =
  | 'payment'
  | 'cancellation'
  | 'warranty'
  | 'parking'
  | 'walk-ins'
  | 'insurance'
  | 'branches'
  | 'email'
  | 'age'
  | 'practitioners'
  | 'who we treat'
  | 'dress and guests'
  | 'offers';

/**
 * Ordered most-specific first. Word boundaries are used throughout so short
 * words do not fire inside ordinary text ("card" in "cardio", "age" in
 * "package").
 */
const POLICY_PATTERNS: Array<[PolicyArea, RegExp]> = [
  [
    'payment',
    /\b(payment methods?|how (can|do) i pay|do you (accept|take) (cash|cards?|credit|debit|gcash|maya|grabpay)|gcash|maya|grabpay|credit cards?|debit cards?|installments?|deposits?|down ?payments?)\b/,
  ],
  [
    'cancellation',
    /\b(cancell?(ation|ing|ed)?|reschedul(e|ing)|no[- ]?shows?|refunds?|money[- ]?back)\b/,
  ],
  ['warranty', /\b(warrant(y|ies)|guarantees?)\b/],
  ['parking', /\bparking\b/],
  ['walk-ins', /\bwalk[- ]?ins?\b/],
  ['insurance', /\b(hmo|insurance|philhealth)\b/],
  ['branches', /\bbranches\b|\bother (locations?|clinics?|outlets?)\b/],
  ['email', /\be-?mail\b/],
  [
    'age',
    /\bage (limit|restriction|requirement)s?\b|\bminimum age\b|\bhow old\b|\b(treat|accept|see) (kids|children|minors|teens|teenagers|babies)\b/,
  ],
  [
    'practitioners',
    /\b(dermatologists?|doctors?|physicians?)\b|\b(male|female) (therapists?|staff|aestheticians?|nurses?)\b|\bdo you (have|employ) (a |an |any )?(doctor|dermatologist|nurse|therapist)\b/,
  ],
  ['who we treat', /\bdo you (treat|serve|accept) (men|women|everyone|anybody|anyone)\b/],
  [
    'dress and guests',
    /\bwhat (should|do) i wear\b|\bremove (my )?make ?up\b|\bbring (a |an )?(friend|guest|someone|companion|partner)\b|\bcouple rooms?\b/,
  ],
  [
    'offers',
    /\b(gift ?cards?|gift ?certificates?|vouchers?|promos?|promotions?|discounts?|memberships?|\bmembers?\b|packages?|student discount|senior( citizen)? discount|pwd discount)\b/,
  ],
];

/** The administrative policy area a message is about, or null when it is not a policy question. */
export function detectPolicyArea(message: string): PolicyArea | null {
  const lower = message.toLowerCase();
  for (const [area, pattern] of POLICY_PATTERNS) {
    if (pattern.test(lower)) return area;
  }
  return null;
}

/**
 * Honest answer for any policy question the clinic has not recorded. It never
 * guesses and never claims the clinic does not offer something.
 */
export const POLICY_GAP_REPLY =
  "I don't have that specific information on file yet, so I don't want to guess. " +
  'Please contact the clinic directly and our staff will be glad to confirm the details for you.\n\n' +
  'I can still help with our services, pricing, clinic hours, and location.\n\n' +
  'Please consult with our clinic professionals for personalized advice.';

export type TreatmentInfoKind = 'duration' | 'sessions' | 'pain' | 'side_effects' | 'downtime';

/**
 * Treatment-logistics questions. These need a real answer from staff because
 * they depend on the exact treatment and the person; the assistant must not
 * invent a duration, a session count, or a medical claim.
 */
const TREATMENT_INFO_PATTERNS: Array<[TreatmentInfoKind, RegExp]> = [
  ['downtime', /\b(downtime|down time|recovery|recovery time|healing time)\b/],
  ['side_effects', /\b(side ?effects?|risks?|complications?|adverse reactions?)\b/],
  ['sessions', /\bhow many (sessions?|treatments?|visits?|appointments?|times)\b/],
  [
    'duration',
    /\bhow long (does|do|will|would|is|are)\b[^?]*\b(take|last|session|treatment|procedure|appointment)\b|\bduration\b/,
  ],
  [
    'pain',
    /\b(painful|does it hurt|will it hurt|is it painful|how much (does|will) it hurt|pain level|numbing|anesthetic|anaesthetic)\b/,
  ],
];

/** The treatment-logistics question a message is asking, or null. */
export function detectTreatmentInfo(message: string): TreatmentInfoKind | null {
  const lower = message.toLowerCase();
  for (const [kind, pattern] of TREATMENT_INFO_PATTERNS) {
    if (pattern.test(lower)) return kind;
  }
  return null;
}

/** Honest answer for a treatment-logistics question with no stored answer. */
export const TREATMENT_INFO_REPLY =
  "How long a treatment takes, how many sessions you'll need, how it feels, and any " +
  "side effects can vary a lot from one treatment — and one person — to another, so I " +
  "don't want to guess.\n\n" +
  'Our clinic professionals can answer those questions for your specific treatment; the ' +
  'FREE "Free Skin Consultation" is a great place to start.\n\n' +
  'Please consult with our clinic professionals for personalized advice.';
