const CATEGORY_IMAGES: Record<string, string> = {
  facial: '/images/facial-services.webp',
  'facial-cleansing': '/images/facial-services.webp',
  'skin-rejuvenation': '/images/doctor-procedures.webp',
  'body-care': '/images/footspa.webp',
  hair_removal: '/images/waxing.webp',
  'brows-lashes': '/images/permanent-makeup.webp',
  'permanent-makeup': '/images/permanent-makeup.webp',
  nails: '/images/nails-services.webp',
};

export default function categoryImage(category: string): string {
  return CATEGORY_IMAGES[category] || '/images/doctor-procedures.webp';
}