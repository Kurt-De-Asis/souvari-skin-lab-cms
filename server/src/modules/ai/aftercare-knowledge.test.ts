import { describe, it, expect } from 'vitest';
import {
  AFTERCARE_KNOWLEDGE,
  AFTERCARE_AFTER_REPLY,
  AFTERCARE_PREP_REPLY,
  detectAftercareIntent,
  lookupAftercare,
} from './aftercare-knowledge';

describe('detectAftercareIntent', () => {
  it.each([
    'aftercare',
    'what aftercare do you recommend',
    'what should I do after a facial?',
    'can I wear makeup after my treatment?',
    'how long after a laser can I exercise?',
    'is there aftercare for a chemical peel?',
    'post-treatment advice',
  ])('detects aftercare in "%s"', (message) => {
    expect(detectAftercareIntent(message)).toBe('aftercare');
  });

  it.each([
    'how do I prepare for my appointment?',
    'what should I do before a facial?',
    'preparation for laser',
    'prep',
    'do I need to stop anything before my treatment?',
  ])('detects preparation in "%s"', (message) => {
    expect(detectAftercareIntent(message)).toBe('prep');
  });

  it.each([
    'what services do you offer?',
    'how much is a facial?',
    'can I swim after eating?',
    'do you offer a free consultation?',
    'pizza',
  ])('does not fire on "%s"', (message) => {
    expect(detectAftercareIntent(message)).toBeNull();
  });
});

describe('aftercare knowledge base', () => {
  it('ships no fabricated entries', () => {
    expect(Object.keys(AFTERCARE_KNOWLEDGE)).toHaveLength(0);
  });

  it('returns null for an unknown or empty key', () => {
    expect(lookupAftercare('nonexistent service')).toBeNull();
    expect(lookupAftercare(undefined)).toBeNull();
  });

  it('falls back to honest replies that do not guess', () => {
    expect(AFTERCARE_PREP_REPLY).toContain("don't want to guess");
    expect(AFTERCARE_AFTER_REPLY).toContain("don't want to guess");
    expect(AFTERCARE_AFTER_REPLY).toContain('seek medical care');
  });
});
