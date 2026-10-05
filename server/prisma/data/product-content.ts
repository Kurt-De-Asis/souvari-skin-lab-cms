/**
 * Researched product content for the customer-visible (retail) catalogue.
 *
 * HOW THIS FILE IS USED
 * ---------------------
 * `prisma/scripts/enrich-product-content.ts` reads these entries and fills only
 * the product fields that are currently empty. It is a development-time dataset:
 * nothing here is consulted when a customer chats with the clinic assistant. The
 * assistant only ever reads what has been written into the database columns.
 *
 * SCOPE AND SAFETY
 * ----------------
 * - Only `description`, `purpose` and `benefits` are covered. Ingredients and
 *   usage instructions are deliberately out of scope for this feature.
 * - The clinic sells unbranded/white-label retail items, so every entry is
 *   written as TYPE-LEVEL guidance ("a hydrating serum", "a broad-spectrum
 *   sunscreen") rather than a claim about a specific brand formulation. That is
 *   why `confidence` is `type-level` throughout.
 * - Wording is hedged on purpose ("commonly used to", "may help") and avoids
 *   guaranteed or medical claims. The chatbot already appends a
 *   consult-a-professional disclaimer to every answer.
 * - Sources are recorded per field so the wording can be audited later. They are
 *   stored on the product row in the `research_sources` JSON column.
 *
 * Each entry is keyed by SKU. `expectedName` is a guard so a future SKU reuse
 * cannot silently attach this content to a different product.
 */

export type ProductContentKey = 'description' | 'purpose' | 'benefits';

export interface ProductContentSource {
  /** Short human-readable name of the reference. */
  label: string;
  url: string;
}

export interface ResearchedProductContent {
  description: string | null;
  purpose: string | null;
  benefits: string | null;
}

export interface ResearchedProductContentEntry {
  sku: string;
  /** Product name at research time; enforced by the enrichment script. */
  expectedName: string;
  /** `type-level` for generic product-type guidance, `exact` for a verified SKU. */
  confidence: 'type-level' | 'exact';
  content: ResearchedProductContent;
  sources: Partial<Record<ProductContentKey, ProductContentSource[]>>;
}

/** Date the wording below was last reviewed against the sources. */
export const PRODUCT_CONTENT_RESEARCHED_AT = '2026-10-04';

const FDA_SUNSCREEN: ProductContentSource = {
  label: 'FDA — Sunscreen: How to Help Protect Your Skin from the Sun',
  url: 'https://www.fda.gov/drugs/understanding-over-counter-medicines/sunscreen-how-help-protect-your-skin-sun',
};

const DAILYMED_SPF50: ProductContentSource = {
  label: 'DailyMed — Broad Spectrum SPF 50 sunscreen drug facts',
  url: 'https://dailymed.nlm.nih.gov/dailymed/fda/fdaDrugXsl.cfm?setid=cda67d41-d063-4936-a6b9-23376304eb42',
};

const DAILYMED_BPO: ProductContentSource = {
  label: 'DailyMed — Acne treatment (benzoyl peroxide) drug facts',
  url: 'https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=8d5e7e40-5e61-470a-b8ff-0b2dca3cabb0',
};

const MEDLINEPLUS_BPO: ProductContentSource = {
  label: 'MedlinePlus — Benzoyl Peroxide Topical',
  url: 'https://medlineplus.gov/druginfo/meds/a601026.html',
};

const CLEVELAND_BPO: ProductContentSource = {
  label: 'Cleveland Clinic — Benzoyl Peroxide: Acne Treatment',
  url: 'https://my.clevelandclinic.org/health/drugs/18363-benzoyl-peroxide-cream-gel-or-lotion',
};

const ALOE_REVIEW: ProductContentSource = {
  label: 'Surjushe et al. — Aloe vera: A Short Review (PMC2763764)',
  url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC2763764/',
};

const ALOE_HYDRATION: ProductContentSource = {
  label: 'Dal’Belo et al. — Moisturizing effect of Aloe vera extract (PubMed 17026654)',
  url: 'https://pubmed.ncbi.nlm.nih.gov/17026654',
};

const VITAMIN_C_CLEVELAND: ProductContentSource = {
  label: 'Cleveland Clinic — Vitamin C Serum: Benefits, How to Apply',
  url: 'https://health.clevelandclinic.org/vitamin-c-serum',
};

