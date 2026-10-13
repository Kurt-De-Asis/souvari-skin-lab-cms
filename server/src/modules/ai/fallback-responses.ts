/**
 * Customer-facing fallback copy, kept in one place so every graceful-degradation
 * path is consistent and reviewable. These strings are shown when the assistant
 * cannot produce a normal answer; they must never contain internal details such
 * as provider errors, stack traces, keys, or SQL.
 */

/** Unexpected failure while handling a message (database or routing). */
export const TECHNICAL_ERROR_REPLY =
  "I'm sorry, something went wrong while processing your message. Please try again in a moment, or contact the clinic directly for immediate assistance.";

/** The configured language model could not be reached and the fallback also failed. */
export const AI_UNAVAILABLE_REPLY =
  "I'm having trouble reaching our assistant right now. Please try again in a moment, or contact the clinic directly and our staff will be glad to help.";

/** The service catalog could not be read, so we cannot yet verify what is offered. */
export const RETRIEVAL_ERROR_REPLY =
  "I'm unable to retrieve our service information right now. Please try again in a moment, or contact the clinic directly and our staff can confirm the details for you.";

/**
 * An on-topic question the assistant understood but has no stored answer for.
 * Honest about the gap instead of guessing or claiming the clinic does not offer
 * something, and still offers the topics that are answerable.
 */
export const UNRECOGNIZED_REPLY =
  "I want to give you an accurate answer, but I don't have that specific information " +
  "on file right now. I can help with our services and pricing, treatment " +
  "recommendations, clinic hours, and location — and our clinic staff can help you " +
  "with anything else directly.";
