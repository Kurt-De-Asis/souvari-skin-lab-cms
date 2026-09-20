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
    .replace(/\b\w/g, (c) => c.toUpperCase());
}