const VITAMIN_C_COLUMBIA: ProductContentSource = {
  label: 'Columbia Skin Clinic — Why You Should Be Using a Vitamin C Serum',
  url: 'https://columbiaskinclinic.com/ask-a-dermatologist/why-you-should-be-using-a-vitamin-c-serum',
};

const RETINOL_CLEVELAND: ProductContentSource = {
  label: 'Cleveland Clinic — Retinol: Cream, Serum, What It Is, Benefits, How To Use',
  url: 'https://my.clevelandclinic.org/health/treatments/23293-retinol',
};

const RETINOL_REVIEW: ProductContentSource = {
  label: 'Farris — Retinol: The Ideal Retinoid for Cosmetic Solutions (PubMed 35816071)',
  url: 'https://pubmed.ncbi.nlm.nih.gov/35816071',
};

const HA_HARVARD: ProductContentSource = {
  label: 'Harvard Health — Hyaluronic acid for skin: Benefits and how to use it',
  url: 'https://www.health.harvard.edu/medications-and-treatments/hyaluronic-acid-for-skin-benefits-how-to-use-it-and-side-effects',
};

const HA_CLINICAL: ProductContentSource = {
  label: 'Efficacy Evaluation of a Topical Hyaluronic Acid Serum in Facial Photoaging (PMC8322246)',
  url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC8322246/',
};

const COLLAGEN_MASK_CLINICAL: ProductContentSource = {
  label: 'Janssens-Böcker et al. — Native collagen sheet mask clinical evaluation',
  url: 'https://onlinelibrary.wiley.com/doi/10.1111/jocd.16181',
};

const JADE_ROLLER_REVIEW: ProductContentSource = {
  label: 'Hamp et al. — Gua-sha, Jade Roller, and Facial Massage (PubMed 36170573)',
  url: 'https://pubmed.ncbi.nlm.nih.gov/36170573',
};

const CLEANSER_CERAVE: ProductContentSource = {
  label: 'CeraVe — Foaming Facial Cleanser for normal to oily skin',
  url: 'https://www.cerave.com/skincare/cleansers/foaming-facial-cleanser',
};

const CLEANSER_NEUTROGENA: ProductContentSource = {
  label: 'Neutrogena — Hydro Boost Hydrating Gel Cleanser',
  url: 'https://www.neutrogena.com/products/skincare/neutrogena-hydro-boost-hydrating-gel-cleanser-with-hyaluronic-acid-fragrance-free/6806422',
};

const WAX_AFTERCARE: ProductContentSource = {
  label: 'Bump eRaiser — Ingrown hair treatment range',
  url: 'https://bumperaiser.com.au/ingrown-hair-treatment',
};

const WAX_AFTERCARE_SKINCARE: ProductContentSource = {
  label: 'Skincare.com — How to Care for Skin After Waxing',
  url: 'https://www.skincare.com/body-care/hair-removal/how-to-care-for-skin-after-waxing',
};

const LESION_AFTERCARE_MS: ProductContentSource = {
  label: 'Mount Sinai — Skin lesion removal aftercare',
  url: 'https://www.mountsinai.org/health-library/selfcare-instructions/skin-lesion-removal-aftercare',
};

const LESION_AFTERCARE_ALBERTA: ProductContentSource = {
  label: 'MyHealth Alberta — Skin Tag Removal: Care Instructions',
  url: 'https://myhealth.alberta.ca/Health/aftercareinformation/pages/conditions.aspx?hwid=zc1281',
};

