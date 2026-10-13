/**
 * Medical safety handling for the clinic assistant.
 *
 * The assistant is not a medical professional. Two classes of input need special
 * care, and both are checked before any catalog lookup or language-model call:
 *
 *  - Emergencies: possible serious reactions that need emergency services now.
 *  - Medical advice / suitability: the customer describes a medical condition,
 *    medication, pregnancy, or asks whether a treatment is safe, suitable, or a
 *    guaranteed cure. We may share general service information but must never
 *    diagnose, prescribe, or promise an outcome — we refer to clinic staff.
 *
 * Detection is intentionally conservative: it favours an unnecessary referral
 * over a missed safety signal, while avoiding patterns that fire on ordinary
 * catalog questions (for example, we do not key on the word "permanent" because
 * it appears in real service names such as "Permanent Hair Removal").
 */

/** Signs that the person may be having a medical emergency. */
const EMERGENCY_PATTERNS: RegExp[] = [
  /\bemergency\b/,
  /\burgent(ly)?\b/,
  /\b911\b/,
  /\bsevere pain\b/,
  /\banaphyla(xis|ctic)\b/,
  // Breathing difficulty.
  /\b(can'?t|cannot|can not|unable to|difficulty|difficult|trouble|hard time|struggling)\s+(to\s+)?breath/,
  /\bbreathing\s+(problem|problems|difficulty|trouble)\b/,
  /\b(short(ness)?|out)\s+of\s+breath\b/,
  /\bnot\s+breath(ing)?\b/,
  // Airway / facial swelling.
  /\bthroat\s+(is\s+|feels\s+)?(closing|swelling|swollen|tight)\b/,
  /\b(tongue|lips?|throat|face|eyes?)\s+(is\s+|are\s+)?(swelling|swollen)\b/,
  /\bswell(ing|en|s)?\s+(of\s+)?(the\s+)?(throat|tongue|face|lips?)\b/,
  /\bswallow(ing)?\b.*\b(difficult|difficulty|trouble|pain|painful)\b/,
  // Cardiac / circulation / consciousness.
  /\bchest pain\b/,
  /\bfaint(ed|ing)?\b|\bpassed out\b|\bunconscious\b|\bunresponsive\b/,
  // Bleeding and burns.
  /\bsevere bleeding\b|\bbleeding (a lot|heavily|uncontrollably|badly)\b/,
  /\b(second|third)[- ]degree\b/,
  /\bsevere burn\b/,
  /\bchemical\b.*\b(eye|eyes|skin)\b/,
  /\b(eye|eyes)\b.*\b(chemical|acid|caustic|bleach)\b/,
  // Serious infection / systemic reaction.
  /\b(infected|infection)\b.*\b(fever|pus|ooz|oozing|spreading|chills)\b/,
  /\bhigh fever\b|\bfever\b.*\b(infection|chills|sweats)\b/,
  /\ballergic reaction\b/,
  /\bpassed\s+out\b/,
];

/**
 * Conditions, medications, or questions that call for a professional rather
 * than a chatbot answer. These route to a referral response, not emergency care
 * (unless an emergency pattern also matches).
 */
const MEDICAL_ADVICE_PATTERNS: RegExp[] = [
  // Pregnancy / breastfeeding.
  /\bpregnan(t|cy)\b/,
  /\bbreastfeed(ing)?\b/,
  /\bnursing\b/,
  /\bexpecting\b.*\bbaby\b/,
  // Prescription / high-risk medications.
  /\baccutane\b|\bisotretinoin\b|\broaccutane\b/,
  /\bblood thinner(s)?\b|\banticoagulant(s)?\b|\bwarfarin\b/,
  // Skin and systemic conditions.
  /\beczema\b|\bpsoriasis\b|\brosacea\b|\bdermatitis\b/,
  /\bdiabet(es|ic)\b/,
  /\bhiv\b|\baids\b|\bcancer\b|\bchemotherapy\b|\bchemo\b|\bepilepsy\b/,
  /\bcold sore\b|\bherpes\b/,
  /\bactive infection\b|\byou have an infection\b/,
  // Known allergies.
  /\ballerg(y|ic)\s+to\b/,
  /\bi'?m allergic\b/,
  // Suitability / safety.
  /\bis (it|this|that|laser|wax(ing)?|the \w+)\s+(safe|healthy)\b/,
  /\bare (they|these|injectables|fillers)\s+safe\b/,
  /\bam i\s+(a\s+)?(good\s+)?candidate\b/,
  // Contraindications / who should avoid a treatment.
  /\bcontraindicat/,
  /\bwho should(n'?t| not)\b/,
  /\bis (it|this|that) (not\s+)?(safe|suitable|recommended) for\b/,
  // Suitability phrased as "can I ... while/if <medical noun>". The medical noun
  // is required so ordinary booking questions ("can I book with you?") do not
  // trip it.
  /\bcan i\s+(still\s+)?(get|do|have|book|use|receive)\b[^?]*\b(if|while)\b[^?]*\b(pregnan|breastfeed|nursing|accutane|isotretinoin|blood thinner|anticoagulant|eczema|psoriasis|rosacea|dermatitis|diabet|infection|allerg|hiv|cancer|chemo)/,
  // Cure / guarantee / diagnosis.
  /\bwill (it|this|that|the \w+)\s+(cure|heal|remove|fix|treat)\b/,
  /\b(permanently|forever)\s+(remove|get rid|gone)\b/,
  /\bguarantee(d|s)?\b/,
  /\bcure\b/,
  /\bwhat (do|should) i have\b/,
  /\bdo i have\b.*\b(condition|disease|infection|cancer)\b/,
];

function matchesAny(lower: string, patterns: RegExp[]): boolean {
  return patterns.some((pattern) => pattern.test(lower));
}

/** True when the message describes a possible medical emergency. */
export function detectEmergency(message: string): boolean {
  return matchesAny(message.toLowerCase(), EMERGENCY_PATTERNS);
}

/**
 * True when the message asks for medical advice, or concerns something that
 * needs a professional assessment before treatment. Emergency input is handled
 * first by the caller, so this only needs to catch the non-urgent cases.
 */
export function detectMedicalAdvice(message: string): boolean {
  return matchesAny(message.toLowerCase(), MEDICAL_ADVICE_PATTERNS);
}

/** Emergency guidance. Never attempts to treat; always directs to emergency care. */
export const EMERGENCY_REPLY =
  'If this may be a medical emergency, please call 911 or your local emergency number right away, or go to the nearest emergency room.\n\n' +
  'Common warning signs include difficulty breathing, swelling of the face, lips, tongue, or throat, chest pain, fainting, or severe bleeding. ' +
  'For anything non-urgent, please contact the clinic directly to speak with our professionals.';

/**
 * Referral response for medical-advice and suitability questions. Shares no
 * diagnosis, prescription, or guarantee, and points to the free consultation.
 */
export const MEDICAL_REFERRAL_REPLY =
  "I can share general information about our services, but I'm not able to give medical advice, confirm whether a treatment is right for you, or promise a result.\n\n" +
  "For your safety, please consult our clinic professionals — you can start with our FREE \"Free Skin Consultation\" and mention this so they can advise you properly. If your symptoms are severe or getting worse, please seek medical care right away.\n\n" +
  'Please consult with our clinic professionals for personalized advice.';
