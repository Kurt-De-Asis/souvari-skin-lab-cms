import { describe, it, expect } from 'vitest';
import { detectEmergency, detectMedicalAdvice } from './clinic-safety';

describe('detectEmergency', () => {
  it.each([
    'I am having an emergency',
    'this is urgent',
    'call 911',
    "I can't breathe",
    'I have difficulty breathing',
    'shortness of breath',
    'my throat is closing',
    'my lips are swelling',
    'swelling of the face',
    'severe chest pain',
    'I fainted after the procedure',
    'I passed out',
    'severe bleeding that will not stop',
    'I got chemical in my eye',
    'the area is infected and I have a fever',
    'I think I am having an allergic reaction',
  ])('flags "%s" as an emergency', (message) => {
    expect(detectEmergency(message)).toBe(true);
  });

  it.each([
    'what are your hours?',
    'how much is a facial?',
    'I have dry lips',
    'do you offer laser hair removal?',
    'pizza',
  ])('does not flag the ordinary message "%s"', (message) => {
    expect(detectEmergency(message)).toBe(false);
  });
});

describe('detectMedicalAdvice', () => {
  it.each([
    'I am pregnant, can I get a facial?',
    'is laser safe while breastfeeding?',
    'I take Accutane, can I do a peel?',
    'I am on blood thinners',
    'I have eczema on my face',
    'I have psoriasis',
    'I have diabetes',
    'I have a cold sore, can I get a facial?',
    'I am allergic to lidocaine',
    'is it safe for me?',
    'is it safe to wax?',
    'am I a good candidate?',
    'will it cure my acne permanently?',
    'do you guarantee results?',
    'what do I have on my face?',
  ])('refers "%s" to a professional', (message) => {
    expect(detectMedicalAdvice(message)).toBe(true);
  });

  it.each([
    'what are your hours?',
    'how much is a facial?',
    'do you have permanent hair removal?',
    'recommend something for acne',
    'I have oily skin',
    'show me your best-selling services',
    'can I book a facial with you?',
    'can I get a facial when you open?',
    'can I get a facial?',
  ])('does not treat the ordinary message "%s" as medical advice', (message) => {
    expect(detectMedicalAdvice(message)).toBe(false);
  });
});