export const PRODUCT_CONTENT: ResearchedProductContentEntry[] = [
  {
    sku: 'PRD-00004',
    expectedName: 'Facial Cleansing Gel',
    confidence: 'type-level',
    content: {
      description:
        'A gel-based facial cleanser that lathers with water to wash away daily buildup from the skin.',
      purpose:
        'Used morning and/or evening to cleanse the face by lifting away dirt, excess oil, makeup and other impurities without leaving the skin feeling stripped.',
      benefits:
        'Commonly used to leave skin clean and refreshed while helping maintain the skin’s moisture balance. Gentle enough for regular daily use.',
    },
    sources: {
      description: [CLEANSER_CERAVE, CLEANSER_NEUTROGENA],
      purpose: [CLEANSER_CERAVE, CLEANSER_NEUTROGENA],
      benefits: [CLEANSER_CERAVE],
    },
  },
  {
    sku: 'PRD-00005',
    expectedName: 'Hydrating Serum',
    confidence: 'type-level',
    content: {
      description:
        'A lightweight hydrating serum, typically built around humectants such as hyaluronic acid that draw and hold water in the skin.',
      purpose:
        'Used to replenish moisture and support the skin’s moisture barrier. It is applied after cleansing and before a moisturiser.',
      benefits:
        'Commonly used to boost skin hydration, give skin a smoother and plumper look, and soften the appearance of fine lines caused by dryness.',
    },
    sources: {
      description: [HA_HARVARD, HA_CLINICAL],
      purpose: [HA_HARVARD],
      benefits: [HA_CLINICAL, HA_HARVARD],
    },
  },
  {
    sku: 'PRD-00006',
    expectedName: 'Acne Treatment Cream',
    confidence: 'type-level',
    content: {
      description:
        'An over-the-counter topical cream formulated to help treat mild to moderate acne and blemishes. It is applied directly to the affected areas as part of a daily skincare routine.',
      purpose:
        'Used to help clear up acne pimples and blemishes and to help prevent new ones from forming, by reducing acne-causing bacteria and helping to unclog pores.',
      benefits:
        'Commonly used to reduce the number and appearance of pimples and blemishes, calm inflammation, and support clearer-looking skin with consistent use. Results typically take several weeks.',
    },
    sources: {
      description: [DAILYMED_BPO, MEDLINEPLUS_BPO],
      purpose: [MEDLINEPLUS_BPO, CLEVELAND_BPO],
      benefits: [CLEVELAND_BPO, MEDLINEPLUS_BPO],
    },
  },
  {
    sku: 'PRD-00010',
    expectedName: 'Sunscreen SPF50+',
    confidence: 'type-level',
    content: {
      description:
        'A broad-spectrum sunscreen with SPF 50+, formulated to be applied to the skin before sun exposure and reapplied as directed.',
      purpose:
        'Used to help protect the skin from UVA and UVB radiation, which helps prevent sunburn and reduce the risk of early skin ageing and sun-related skin damage.',
      benefits:
        'Commonly used to help prevent sunburn and protect against sun-related skin ageing when applied as directed. Reapply at least every two hours, and after swimming, sweating or towel drying.',
    },
    sources: {
      description: [FDA_SUNSCREEN, DAILYMED_SPF50],
      purpose: [FDA_SUNSCREEN],
      benefits: [FDA_SUNSCREEN],
    },
  },
  {
    sku: 'PRD-00011',
    expectedName: 'Vitamin C Serum',
    confidence: 'type-level',
    content: {
      description:
        'A topical serum containing vitamin C (usually L-ascorbic acid), a well-studied antioxidant used in brightening and anti-ageing routines.',
      purpose:
        'Used on the skin to provide antioxidant protection against environmental stress and to help brighten and even out the look of the complexion.',
      benefits:
        'Commonly used to help brighten dull skin, even out skin tone and the look of dark spots, and support the skin’s collagen. It can be used alongside sunscreen; start gradually if the skin is sensitive.',
    },
    sources: {
      description: [VITAMIN_C_CLEVELAND],
      purpose: [VITAMIN_C_CLEVELAND, VITAMIN_C_COLUMBIA],
      benefits: [VITAMIN_C_CLEVELAND, VITAMIN_C_COLUMBIA],
    },
  },
  {
    sku: 'PRD-00012',
    expectedName: 'Retinol Night Cream',
    confidence: 'type-level',
    content: {
      description:
        'A night cream containing retinol, a vitamin A derivative widely used in anti-ageing and blemish-prone skincare. It is applied in the evening.',
      purpose:
        'Used overnight to support the skin’s natural cell renewal and to help improve the look of fine lines, uneven texture, dark spots and clogged pores.',
      benefits:
        'Commonly used to smooth the appearance of fine lines and wrinkles, improve skin texture and tone, and help unclog pores over several weeks of use. Skin can become more sun-sensitive, so daytime sunscreen is important.',
    },
    sources: {
      description: [RETINOL_CLEVELAND],
      purpose: [RETINOL_CLEVELAND, RETINOL_REVIEW],
      benefits: [RETINOL_REVIEW, RETINOL_CLEVELAND],
    },
  },
  {
    sku: 'PRD-00014',
    expectedName: 'Collagen Face Mask (10-pack)',
    confidence: 'type-level',
    content: {
      description:
        'A pack of collagen-infused hydrating face masks. Each mask delivers a concentrated essence to the skin and is left on for a short period as a periodic treatment.',
      purpose:
        'Used as a hydrating and conditioning treatment to leave skin feeling moisturised, smoother and refreshed. Much of the benefit comes from the hydrating ingredients rather than the collagen itself.',
      benefits:
        'Commonly used to boost short-term hydration, temporarily plump the look of fine lines, and add a smoother, more radiant appearance. The effect is temporary and works best alongside a consistent skincare routine.',
    },
    sources: {
      description: [COLLAGEN_MASK_CLINICAL],
      purpose: [COLLAGEN_MASK_CLINICAL],
      benefits: [COLLAGEN_MASK_CLINICAL],
    },
  },
  {
    sku: 'PRD-00015',
    expectedName: 'Aloe Vera Gel',
    confidence: 'type-level',
    content: {
      description:
        'A soothing topical gel made with aloe vera, known for its high water content and calming, moisturising properties on the skin.',
      purpose:
        'Used to hydrate and soothe dry, irritated or sun-exposed skin, and to support the skin’s natural recovery after minor irritation.',
      benefits:
        'Commonly used to moisturise the skin, help calm redness and irritation, and support skin comfort and hydration.',
    },
    sources: {
      description: [ALOE_REVIEW],
      purpose: [ALOE_REVIEW, ALOE_HYDRATION],
      benefits: [ALOE_HYDRATION, ALOE_REVIEW],
    },
  },
  {
    sku: 'PRD-00018',
    expectedName: 'Jade Roller Set',
    confidence: 'type-level',
    content: {
      description:
        'A set of facial massage rollers made from jade stone, used with gentle upward strokes on the face and neck as part of a skincare routine.',
      purpose:
        'Used as a cooling facial massage tool to help de-puff the face and support circulation and lymphatic drainage. It is often used to help apply serums and creams.',
      benefits:
        'Commonly used for a soothing, cooling massage that may temporarily reduce puffiness and leave skin looking refreshed and more radiant. Evidence for long-term effects is limited.',
    },
    sources: {
      description: [JADE_ROLLER_REVIEW],
      purpose: [JADE_ROLLER_REVIEW],
      benefits: [JADE_ROLLER_REVIEW],
    },
  },
  {
    sku: 'PRD-00019',
    expectedName: 'Bump Eraiser (Aftercare for Hot Waxing)',
    confidence: 'type-level',
    content: {
      description:
        'A concentrated aftercare spot solution designed for use on the skin after hair removal such as waxing, to help manage post-wax bumps and ingrown hairs.',
      purpose:
        'Used after waxing or other hair removal to help prevent and calm ingrown hairs, redness and small bumps on the treated area.',
      benefits:
        'Commonly used to help reduce the appearance of post-wax bumps and redness, soothe irritated skin, and support smoother-looking skin when used regularly after hair removal.',
    },
    sources: {
      description: [WAX_AFTERCARE],
      purpose: [WAX_AFTERCARE],
      benefits: [WAX_AFTERCARE, WAX_AFTERCARE_SKINCARE],
    },
  },
  {
    sku: 'PRD-00020',
    expectedName: 'Post Healing Cream (Aftercare for Warts/Skin Tag Removal)',
    confidence: 'type-level',
    content: {
      description:
        'A topical aftercare cream intended for use on small treated areas after procedures such as wart or skin tag removal.',
      purpose:
        'Used after a minor removal procedure to keep the treated area comfortable and moisturised while it heals, following the aftercare advice given by our clinic staff.',
      benefits:
        'Commonly used to support comfort and help keep the treated area conditioned while it heals. Keep the area clean and dry, do not pick at scabs, and protect it from sun exposure.',
    },
    sources: {
      description: [LESION_AFTERCARE_MS],
      purpose: [LESION_AFTERCARE_MS, LESION_AFTERCARE_ALBERTA],
      benefits: [LESION_AFTERCARE_MS, LESION_AFTERCARE_ALBERTA],
    },
  },
];
