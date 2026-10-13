/**
 * Aftercare / preparation knowledge base.
 *
 * The clinic assistant must never invent medical or treatment-specific
 * instructions. Until the clinic supplies confirmed wording, every entry here is
 * intentionally absent and the assistant falls back to an honest "not on file,
 * please ask our staff" reply.
 *
 * To add real content, key an entry by a lowercased service name or service
 * category and fill in only what the clinic has confirmed. The assistant returns
 * that text verbatim (plus the standard consultation disclaimer) and nothing
 * else. See docs/ai-chatbot.md for the "needs clinic confirmation" list.
 */

export type AftercarePhase = 'prep' | 'aftercare';

export interface AftercareEntry {
  /** Confirmed "before your treatment" instructions, customer-safe wording. */
  prep?: string;
  /** Confirmed "after your treatment" instructions, customer-safe wording. */
  aftercare?: string;
}

/**
 * Keyed by lowercased service name or category. Deliberately empty: do not add
 * fabricated or guessed medical guidance.
 */
export const AFTERCARE_KNOWLEDGE: Record<string, AftercareEntry> = {};

/** Confirmed aftercare/prep content for a service name or category, if recorded. */
export function lookupAftercare(key: string | undefined): AftercareEntry | null {
  if (!key) return null;
  return AFTERCARE_KNOWLEDGE[key.trim().toLowerCase()] ?? null;
}

const TREATMENT_CONTEXT =
  /\b(treatment|session|facial|procedure|appointment|service|visit|laser|peel|wax|waxing|injection|injectable|drip|hydrafacial|microneedling|dermapen|biab|manicure|pedicure)\b/;
const AFTERCARE_EXPLICIT = /\bafter[- ]?care\b|\bpost[- ]?(treatment|procedure|care|session|op)\b/;
const AFTERCARE_AFTER = /\bafter\b|\bafterwards\b/;
const PREP_EXPLICIT = /\bprep(aration)?\b|\bprepar(e|ing)\b|\bpre[- ]?treatment\b/;
const BEFORE = /\bbefore\b/;

/**
 * Classify a message as a preparation or aftercare question, or neither.
 *
 * Kept deliberately narrow so ordinary chatter ("swim after eating") is not
 * mistaken for a treatment question: an explicit word like "aftercare" or a
 * "before/after" phrase combined with a treatment word is required.
 */
export function detectAftercareIntent(message: string): AftercarePhase | null {
  const lower = message.toLowerCase();

  if (AFTERCARE_EXPLICIT.test(lower)) return 'aftercare';

  const hasContext = TREATMENT_CONTEXT.test(lower);

  if (PREP_EXPLICIT.test(lower) && (hasContext || BEFORE.test(lower))) return 'prep';
  if (hasContext && BEFORE.test(lower)) return 'prep';
  if (hasContext && AFTERCARE_AFTER.test(lower)) return 'aftercare';

  // Explicit "how do I prepare" with no named treatment, or a bare "prep".
  if (/\bhow (do|should) i (prepare|prep)\b/.test(lower)) return 'prep';
  if (lower.trim() === 'prep') return 'prep';

  return null;
}

/** Honest fallback when no confirmed preparation instructions exist on file. */
export const AFTERCARE_PREP_REPLY =
  "I don't have specific preparation instructions for that treatment on file yet, so I don't want to guess — preparation can depend on the exact treatment and your skin.\n\n" +
  "Please ask our clinic professionals when you book; they'll give you the instructions that fit your treatment.\n\n" +
  'Please consult with our clinic professionals for personalized advice.';

/** Honest fallback when no confirmed aftercare instructions exist on file. */
export const AFTERCARE_AFTER_REPLY =
  "I don't have specific aftercare instructions for that treatment on file yet, so I don't want to guess — aftercare can depend on the exact treatment and your skin.\n\n" +
  'Please ask our clinic professionals, who will give you aftercare tailored to your treatment. If you notice anything severe or that is getting worse, please seek medical care right away.\n\n' +
  'Please consult with our clinic professionals for personalized advice.';
