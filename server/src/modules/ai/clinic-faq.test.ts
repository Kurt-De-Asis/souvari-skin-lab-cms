import { describe, it, expect } from 'vitest';
import {
  detectPolicyArea,
  detectTreatmentInfo,
  POLICY_GAP_REPLY,
  TREATMENT_INFO_REPLY,
} from './clinic-faq';

describe('detectPolicyArea', () => {
  it.each([
    ['what payment methods do you accept?', 'payment'],
    ['do you require a deposit?', 'payment'],
    ['what is your cancellation policy?', 'cancellation'],
    ['can i reschedule my appointment?', 'cancellation'],
    ['do you have parking?', 'parking'],
    ['do you accept walk-ins?', 'walk-ins'],
    ['do you accept hmo?', 'insurance'],
    ['where are your branches?', 'branches'],
    ['what is your email address?', 'email'],
    ['how old do i have to be?', 'age'],
    ['do you have a dermatologist?', 'practitioners'],
    ['what should i wear?', 'dress and guests'],
    ['can i bring a friend?', 'dress and guests'],
    ['do you have gift cards?', 'offers'],
    ['do you offer packages?', 'offers'],
    ['do you have a membership?', 'offers'],
  ])('classifies "%s" as %s', (message, area) => {
    expect(detectPolicyArea(message)).toBe(area);
  });

  it.each([
    'recommend something for acne',
    'what are your hours?',
    'how much is a facial?',
    'where are you located?',
    'is there any downtime?',
    'do you offer underwater massage?',
  ])('does not treat "%s" as a policy question', (message) => {
    expect(detectPolicyArea(message)).toBeNull();
  });

  it('honest policy gap reply never claims the clinic does not offer something', () => {
    expect(POLICY_GAP_REPLY).toContain("I don't have that specific information");
    expect(POLICY_GAP_REPLY).not.toContain("don't offer");
    expect(POLICY_GAP_REPLY).not.toContain('do not offer');
    expect(POLICY_GAP_REPLY).toContain('contact the clinic');
    expect(POLICY_GAP_REPLY).toContain('Please consult with our clinic professionals');
  });
});

describe('detectTreatmentInfo', () => {
  it.each([
    ['is there any downtime?', 'downtime'],
    ['how long is the recovery time?', 'downtime'],
    ['what are the side effects?', 'side_effects'],
    ['are there any risks?', 'side_effects'],
    ['how many sessions will i need?', 'sessions'],
    ['how long does it take?', 'duration'],
    ['what is the duration?', 'duration'],
    ['does it hurt?', 'pain'],
    ['is it painful?', 'pain'],
  ])('classifies "%s" as %s', (message, kind) => {
    expect(detectTreatmentInfo(message)).toBe(kind);
  });

  it.each([
    'what is your cancellation policy?',
    'how much is a facial?',
    'recommend something for acne',
    'what are your hours?',
  ])('does not treat "%s" as a treatment-logistics question', (message) => {
    expect(detectTreatmentInfo(message)).toBeNull();
  });

  it('treatment-info reply is honest and refers to professionals', () => {
    expect(TREATMENT_INFO_REPLY).toContain("don't want to guess");
    expect(TREATMENT_INFO_REPLY).toContain('Free Skin Consultation');
    expect(TREATMENT_INFO_REPLY).toContain('Please consult with our clinic professionals');
  });
});
