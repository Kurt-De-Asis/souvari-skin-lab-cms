const CATEGORY_LABELS: Record<string, string> = {
  facial: 'Facial',
  body: 'Body',
  hair_removal: 'Hair Removal',
  skin_rejuvenation: 'Skin Rejuvenation',
  injection: 'Injection',
  laser: 'Laser',
  consultation: 'Consultation',
  package: 'Package',
  signature_facial: 'Signature Facial',
  other: 'Other',
};

export default function formatCategory(cat: string): string {
  if (CATEGORY_LABELS[cat]) return CATEGORY_LABELS[cat];
  return cat
    .replace(/_/g, ' ')
    .split(/\s+/)
    .map((word) => {
      if (!word || word.includes('®')) return word;
      if (word === word.toUpperCase() && word.length <= 4) return word;
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(' ');
}
