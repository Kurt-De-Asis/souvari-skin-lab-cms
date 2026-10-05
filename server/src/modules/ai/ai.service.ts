import prisma from '../../config/database';
import { env } from '../../config/env';
import { SendMessageInput } from './ai.validation';
import {
  detectIntents,
  loadRetailProducts,
  matchProducts,
  isCatalogBrowseQuery,
  isReferentialProductFollowUp,
  isThingLookupShape,
  looksLikeProductLookup,
  mentionsProduct,
  normalizeQuery,
  productsForService,
  renderAmbiguousReply,
  renderCatalogReply,
  renderNoMatchReply,
  renderProductAnswer,
  renderRelatedProductsReply,
  type ProductIntent,
  type ProductRecord,
} from './product-knowledge';
import crypto from 'crypto';

class AiService {
  private systemPrompt = '';
  private systemPromptBuiltAt = 0;

  /** In-memory per-session context so follow-ups like "how much for that?" work without an LLM. */
  private sessionContext = new Map<
    number,
    { lastServices: string[]; lastConcern: string | null; lastProducts: ProductRecord[] }
  >();

  /** Strong standalone signals — a single match means the message is clinic-related. */
  private static readonly STRONG_CLINIC_KEYWORDS = [
    'clinic', 'souvari', 'skin lab', 'skincare', 'skin care', 'skin', 'derma', 'dermal',
    'aesthetic', 'aesthetician', 'beauty', 'facial', 'facials', 'laser', 'peel', 'peels',
    'treatment', 'treatments', 'appointment', 'appointments', 'membership', 'members',
    'promo', 'promotion', 'discount', 'package', 'voucher', 'price list', 'pricelist',
    'rejuvenation', 'contouring', 'vein', 'veins', 'acne', 'pigmentation', 'injection',
    'wrinkle', 'wrinkles', 'fine line', 'fine lines', 'sagging', 'pore', 'pores', 'oily',
    'spot', 'spots', 'scar', 'scars', 'lifting', 'firming', 'aging', 'whitening', 'glow',
    'hyperpigmentation', 'melasma', 'dark spot', 'dark spots', 'blemish', 'breakout',
  ];

  /** Ambiguous words — only clinic-related when supported by another signal (you/your, or 2+ words). */
  private static readonly WEAK_CLINIC_KEYWORDS = [
    'book', 'booking', 'schedule', 'reserve', 'hours', 'hour', 'open', 'close',
    'closed', 'time', 'times', 'price', 'prices', 'pricing', 'cost', 'fee', 'rates',
    'how much', 'service', 'services', 'offer', 'offers', 'recommend', 'recommendation',
    'recommendations', 'suggest', 'suggestion', 'popular', 'best seller', 'best selling',
    'best-seller', 'best-selling', 'bestseller', 'top service', 'most requested',
    'most booked', 'address', 'location', 'located', 'phone', 'contact', 'where', 'reach',
    'which service', 'what to get',
  ];

  /** Concise, on-topic answers for one-word / very short questions (e.g. "acne", "nails", "botox"). */
  private static readonly SHORT_TOPICS: Array<{ tokens: string[]; blurb: string; needles: string[] }> = [
    {
      tokens: ['acne'],
      blurb: 'Acne and breakouts are one of the most common concerns we treat — with deep-cleansing facials, laser treatments, and skin-repairing microneedling.',
      needles: ['acne clear', 'carbon laser', 'pico laser', 'dermapen'],
    },
    {
      tokens: ['botox'],
      blurb: 'Botox relaxes fine lines and wrinkles for a smoother, fresher look — we also offer dermal fillers and non-injectable lifting options.',
      needles: ['botox', 'dermal filler', 'rf face', 'mesobotox'],
    },
    {
      tokens: ['filler', 'fillers'],
      blurb: 'Dermal fillers restore lost volume and shape — commonly used for the lips, cheeks, and nasolabial folds.',
      needles: ['dermal filler', 'botox'],
    },
    {
      tokens: ['nail', 'nails'],
      blurb: 'We offer manicures, pedicures, BIAB, and gel services to keep your nails healthy, strong, and styled.',
      needles: ['manicure', 'pedicure', 'biab', 'gel nails'],
    },
    {
      tokens: ['laser'],
      blurb: 'Our lasers treat skin rejuvenation, pigmentation, stubborn acne marks, and unwanted hair across the face and body.',
      needles: ['laser'],
    },
    {
      tokens: ['facial', 'facials'],
      blurb: 'Facials are custom, glow-boosting treatments — from classic cleansing and anti-aging to hydra and diamond finishes.',
      needles: ['facial'],
    },
    {
      tokens: ['hydrafacial', 'hydra facial'],
      blurb: 'HydraFacials deeply cleanse, exfoliate, and hydrate for an instant glow with zero downtime.',
      needles: ['hydrafacial'],
    },
    {
      tokens: ['hifu'],
      blurb: 'HIFU uses focused ultrasound to lift and tighten the face and neck without surgery or downtime.',
      needles: ['hifu'],
    },
    {
      tokens: ['whitening', 'whiten'],
      blurb: 'Whitening and brightening treatments even out skin tone and add radiance.',
      needles: ['whitening', 'glutathione', 'vitamin c'],
    },
    {
      tokens: ['glow'],
      blurb: 'Our glow-boosting treatments hydrate, exfoliate, and brighten for instant radiance.',
      needles: ['glow'],
    },
    {
      tokens: ['dermapen'],
      blurb: 'Dermapen micro-needling stimulates collagen to smooth scars, pores, and skin texture.',
      needles: ['dermapen'],
    },
    {
      tokens: ['pico'],
      blurb: 'Pico laser treatments target pigmentation, acne marks, and tattoos with minimal downtime.',
      needles: ['pico laser'],
    },
    {
      tokens: ['carbon'],
      blurb: 'Carbon laser peeling softens the skin, refines pores, and clears excess oil and breakouts.',
      needles: ['carbon laser'],
    },
    {
      tokens: ['unwanted hair', 'hair removal', 'remove hair'],
      blurb: 'Laser hair removal safely reduces unwanted hair on the face, underarms, arms, and body.',
      needles: ['hair removal', 'laser hair removal'],
    },
    {
      tokens: ['contour', 'contouring', 'slimming', 'slim', 'lipo', 'fat freeze'],
      blurb: 'Body contouring and slimming treatments target stubborn fat and tone the body.',
      needles: ['body contour', 'lipo', 'fat', 'slim'],
    },
    {
      tokens: ['peel', 'peels'],
      blurb: 'Chemical peels exfoliate and renew the skin to fade pigmentation and smooth texture.',
      needles: ['chemical peel', 'diamond peel'],
    },
    {
      tokens: ['package', 'packages'],
      blurb: 'We offer session packages that bundle popular treatments at a better rate.',
      needles: [],
    },
    {
      tokens: ['membership', 'member', 'vip'],
      blurb: 'We offer VIP memberships with exclusive discounts and perks.',
      needles: [],
    },
  ];

  /** Skin-concern knowledge map used for scored recommendations. */
  private static readonly SKIN_CONCERNS = [
    {
      label: 'acne and blemishes',
      tokens: ['acne', 'blemish', 'blemishes', 'pimple', 'pimples', 'breakout', 'breakouts', 'sebum', 'cystic', 'zit', 'zits', 'blackhead', 'blackheads'],
      phrases: ['acne scar', 'acne scars'],
      targets: ['acne treatment', 'acne clear', 'dermapen', 'carbon laser', 'pico laser'],
    },
    {
      label: 'dark spots and pigmentation',
      tokens: ['pigmentation', 'hyperpigmentation', 'melasma', 'freckle', 'freckles', 'uneven', 'tone', 'spot', 'spots', 'brighten', 'lighten'],
      phrases: ['dark spot', 'dark spots', 'sun spots', 'age spots', 'skin tone', 'patchy skin'],
      targets: ['chemical peel', 'diamond peel', 'skin rejuvenation laser', 'whitening', 'vitamin c', 'glutathione push', 'pico laser'],
    },
    {
      label: 'wrinkles and fine lines',
      tokens: ['wrinkle', 'wrinkles', 'aging', 'ageing', 'collagen', 'sag', 'sagging'],
      phrases: ['fine line', 'fine lines', 'anti aging', 'anti-aging', 'under eye', 'dark circle', 'dark circles'],
      targets: ['botox', 'dermal filler', 'pico laser', 'carbon laser', 'anti-aging facial', 'rejuran', 'rf face'],
    },
    {
      label: 'sagging and lifting',
      tokens: ['sag', 'sagging', 'lift', 'lifting', 'firm', 'firming', 'tighten', 'tightening', 'laxity'],
      phrases: ['skin tightening', 'face lifting', 'neck lifting'],
      targets: ['hifu', 'neck lifting', 'lower face', 'upper face', 'rf face', 'rf body', 'mesobotox', 'full face + neck'],
    },
    {
      label: 'large pores and oily skin',
      tokens: ['pore', 'pores', 'oily', 'oiliness', 'greasy'],
      phrases: ['large pore', 'large pores', 'big pores'],
      targets: ['hydrafacial', 'carbon laser', 'pico laser', 'glow facial', 'dermapen', 'diamond glow'],
    },
    {
      label: 'dry, dull and dehydrated skin',
      tokens: ['dry', 'dryness', 'dehydrated', 'dehydration', 'rough', 'flaky', 'dull', 'radiance', 'glow', 'hydrate', 'hydration'],
      phrases: ['dry skin', 'dull skin', 'glowing skin', 'glow skin'],
      targets: ['hydrafacial', 'glow facial', 'diamond glow', 'diamond peel', 'skin booster', 'rejuran', 'microdermabrasion'],
    },
    {
      label: 'whitening and brightening',
      tokens: ['whiten', 'whitening', 'brighten', 'brightening', 'lighten', 'fairer', 'fairness'],
      phrases: ['skin whitening', 'whitening treatment', 'lightening'],
      targets: ['whitening', 'glutathione push', 'whitening drip', 'vitamin c'],
    },
    {
      label: 'hair removal',
      tokens: ['hairy', 'hairless', 'unwanted'],
      phrases: ['hair removal', 'remove hair', 'body hair', 'underarm hair', 'armpit hair'],
      targets: ['laser hair removal', 'underarms', 'upper arms', 'lower arms'],
    },
    {
      label: 'weak or brittle nails',
      tokens: ['weak', 'brittle', 'peeling', 'breakage', 'breaking', 'soft', 'thin', 'damaged'],
      phrases: ['weak nails', 'brittle nails', 'peeling nails', 'breaking nails', 'thin nails', 'soft nails', 'nail health', 'nail care'],
      targets: ['manicure', 'pedicure', 'biab', 'gel', 'consultation'],
    },
    {
      label: 'body fat and contouring',
      tokens: ['fat', 'belly', 'tummy', 'contour', 'contours', 'lipo', 'slim', 'slimming', 'cellulite'],
      phrases: ['body contour', 'body contouring', 'belly fat', 'double chin', 'stubborn fat', 'body shaping'],
      targets: ['body contouring', 'belly line', 'lipo', 'mesolipo', 'fat freeze', 'fat burner', 'chin lipolysis', 'rf body'],
    },
    {
      label: 'veins and redness',
      tokens: ['vein', 'veins', 'redness', 'vascular'],
      phrases: ['spider veins', 'varicose vein', 'red veins'],
      targets: [],
    },
    {
      label: 'skin rejuvenation',
      tokens: ['rejuvenation', 'rejuvenate', 'revive', 'younger', 'fresh'],
      phrases: ['skin rejuvenation', 'youthful skin', 'skin renewal'],
      targets: ['skin rejuvenation laser', 'chemical peel', 'diamond peel', 'dermapen', 'rejuran'],
    },
  ];

  private static readonly CATEGORY_STOP_TOKENS = new Set([
    'facial', 'facials', 'laser', 'injection', 'body', 'package', 'other',
    'consultation', 'peel', 'peels', 'hair', 'removal', 'skin', 'rejuvenation',
    'treatment', 'treatments', 'signature', 'service', 'services',
  ]);

  private static readonly NAIL_PATTERN = /manicure|pedicure|\bnail(s)?\b|nail art|extension|mermaid|\b3d\b|gel/;

  /** Lower-body / area-specific service names that should never satisfy a facial skin-concern match. */
  private static readonly BODY_AREA_PATTERN = /bikini|underarm|under arms|armpit|elbows?|knees?|nape|buttocks?|\bheel\b|toes?|\bback\b|thighs?|calves?|feet|foot|hands?|hips?|waist|abdomen|belly|shins?|shoulders?|brasilian|brazilian/;

  private static readonly NEW_CLIENT_TRIGGERS = [
    'first time', 'new client', 'new to souvari', 'never been', 'first visit', 'new here', 'first appointment',
  ];

  /** Is this message about the clinic / its services? */
  private async isClinicRelated(message: string, services: Array<{ name: string; category: string }>): Promise<boolean> {
    const lower = message.toLowerCase();

    // 1) Strong clinic word alone is enough.
    for (const kw of AiService.STRONG_CLINIC_KEYWORDS) {
      if (lower.includes(kw)) return true;
    }

    // 1b) A bare topic word (e.g. "acne", "nails", "botox") is on-topic on its own.
    for (const topic of AiService.SHORT_TOPICS) {
      if (topic.tokens.some((tok) => lower.includes(tok))) return true;
    }

    // 2) Any active service name/category counts as a strong signal.
    for (const s of services) {
      const name = s.name.toLowerCase();
      const category = s.category.toLowerCase().replace(/_/g, ' ');
      if (name.length >= 2 && lower.includes(name)) return true;
      if (category.length >= 3 && lower.includes(category)) return true;
    }

    // 3) Weak words need support: mention of "you/your" (asking the clinic) or 2+ weak words.
    const weakHits = AiService.WEAK_CLINIC_KEYWORDS.filter((kw) => lower.includes(kw));
    if (weakHits.length === 0) return false;

    const addressesClinic = /\byou\b|\byour\b|\byours\b|\bfor me\b|\bfor us\b/.test(lower);
    if (addressesClinic) return true;
    if (weakHits.length >= 2) return true;

    // 3) A name from the product catalog counts as clinic-related, so typing a
    // product name on its own is answered rather than refused as off-topic.
    const productQuery = normalizeQuery(message);
    if (mentionsProduct(productQuery)) {
      const products = await loadRetailProducts();
      if (matchProducts(products, productQuery).kind !== 'none') return true;
    }

    return false;
  }

  private static readonly STOPWORDS = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'for', 'to', 'of', 'in', 'on', 'at', 'by',
    'with', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'do', 'does', 'did',
    'you', 'your', 'yours', 'our', 'ours', 'us', 'it', 'its', 'this', 'that', 'these',
    'those', 'what', 'which', 'who', 'when', 'where', 'why', 'how', 'can', 'could',
    'will', 'would', 'should', 'may', 'might', 'must', 'not', 'no', 'yes', 'please',
    'tell', 'about', 'want', 'need', 'have', 'has', 'had', 'get', 'got', 'good',
    'great', 'any', 'some', 'there', 'here', 'lot', 'like', 'really', 'much', 'many',
    'also', 'just', 'very', 'things', 'thing', 'one', 'am', 'them', 'they', 'he', 'she',
  ]);

  /** Basic NLP tokenizer: lowercase, strip punctuation, drop stopwords and junk tokens. */
  private tokenize(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter((t) => t.length > 1 && !AiService.STOPWORDS.has(t));
  }

  /** Classic information-retrieval cosine similarity over term-frequency vectors. */
  private cosineSimilarity(a: string[], b: string[]): number {
    if (a.length === 0 || b.length === 0) return 0;
    const mapA = new Map<string, number>();
    for (const t of a) mapA.set(t, (mapA.get(t) || 0) + 1);
    const mapB = new Map<string, number>();
    for (const t of b) mapB.set(t, (mapB.get(t) || 0) + 1);
    let dot = 0;
    for (const [t, c] of mapA) if (mapB.has(t)) dot += c * (mapB.get(t) || 0);
    let lenA = 0;
    for (const v of mapA.values()) lenA += v * v;
    let lenB = 0;
    for (const v of mapB.values()) lenB += v * v;
    if (lenA === 0 || lenB === 0) return 0;
    return dot / (Math.sqrt(lenA) * Math.sqrt(lenB));
  }

  private levenshtein(a: string, b: string): number {
    const m = a.length;
    const n = b.length;
    if (m === 0) return n;
    if (n === 0) return m;
    let prev = Array.from({ length: n + 1 }, (_, i) => i);
    for (let i = 1; i <= m; i++) {
      const cur = [i];
      for (let j = 1; j <= n; j++) {
        cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      }
      prev = cur;
    }
    return prev[n];
  }

  /** Fuzzy (typo-tolerant) token equality via capped Levenshtein distance. */
  private fuzzyMatch(token: string, reference: string): boolean {
    if (token === reference) return true;
    // Guard against single-letter-confusable pairs (shine~line, veins~lines, pores~more).
    if (token[0] !== reference[0]) return false;
    const max = token.length <= 4 ? 1 : token.length <= 8 ? 2 : 3;
    return this.levenshtein(token, reference) <= max;
  }

  /**
   * Retrieval: find the best-matching service for a free-form message.
   * Uses exact + fuzzy token matching against service names (category terms are de-scored).
   */
  private findServiceByMessage(lowerMessage: string, services: any[]): { service: any; score: number } | null {
    const msgTokens = this.tokenize(lowerMessage);
    if (msgTokens.length === 0) return null;

    const normalizedQuery = lowerMessage.trim().replace(/\s+/g, ' ');

    // Fast path: the raw phrase appears verbatim inside a service name
    // (e.g. "carbon laser" -> "Hollywood Carbon Laser Peel (Face)"). Only fires
    // for multi-word queries; single tokens fall through to token matching.
    if (normalizedQuery.split(/\s+/).length >= 2) {
      const contains = services.filter((s) => s.name.toLowerCase().includes(normalizedQuery));
      if (contains.length > 0) {
        const isPkg = (s: any) => /\bsess\b/.test(s.name.toLowerCase());
        const nonArea = contains.filter((s) => !AiService.BODY_AREA_PATTERN.test(s.name.toLowerCase()));
        const pool = nonArea.length > 0 ? nonArea : contains;
        const nonPkg = pool.filter((s) => !isPkg(s));
        const pool2 = nonPkg.length > 0 ? nonPkg : pool;
        const pref =
          pool2.find((s) => s.name.toLowerCase().startsWith(normalizedQuery)) ??
          pool2.reduce((a, b) => (a.name.length <= b.name.length ? a : b));
        return { service: pref, score: 100 };
      }
    }

    let best: { service: any; score: number; name: string } | null = null;

    for (const s of services) {
      const nameTokens = this.tokenize(s.name);
      if (nameTokens.length === 0) continue;

      let exact = 0;
      let fuzzy = 0;
      let firstTokenExact = false;

      for (const mt of msgTokens) {
        if (AiService.CATEGORY_STOP_TOKENS.has(mt)) continue;
        for (let i = 0; i < nameTokens.length; i++) {
          const nt = nameTokens[i];
          if (mt === nt) {
            exact += 1;
            if (i === 0) firstTokenExact = true;
            break;
          }
          if (mt.length >= 5 && this.fuzzyMatch(mt, nt)) {
            fuzzy += 1;
            break;
          }
        }
      }

      let score = exact * 2 + fuzzy;
      const shortQuery = msgTokens.length <= 6;
      const isCandidate =
        score >= 3 ||
        (firstTokenExact && exact === 1 && nameTokens.length > 1 && shortQuery) ||
        (exact === 1 && nameTokens.length === 1);

      if (isCandidate) {
        if (firstTokenExact && exact === 1 && nameTokens.length > 1 && score < 3) score = 3;
        if (exact === 1 && nameTokens.length === 1 && score < 3) score = 3;
        const candidate = { service: s, score, name: s.name.toLowerCase() };
        if (!best || candidate.score > best.score) {
          best = candidate;
        } else if (candidate.score === best.score) {
          // Prefer a service whose full name starts with the query phrase
          // (e.g. "carbon laser" -> "Carbon Laser ...", not "Knees – Carbon Laser ...").
          const candStarts = candidate.name.startsWith(normalizedQuery);
          const bestStarts = best.name.startsWith(normalizedQuery);
          if (candStarts && !bestStarts) {
            best = candidate;
          } else if (candStarts === bestStarts && candidate.name.length < best.name.length) {
            best = candidate;
          }
        }
      }
    }

    return best ? { service: best.service, score: best.score } : null;
  }

  /** Which concern-group keywords/phrases appear in the message? */
  private concernHits(lowerMessage: string, msgTokens: string[], group: { tokens: string[]; phrases: string[] }): string[] {
    const hits: string[] = [];
    for (const p of group.phrases) if (lowerMessage.includes(p)) hits.push(p);
    for (const t of group.tokens) {
      if (msgTokens.some((mt) => mt === t || (t.length >= 5 && this.fuzzyMatch(mt, t)))) hits.push(t);
    }
    return hits;
  }

  private serviceText(s: any): string {
    return `${s.name} ${s.description || ''} ${s.category.replace(/_/g, ' ')}`.toLowerCase();
  }

  /** Does the service's own text mention a concern term (token/fuzzy level)? */
  private serviceHasTerm(term: string, textTokens: string[]): boolean {
    if (term.includes(' ')) {
      const t = this.tokenize(term);
      return t.length > 0 && t.every((tok) => textTokens.includes(tok));
    }
    return textTokens.includes(term) || textTokens.some((tok) => term.length >= 5 && this.fuzzyMatch(term, tok));
  }

  /**
   * Scored recommendation engine over the full service catalog:
   * name hits, concern-group keyword scoring, category affinity, and cosine-similarity retrieval.
   */
  private recommend(lowerMessage: string, services: any[]): Array<{ service: any; reasons: string[] }> {
    const msgTokens = this.tokenize(lowerMessage);
    const scores = new Map<number, number>();
    const reasons = new Map<number, string[]>();

    const bump = (id: number, delta: number, reason: string) => {
      scores.set(id, (scores.get(id) || 0) + delta);
      const r = reasons.get(id) || [];
      if (!r.includes(reason)) r.push(reason);
      reasons.set(id, r);
    };

    // Concern-group keyword matching across name + description + category (computed first so the
    // direct-name bump below yields to genuine skin-concern signals).
    const msgConcernGroups: Array<{ group: (typeof AiService.SKIN_CONCERNS)[number]; hits: string[] }> = [];
    for (const group of AiService.SKIN_CONCERNS) {
      const hits = this.concernHits(lowerMessage, msgTokens, group);
      if (hits.length > 0) msgConcernGroups.push({ group, hits });
    }

    // A) Direct / fuzzy service-name hit gets the strongest priority — unless the message is
    // really about a skin concern (so a generic name like "Face" can't beat real acne picks).
    const svcHit = this.findServiceByMessage(lowerMessage, services);
    if (svcHit && msgConcernGroups.length === 0) {
      bump(svcHit.service.id, 100, 'This matches exactly what you asked about');
      services
        .filter((s) => s.id !== svcHit.service.id && s.category === svcHit.service.category)
        .slice(0, 2)
        .forEach((s) => bump(s.id, 8, `Popular in the ${svcHit.service.category} category`));
    }

    // B) Concern-group keyword matching across name + description + category.
    for (const { group, hits } of msgConcernGroups) {
      let touched = false;
      const tokensToCheck = [...group.tokens, ...group.phrases];
      for (const s of services) {
        const textTokens = this.tokenize(this.serviceText(s));
        const textHits = tokensToCheck.filter((k) => this.serviceHasTerm(k, textTokens)).length;
        if (textHits > 0) {
          bump(s.id, hits.length * 3 + textHits * 2, `Ideal for ${group.label}`);
          touched = true;
        }
      }
      // Knowledge-base hook: known treatments for this concern even when descriptions are terse.
      for (const target of group.targets || []) {
        for (const s of services) {
          const name = s.name.toLowerCase();
          if (name.includes(target) && !AiService.BODY_AREA_PATTERN.test(name)) {
            bump(s.id, 30, `Ideal for ${group.label}`);
            touched = true;
          }
        }
      }
      if (!touched) {
        for (const s of services) {
          const sim = this.cosineSimilarity(msgTokens, this.tokenize(this.serviceText(s)));
          if (sim >= 0.25) bump(s.id, Math.round(sim * 20), `Recommended for ${group.label}`);
        }
      }
    }

    // C) Category affinity.
    const category = this.mentionedCategory(lowerMessage, services);
    if (category) {
      services.filter((s) => s.category === category).forEach((s) => bump(s.id, 6, `Popular in the ${category} category`));
    }

    // D) General cosine retrieval for on-topic queries that matched nothing specific.
    if (msgConcernGroups.length === 0 && !svcHit && !category) {
      for (const s of services) {
        const sim = this.cosineSimilarity(msgTokens, this.tokenize(this.serviceText(s)));
        if (sim >= 0.3) bump(s.id, Math.round(sim * 30), 'Closely matches what you described');
      }
    }

    // E) Rank, filter nail/misc noise, and cap at 3.
    const ranked = services
      .map((s) => ({ service: s, score: scores.get(s.id) || 0, reasons: reasons.get(s.id) || [] }))
      .filter((r) => r.score > 0)
      .filter((r) => !(r.service.category === 'other' && r.score < 8))
      .filter((r) => !(AiService.NAIL_PATTERN.test(r.service.name.toLowerCase()) && r.score < 12 && !AiService.NAIL_PATTERN.test(lowerMessage)))
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);

    return ranked.map((r) => ({ service: r.service, reasons: r.reasons.slice(0, 2) }));
  }

  private readonly OFF_TOPIC_REPLY =
    "I'm here to answer questions about Souvari Skin Lab — our services, pricing, " +
    'clinic hours, and location. That question is outside what I can help with. ' +
    'If you have any questions about our treatments or pricing, feel free to ask!';

  private readonly HELP_REPLY =
    "I can help you with:\n" +
    "- Information about our services and treatments\n" +
    "- Service pricing and packages\n" +
    "- Our best-selling and recommended services\n" +
    "- Clinic hours, location, and contact details\n\n" +
    "What would you like to know?";

  private greetingResponse(): string {
    return `Hello! Welcome to Souvari Skin Lab. I can help you with:\n- Service information and pricing\n- Best-selling and recommended services\n- Clinic hours and contact details\n\nHow can I assist you today?\n\nPlease consult with our clinic professionals for personalized advice.`;
  }

  private thanksResponse(): string {
    return "You're welcome! If you have any other questions, feel free to ask. For personalized advice, please consult with our clinic professionals.";
  }

  private emergencyResponse(): string {
    return "If you are experiencing a medical emergency, please call 911 or your local emergency number immediately.\n\nFor non-urgent concerns, please contact the clinic directly to speak with our professionals.";
  }

  private isGreeting(lower: string): boolean {
    return /\b(hi|hello|hey|good morning|good afternoon|good evening)\b/.test(lower);
  }

  private isThanks(lower: string): boolean {
    return /\b(thank you|thanks|thank)\b/.test(lower);
  }

  private isEmergency(lower: string): boolean {
    return lower.includes('emergency') || lower.includes('urgent') || lower.includes('911') || lower.includes('severe pain') || lower.includes('allergic reaction');
  }

  /**
   * How long a built prompt is reused before it is rebuilt from the database.
   * Without this the prompt was cached for the lifetime of the process, so a
   * service added after startup never reached the assistant until a restart.
   */
  private static readonly PROMPT_TTL_MS = 10 * 60 * 1000;

  async buildSystemPrompt(): Promise<string> {
    const fresh = Date.now() - this.systemPromptBuiltAt < AiService.PROMPT_TTL_MS;
    if (this.systemPrompt && fresh) {
      return this.systemPrompt;
    }

    const [services, settings, popular] = await Promise.all([
      prisma.services.findMany({
        where: { status: 'active', deleted_at: null },
        select: { name: true, description: true, price: true, duration_minutes: true, category: true },
      }),
      prisma.system_settings.findMany({
        where: {
          setting_key: { in: ['clinic_name', 'clinic_hours', 'clinic_phone', 'clinic_address'] },
        },
      }),
      this.getPopularServices(5),
    ]);

    const settingsMap = new Map(settings.map((s) => [s.setting_key, s.setting_value]));

    const clinicName = settingsMap.get('clinic_name')?.replace(/"/g, '') || 'Souvari Skin Lab';
    const clinicHours = settingsMap.get('clinic_hours')?.replace(/"/g, '') || 'Monday-Saturday: 9:00 AM - 6:00 PM, Sunday: Closed';
    const clinicPhone = settingsMap.get('clinic_phone')?.replace(/"/g, '') || 'Please contact the clinic for phone number';
    const clinicAddress = settingsMap.get('clinic_address')?.replace(/"/g, '') || 'Please contact the clinic for address';

    const serviceList = services
      .map(
        (s) =>
          `- ${s.name} (${s.category}): ${this.formatPrice(s.price)} - ${s.duration_minutes} minutes. ${s.description || ''}`
      )
      .join('\n');

    const popularList = popular
      .map((s) => `- ${s.name}: ${this.formatPrice(s.price)} (${s.duration_minutes} minutes)`)
      .join('\n');

    this.systemPrompt = `You are a helpful AI assistant for ${clinicName}, a beauty and aesthetics clinic.

CLINIC INFORMATION:
- Name: ${clinicName}
- Hours: ${clinicHours}
- Phone: ${clinicPhone}
- Address: ${clinicAddress}

AVAILABLE SERVICES:
${serviceList || 'No services currently listed. Please contact the clinic directly.'}

FREE CONSULTATION:
- The FREE "Free Skin Consultation" service costs ₱0 and is open to every client — new and returning alike. Always describe it as free.

BEST-SELLING SERVICES (most booked):
${popularList || 'Booking data not yet available.'}

IMPORTANT SAFETY INSTRUCTIONS:
- NEVER provide medical diagnoses or health assessments
- NEVER recommend medications, drugs, or treatments for medical conditions
- NEVER provide emergency medical guidance - always direct to emergency services (call 911 or local emergency number)
- ONLY recommend services that exist in the system listed above
- Always include a disclaimer: "Please consult with our clinic professionals for personalized advice."
- If you are uncertain about anything, say: "I don't have enough information. Please contact the clinic directly."
- Do not make up services, prices, or information not provided above
- Focus on service information, pricing, clinic hours, best-selling services, and general beauty/aesthetics questions

STRICT TOPIC RULE:
- You may ONLY answer questions directly related to this clinic, its services, pricing, hours, location, contact details, and general beauty/aesthetics care provided by this clinic.
- For ANY question that is not about this clinic or its services (for example politics, sports, current events, recipes, programming, or any unrelated topic), respond ONLY with: "${this.OFF_TOPIC_REPLY}"
- Do not engage with, elaborate on, or answer off-topic questions under any circumstances.

RESPONSE GUIDELINES:
- Be concise. Aim for at most 3-4 short sentences per answer. When listing services, give at most 3 options, each with a one-line reason.
- If the user asks a one-word or very short question naming a treatment, service, or concern (e.g. "acne", "nails", "botox", "laser", "hifu"), answer immediately with 1-2 short sentences and 1-2 matching services with prices. Do NOT ask a clarifying question first; keep it brief.
- NEVER dump the full service menu or the full price list.
- CLARIFY FIRST, BUT ONLY ONCE: If the user asks a broad service, recommendation, or pricing question (such as "what services do you have", "recommend something", "what should I get", or "prices") WITHOUT naming a skin concern, a specific area, or a specific treatment, do NOT answer with a list yet. Ask ONE short question to understand their need — e.g. their main skin concern/goal and whether it is for their face or body.
- After the user answers, respond with 2-3 targeted services and a one-line reason for each, then invite them to ask about any of them.
- If the follow-up answer is still vague, do NOT ask again. Give a brief fallback: the top 3 best-selling services, or the FREE "Free Skin Consultation".
- Mention the FREE "Free Skin Consultation" as a great way to start whenever a client is deciding what to book.
- Example — User: "recommend something for me" -> You: "I would love to help! Could you tell me your main skin concern or goal (e.g. acne, dark spots, wrinkles, dryness, whitening) and whether it is for your face or body?"
- Example — User: "I have acne" -> You: "For acne and breakouts, our top picks are: 1) Acne Clear — deep-cleansing with extraction; 2) Carbon Laser — targets breakouts and oil; 3) Dermapen — helps with acne marks. Want more details on any of these?"

You should be friendly, professional, and helpful while staying within these boundaries.`;
    this.systemPromptBuiltAt = Date.now();
    return this.systemPrompt;
  }

  async processMessage(input: SendMessageInput, userId?: number) {
    let sessionToken = input.session_token;
    let session;

    if (sessionToken) {
      session = await prisma.chat_sessions.findUnique({
        where: { session_token: sessionToken },
      });
    }

    if (!session) {
      sessionToken = crypto.randomBytes(32).toString('hex');
      session = await prisma.chat_sessions.create({
        data: {
          user_id: userId || null,
          session_token: sessionToken,
        },
      });
    }

    await prisma.chat_messages.create({
      data: {
        session_id: session.id,
        sender_type: 'user',
        content: input.message,
      },
    });

    let botResponse: string;

    if (env.AI_API_KEY) {
      const lower = input.message.toLowerCase();

      // Deterministic safety-first pipeline: greetings/thanks/emergency and the
      // relevance gate run BEFORE any LLM call, so off-topic queries never reach
      // the model and no tokens are wasted.
      if (this.isThanks(lower)) {
        botResponse = this.thanksResponse();
      } else if (this.isEmergency(lower)) {
        botResponse = this.emergencyResponse();
      } else if (this.isGreeting(lower)) {
        // Greetings are checked before any product lookup, otherwise a short
        // greeting reads as an unknown product name.
        botResponse = this.greetingResponse();
      } else {
        const services = await this.getActiveServices();

        // Context-anchored follow-ups are resolved BEFORE a fresh lookup, so
        // "tell me about this product" continues the previous product instead of
        // being reported as a product we do not have.
        const followUpIntents = this.followUpProductIntents(lower);
        const followUpReply = followUpIntents
          ? await this.productAnswer(session.id, input.message, followUpIntents, services)
          : null;

        // Products are resolved from the database before the LLM, so a product
        // question never reaches the model and can never be embellished.
        const productReply = followUpReply ?? (await this.productAnswer(session.id, input.message, undefined, services));
        if (productReply) {
          botResponse = productReply;
        } else if (!(await this.isClinicRelated(lower, services))) {
          botResponse = this.OFF_TOPIC_REPLY;
        } else {
          botResponse = await this.llmWithFallback(input.message, session.id);
        }
      }
    } else {
      botResponse = await this.ruleBasedResponse(input.message, session.id);
    }

    await prisma.chat_messages.create({
      data: {
        session_id: session.id,
        sender_type: 'bot',
        content: botResponse,
      },
    });

    return {
      session_token: sessionToken,
      response: botResponse,
    };
  }

  /** Calls the configured model but falls back to the deterministic engine on ANY error. */
  private async llmWithFallback(message: string, sessionId: number): Promise<string> {
    try {
      return await this.callOpenAI(message, sessionId);
    } catch (error) {
      console.error('LLM call failed, falling back to rule-based engine:', error);
      return this.ruleBasedResponse(message, sessionId);
    }
  }

  private async callOpenAI(message: string, sessionId: number): Promise<string> {
    const { default: OpenAI } = await import('openai');
    const openai = new OpenAI({
      apiKey: env.AI_API_KEY,
      baseURL: env.AI_BASE_URL || undefined,
      timeout: 30000,
    });

    const recentMessages = await prisma.chat_messages.findMany({
      where: { session_id: sessionId },
      orderBy: { created_at: 'desc' },
      take: 10,
    });

    const history = recentMessages.reverse().map((m) => ({
      role: m.sender_type === 'user' ? ('user' as const) : ('assistant' as const),
      content: m.content,
    }));

    const systemPrompt = await this.buildSystemPrompt();

    const completion = await openai.chat.completions.create({
      model: env.AI_MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        ...history,
      ],
      max_tokens: 300,
      temperature: 0.7,
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      return "I'm sorry, I couldn't generate a response. Please contact the clinic directly.";
    }
    return this.stripMarkdown(content).trim();
  }

  /** Strip LLM markdown asterisks (bold/italic/bullets) so the chat renders plain text. */
  private stripMarkdown(text: string): string {
    return text
      .replace(/\*\*(.+?)\*\*/g, '$1')
      .replace(/(^|\n)\s*\*\s+/g, '$1• ')
      .replace(/\*/g, '');
  }

  /** Most-booked active services (excluding cancelled/no-show appointments). */
  private async getPopularServices(limit = 5, category?: string) {
    const appointments = await prisma.appointments.findMany({
      where: {
        deleted_at: null,
        status: { notIn: ['cancelled', 'no_show'] },
      },
      select: {
        service_id: true,
        service: {
          select: {
            id: true,
            name: true,
            price: true,
            duration_minutes: true,
            category: true,
            description: true,
          },
        },
      },
    });

    const counts = new Map<number, { service: any; count: number }>();
    for (const a of appointments) {
      if (!a.service) continue;
      if (category && a.service.category !== category) continue;
      const existing = counts.get(a.service_id);
      if (existing) {
        existing.count += 1;
      } else {
        counts.set(a.service_id, { service: a.service, count: 1 });
      }
    }

    return Array.from(counts.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, limit)
      .map((x) => ({ ...x.service, price: Number(x.service.price), count: x.count }));
  }

  private async getActiveServices() {
    return prisma.services.findMany({
      where: { status: 'active', deleted_at: null },
      select: { id: true, name: true, description: true, price: true, duration_minutes: true, category: true },
      orderBy: { name: 'asc' },
    });
  }

  private formatServiceLine(s: any): string {
    return `- ${s.name}: ${this.formatPrice(s.price)} (${s.duration_minutes} min)`;
  }

  private formatPrice(price: any): string {
    const n = Number(price);
    if (!n || Number.isNaN(n)) return 'Free';
    return `₱${n.toLocaleString()}`;
  }

  /** Group a service list by category with readable headers. */
  /** Group a service list by category with readable headers. */
  private formatServicesByCategory(services: any[], capPerCategory = 4): string {
    const byCat = new Map<string, any[]>();
    for (const s of services) {
      const key = (s.category || 'other').replace(/_/g, ' ');
      if (!byCat.has(key)) byCat.set(key, []);
      byCat.get(key)!.push(s);
    }
    return [...byCat.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([cat, list]) => {
        const header = `[${cat.charAt(0).toUpperCase()}${cat.slice(1)}]`;
        const shown = list.slice(0, capPerCategory).map((s) => this.formatServiceLine(s)).join('\n');
        const more = list.length > capPerCategory ? `\n… and ${list.length - capPerCategory} more — tell me which interests you.` : '';
        return `${header}\n${shown}${more}`;
      })
      .join('\n');
  }

  /** Returns the category name if one is mentioned in the message, else undefined. */
  private mentionedCategory(lowerMessage: string, services: Array<{ category: string }>): string | undefined {
    return services
      .map((s) => s.category)
      .filter((cat) => cat.length >= 3)
      .find((cat) => lowerMessage.includes(cat.toLowerCase().replace(/_/g, ' ')));
  }

  /** True when the request already pinpoints a concern, category, service, or direct need (no probing needed). */
  private hasSpecificNeed(lowerMessage: string, services: Array<{ name: string; category: string }>): boolean {
    if (AiService.NEW_CLIENT_TRIGGERS.some((t) => lowerMessage.includes(t))) return true;
    if (this.mentionedCategory(lowerMessage, services)) return true;
    if (this.findServiceByMessage(lowerMessage, services)) return true;
    const msgTokens = this.tokenize(lowerMessage);
    return AiService.SKIN_CONCERNS.some((group) => this.concernHits(lowerMessage, msgTokens, group).length > 0);
  }

  /** One-round clarification probe used before recommending / listing when the request is too vague. */
  private clarifyResponse(kind: 'recommend' | 'services' | 'pricing'): string {
    const categories =
      'We cover facials, laser and skin rejuvenation, hair removal, body treatments, injectables, consultations, and nail/spa care.';
    const concern =
      'Could you tell me your main skin concern or goal — for example acne, dark spots, wrinkles, dryness, or whitening — and whether it is for your face or body?';
    const free =
      'You can also start with our FREE "Free Skin Consultation" — available to new and returning clients — and our professionals will build the right plan for you.';
    switch (kind) {
      case 'recommend':
        return `I would love to recommend the right treatment for you. ${concern}\n\n${free}`;
      case 'pricing':
        return `${categories}\n\nWhich service or category would you like pricing for?`;
      case 'services':
      default:
        return `${categories}\n\n${concern} Or you can just name a category and I will show you its top services.\n\n${free}`;
    }
  }

  private rememberContext(
    sessionId: number | undefined,
    lastServices: string[],
    lastConcern: string | null,
    lastProducts: ProductRecord[] = [],
  ): void {
    if (!sessionId) return;
    this.sessionContext.set(sessionId, { lastServices, lastConcern, lastProducts });
    if (this.sessionContext.size > 300) {
      const oldest = this.sessionContext.keys().next().value;
      if (oldest !== undefined) this.sessionContext.delete(oldest);
    }
  }

  /** Remember a product the customer just asked about, for later pronoun follow-ups. */
  private rememberProducts(sessionId: number | undefined, products: ProductRecord[]): void {
    if (!sessionId || products.length === 0) return;
    const existing = this.sessionContext.get(sessionId);
    this.rememberContext(sessionId, existing?.lastServices ?? [], existing?.lastConcern ?? null, products);
  }

  /** Resolve vague follow-ups ("how much for that?", "tell me more about it") using session context. */
  /**
   * Answer a product question straight from the catalog.
   *
   * This runs before the language model on purpose. Product answers must be
   * reproducible and must never contain anything the database does not hold, and
   * a model asked to describe products from memory will happily invent benefits
   * or ingredients. Returning `null` means the message was not about a product,
   * and the caller carries on as before.
   *
   * @param followUpIntents intents to answer when the customer refers back to a
   *   product already discussed in this session ("how much?" after naming one).
   */
  private async productAnswer(
    sessionId: number | undefined,
    message: string,
    followUpIntents?: ProductIntent[],
    services: Array<{ name: string; category: string }> = [],
  ): Promise<string | null> {
    const query = normalizeQuery(message);
    const lowerMessage = message.toLowerCase();

    // A pronoun follow-up ("how much?", "how do I use it?") refers to whatever
    // product was discussed last, so there is nothing new to match.
    if (followUpIntents && followUpIntents.length > 0) {
      const ctx = sessionId ? this.sessionContext.get(sessionId) : undefined;
      const recent = ctx?.lastProducts ?? [];
      if (recent.length === 0) return null;
      return recent.map((p) => renderProductAnswer(p, followUpIntents)).join('\n\n');
    }

    // Either the user said "product"-ish words, or the sentence is shaped like a
    // lookup of a specific item. Both must be attempted so a miss can be reported
    // honestly instead of being handed to the model.
    const productShaped = mentionsProduct(query) || looksLikeProductLookup(query);

    // A question can also be product-shaped yet be excluded by an operational
    // word that only appears inside a real product name ("Acne Treatment
    // Cream"). Attempt those too, but only trust an exact, verbatim name match
    // so genuine operational questions are not swallowed.
    if (!productShaped && !isThingLookupShape(query)) return null;

    const products = await loadRetailProducts();
    const match = matchProducts(products, query);

    if (!productShaped) {
      const namesExactProduct =
        match.kind === 'single' && query.lower.includes(match.product.name.toLowerCase());
      if (!namesExactProduct) return null;
    }

    if (match.kind === 'none') {
      // A message can ask the other way round: name a service and ask which
      // product goes with it. Answer from the stored service/product links.
      const relatedReply = await this.relatedProductsForService(message, services);
      if (relatedReply) return relatedReply;

      // If the user named a service we do offer, this is a service question and
      // must continue down the normal path.
      if (services.length > 0 && this.findServiceByMessage(lowerMessage, services)) return null;

      // The message asked about something the clinic sells but nothing matched.
      // Answering "we do not carry that" is required here: falling through would
      // let the model invent details about a product that does not exist.
      // A request to see the catalog as a whole is answered with the catalog, not
      // with "we do not have that".
      if (isCatalogBrowseQuery(query)) return renderCatalogReply(products);

      return renderNoMatchReply();
    }

    if (match.kind === 'ambiguous') {
      this.rememberProducts(sessionId, match.products);
      return renderAmbiguousReply(match.products);
    }

    this.rememberProducts(sessionId, [match.product]);

    const answer = renderProductAnswer(match.product, detectIntents(query));

    // A message can be about a product and a service at once ("what product goes
    // with X?", "how much is the treatment and the recommended product?"). When a
    // service is also named, answer about that too rather than dropping it.
    return answer;
  }

  /**
   * "What product goes with <service>?" — answered from the service/product
   * links stored in the database. Returns null when the message is not asking
   * about a product in relation to a named service.
   */
  private async relatedProductsForService(
    message: string,
    services: Array<{ name: string; category: string }>,
  ): Promise<string | null> {
    const lower = message.toLowerCase();
    if (!/\bproduct(s)?\b|\bwhat.*(use|with)\b|\bwhich.*(use|with)\b/.test(lower)) return null;
    if (services.length === 0) return null;

    const hit = this.findServiceByMessage(lower, services);
    if (!hit) return null;

    const products = await loadRetailProducts();
    const related = productsForService(products, hit.service.name);
    if (related.length === 0) return null;

    this.rememberProducts(undefined, related);
    return renderRelatedProductsReply(hit.service.name, related);
  }

  /** Intent set for a bare follow-up, or null when the message is not one. */
  private followUpProductIntents(lowerMessage: string): ProductIntent[] | null {
    const intentText = lowerMessage
      .replace(/\b(it|that|this|they|them|those|the product|product)\b/g, ' ')
      .trim();
    if (!intentText || !/\?|\b(how|what|price|cost|use|used|stock|available|benefit|ingredient|purpose|tell|more)\b/.test(intentText)) {
      return null;
    }

    // Only a message that refers back to the previous product is a follow-up.
    // A question naming something new must be matched against the catalog,
    // otherwise it gets answered about whatever was mentioned previously.
    if (!isReferentialProductFollowUp(normalizeQuery(lowerMessage))) return null;

    const intents = detectIntents(lowerMessage).filter((i) => i !== 'overview');
    return intents.length > 0 ? intents : ['overview'];
  }

  private followUpResponse(sessionId: number | undefined, lowerMessage: string, services: any[]): string | null {
    if (!sessionId) return null;
    const ctx = this.sessionContext.get(sessionId);
    if (!ctx || ctx.lastServices.length === 0) return null;

    const wantsPrice = /\bhow much\b|price|cost|fee|rate|prices/.test(lowerMessage);
    const wantsDetails = /\bmore\b|details|about|that|it\b|tell me|first|second|third|which|info/.test(lowerMessage);
    if (!wantsPrice && !wantsDetails) return null;

    const known = services.filter((s) => ctx.lastServices.includes(s.name));

    if (wantsPrice) {
      const lines =
        known.length > 0
          ? known.map((s) => `- ${s.name}: ${this.formatPrice(s.price)} (${s.duration_minutes} min)`).join('\n')
          : ctx.lastServices.map((n) => `- ${n}`).join('\n');
      return `Here are the prices for what we discussed:\n${lines}\n\nPlease consult with our clinic professionals for personalized advice.`;
    }

    if (known.length === 0) return null;
    return `More on what we discussed:\n\n${known
      .map((s) => `- ${s.name} (${this.formatPrice(s.price)}, ${s.duration_minutes} min): ${s.description ? s.description.trim() : 'Contact us for full details.'}`)
      .join('\n')}\n\nPlease consult with our clinic professionals for personalized advice.`;
  }

  /** Pick 1-2 matching services for a short-topic answer (from the active catalog). */
  private pickTopicServices(needles: string[], services: any[], limit = 2): any[] {
    if (needles.length === 0) return [];
    const scored = services.filter((s) => {
      const name = s.name.toLowerCase();
      return needles.some((n) => name.includes(n));
    });
    const nonArea = scored.filter((s) => !AiService.BODY_AREA_PATTERN.test(s.name.toLowerCase()));
    const pool = nonArea.length > 0 ? nonArea : scored;
    return [...pool].sort((a, b) => a.name.length - b.name.length).slice(0, limit);
  }

  /** Concise answer for a one-word / very short topic question, or null. */
  private shortTopicResponse(lowerMessage: string, services: any[]): string | null {
    const hit = AiService.SHORT_TOPICS.find((t) => t.tokens.some((tok) => lowerMessage.includes(tok)));
    if (!hit) return null;

    const picked = this.pickTopicServices(hit.needles, services);
    const lines =
      picked.length > 0
        ? picked.map((s, i) => `${i + 1}) ${s.name} (${this.formatPrice(s.price)}, ${s.duration_minutes} min)`).join('\n')
        : 'Ask me for the specific options and I\u2019ll help you choose.';

    return `${hit.blurb}\n\n${lines}\n\nPlease consult with our clinic professionals for personalized advice.`;
  }

  private async ruleBasedResponse(message: string, sessionId?: number): Promise<string> {
    const services = await this.getActiveServices();
    const lowerMessage = message.toLowerCase();

    // Greetings / pleasantries first (always on-topic-safe)
    if (this.isGreeting(lowerMessage)) {
      return this.greetingResponse();
    }

    if (this.isThanks(lowerMessage)) {
      return this.thanksResponse();
    }

    // Safety: emergencies are always handled
    if (this.isEmergency(lowerMessage)) {
      return this.emergencyResponse();
    }

    // Same database-driven product answer as the LLM path, so behaviour does not
    // depend on whether a model is configured.
    const productReply = await this.productAnswer(sessionId, message, undefined, services);
    if (productReply) return productReply;

    const productFollowUpIntents = this.followUpProductIntents(lowerMessage);
    if (productFollowUpIntents) {
      const productFollowUp = await this.productAnswer(sessionId, message, productFollowUpIntents, services);
      if (productFollowUp) return productFollowUp;
    }

    // Follow-up referencing a recent recommendation (e.g. "how much for that?")
    const followUp = this.followUpResponse(sessionId, lowerMessage, services);
    if (followUp) return followUp;

    // Strict topic gate: refuse anything not related to the clinic
    if (!(await this.isClinicRelated(lowerMessage, services))) {
      return this.OFF_TOPIC_REPLY;
    }

    // One-word / very short topic questions (e.g. "acne", "nails", "botox") get a concise answer.
    if (this.tokenize(lowerMessage).length <= 2) {
      const short = this.shortTopicResponse(lowerMessage, services);
      if (short) return short;
    }

    // --- Best-selling services ---
    if (
      lowerMessage.includes('best seller') ||
      lowerMessage.includes('best selling') ||
      lowerMessage.includes('best-seller') ||
      lowerMessage.includes('best-selling') ||
      lowerMessage.includes('best selling service') ||
      lowerMessage.includes('bestseller') ||
      lowerMessage.includes('bestsellers') ||
      lowerMessage.includes('popular') ||
      lowerMessage.includes('most requested') ||
      lowerMessage.includes('top service') ||
      lowerMessage.includes('most booked')
    ) {
      const popular = await this.getPopularServices(3);
      if (popular.length === 0) {
        return `We don't have booking data yet. Our most-loved treatments include:\n${services.slice(0, 3).map((s) => this.formatServiceLine(s)).join('\n')}\n\nWant details on any of these? Please consult with our clinic professionals for personalized advice.`;
      }
      const lines = popular.map((s, i) => {
        const desc = s.description ? ` — ${s.description.trim()}` : '';
        return `${i + 1}. ${s.name} (${s.duration_minutes} min, ${this.formatPrice(s.price)})${desc}`;
      });
      return `Our best-selling treatments:\n\n${lines.join('\n')}\n\nWant more details on any? Please consult with our clinic professionals for personalized advice.`;
    }

    // --- Free consultation nudge ---
    if (AiService.NEW_CLIENT_TRIGGERS.some((t) => lowerMessage.includes(t))) {
      return `Our FREE "Free Skin Consultation" is a great way to start — whether you're a first-time visitor or a returning client. Our professionals will assess your skin and build a personalized treatment plan before you commit to any service.\n\nWould you like to see our best-selling treatments or how the free consultation works?\n\nPlease consult with our clinic professionals for personalized advice.`;
    }

    // --- Recommendations (NLP retrieval engine) ---
    const recommendTriggers = [
      'recommend', 'recommendation', 'suggest', 'which service', 'which treatment',
      'what should i', 'what to get', 'whats good', "what's good", 'what is good',
      'whats good for', "what's good for", 'what is good for', 'what can i get',
      'any recommendation', 'any treatment for', 'best for', 'good for me',
      'treatment for', 'i want', 'i need', 'i have',
    ];
    const pineBlockWords = ['movie', 'show', 'food', 'restaurant', 'dishes'];
    const isRecommendation =
      recommendTriggers.some((t) => lowerMessage.includes(t)) &&
      !pineBlockWords.some((w) => lowerMessage.includes(w));

    if (isRecommendation) {
      if (!this.hasSpecificNeed(lowerMessage, services)) {
        return this.clarifyResponse('recommend');
      }
      const recommended = this.recommend(lowerMessage, services);
      if (recommended.length === 0) {
        return `Based on what we offer, I'd recommend booking our FREE "Free Skin Consultation" — open to every client — so our professionals can create a personalized plan for you.\n\nPlease consult with our clinic professionals for personalized advice.`;
      }
      this.rememberContext(sessionId, recommended.slice(0, 3).map((r) => r.service.name), 'recommendations');
      return `Here are my top recommendations for you:\n\n${recommended
        .slice(0, 3)
        .map((r) => `- ${r.service.name} (${this.formatPrice(r.service.price)}, ${r.service.duration_minutes} min) ${r.reasons[0] ? `— ${r.reasons[0]}` : ''}`)
        .join('\n')}\n\nWant details on any of these? Please consult with our clinic professionals for personalized advice.`;
    }

    // --- Clinic hours ---
    if (lowerMessage.includes('hour') || lowerMessage.includes('open') || lowerMessage.includes('close') || lowerMessage.includes('time')) {
      const settings = await prisma.system_settings.findUnique({
        where: { setting_key: 'clinic_hours' },
      });
      const hours = settings?.setting_value?.replace(/"/g, '') || 'Monday-Saturday: 9:00 AM - 6:00 PM, Sunday: Closed';
      return `Our clinic hours are:\n${hours}\n\nPlease consult with our clinic professionals for personalized advice.`;
    }

    // --- Booking / appointments: informational only, no booking walkthrough ---
    if (lowerMessage.includes('book') || lowerMessage.includes('appointment') || lowerMessage.includes('schedule') || lowerMessage.includes('reserve')) {
      return `Appointments are made through the website's booking page or by contacting the clinic directly. I can help with questions about our services, pricing, hours, and recommendations — what would you like to know?\n\nPlease consult with our clinic professionals for personalized advice.`;
    }

    // --- Skin-concern queries beat generic area/long-name matches (e.g. "acne on my face") ---
    const concernTokens = this.tokenize(lowerMessage);
    const concernGroups = AiService.SKIN_CONCERNS.filter((g) => this.concernHits(lowerMessage, concernTokens, g).length > 0);
    if (concernGroups.length > 0) {
      const preNameHit = services.find((s) => {
        const name = s.name.toLowerCase();
        return name.length >= 4 && lowerMessage.includes(name);
      });
      const fuzzyPre = this.findServiceByMessage(lowerMessage, services);
      const namePre = preNameHit || (fuzzyPre ? fuzzyPre.service : undefined);
      const areaMatch = namePre && AiService.BODY_AREA_PATTERN.test(namePre.name.toLowerCase());
      const nameContainsConcern =
        namePre &&
        concernGroups.some((g) =>
          [...g.tokens, ...g.phrases].some((t) => t.length >= 3 && namePre.name.toLowerCase().includes(t))
        );
      if (!namePre || areaMatch || !nameContainsConcern) {
        const recommended = this.recommend(lowerMessage, services);
        if (recommended.length > 0) {
          this.rememberContext(sessionId, recommended.slice(0, 3).map((r) => r.service.name), concernGroups.map((g) => g.label).join(', '));
          return `For ${concernGroups.map((g) => g.label).join(', ')}, here are my top picks:\n\n${recommended
            .slice(0, 3)
            .map((r) => `- ${r.service.name} (${this.formatPrice(r.service.price)}, ${r.service.duration_minutes} min) ${r.reasons[0] ? `— ${r.reasons[0]}` : ''}`)
            .join('\n')}\n\nWant details on any of these? Please consult with our clinic professionals for personalized advice.`;
        }
      }
    }

    // --- Service details (exact or fuzzy name match) ---
    const directHit = services.find((s) => {
      const name = s.name.toLowerCase();
      return name.length >= 4 && lowerMessage.includes(name);
    });
    const fuzzyHit = this.findServiceByMessage(lowerMessage, services);
    const nameHit = directHit || (fuzzyHit ? fuzzyHit.service : undefined);
    if (nameHit) {
      return `${nameHit.name}:\n- Price: ${this.formatPrice(nameHit.price)}\n- Duration: ${nameHit.duration_minutes} minutes\n- Category: ${nameHit.category}\n${nameHit.description ? `- About: ${nameHit.description.trim()}\n` : ''}\nPlease consult with our clinic professionals for personalized advice.`;
    }

    // --- Prices ---
    if (lowerMessage.includes('price') || lowerMessage.includes('cost') || lowerMessage.includes('how much') || lowerMessage.includes('fee') || lowerMessage.includes('rate')) {
      if (services.length === 0) {
        return "Please contact the clinic directly for pricing information.\n\nPlease consult with our clinic professionals for personalized advice.";
      }
      const priceSvc = this.findServiceByMessage(lowerMessage, services);
      if (priceSvc) {
        return `The price for ${priceSvc.service.name} is ${this.formatPrice(priceSvc.service.price)} (${priceSvc.service.duration_minutes} min).\n\nPlease consult with our clinic professionals for personalized advice.`;
      }
      const category = this.mentionedCategory(lowerMessage, services);
      if (category) {
        const filtered = services.filter((s) => s.category === category);
        if (filtered.length === 0) {
          return `I don't have pricing information for that yet. Please contact the clinic directly.\n\nPlease consult with our clinic professionals for personalized advice.`;
        }
        return `Here's pricing for ${category} services:\n${this.formatServicesByCategory(filtered)}\n\nPlease consult with our clinic professionals for personalized advice.`;
      }
      return this.clarifyResponse('pricing');
    }

    // --- Contact / location ---
    if (lowerMessage.includes('contact') || lowerMessage.includes('phone') || lowerMessage.includes('address') || lowerMessage.includes('location') || lowerMessage.includes('where') || lowerMessage.includes('located') || lowerMessage.includes('reach')) {
      const settings = await prisma.system_settings.findMany({
        where: { setting_key: { in: ['clinic_phone', 'clinic_address'] } },
      });
      const settingsMap = new Map(settings.map((s) => [s.setting_key, s.setting_value]));
      const phone = settingsMap.get('clinic_phone')?.replace(/"/g, '') || 'Please contact the clinic for phone number';
      const address = settingsMap.get('clinic_address')?.replace(/"/g, '') || 'Please contact the clinic for address';
      return `Contact Information:\nPhone: ${phone}\nAddress: ${address}\n\nPlease consult with our clinic professionals for personalized advice.`;
    }

    // --- General services list ---
    if (lowerMessage.includes('service') || lowerMessage.includes('offer') || lowerMessage.includes('treatment') || lowerMessage.includes('menu') || lowerMessage.includes('what do you have')) {
      if (services.length === 0) {
        return "Please contact the clinic directly to learn about our services.\n\nPlease consult with our clinic professionals for personalized advice.";
      }
      const category = this.mentionedCategory(lowerMessage, services);
      if (category) {
        const filtered = services.filter((s) => s.category === category);
        if (filtered.length === 0) {
          return `We currently don't offer that service. Please contact the clinic directly to learn more.\n\nPlease consult with our clinic professionals for personalized advice.`;
        }
        return `Here are our ${category} services:\n${this.formatServicesByCategory(filtered)}\n\nPlease consult with our clinic professionals for personalized advice.`;
      }
      if (this.hasSpecificNeed(lowerMessage, services)) {
        const recommended = this.recommend(lowerMessage, services);
        if (recommended.length > 0) {
          this.rememberContext(sessionId, recommended.slice(0, 3).map((r) => r.service.name), 'recommendations');
          return `Based on what you described, here are my top picks:\n\n${recommended
            .slice(0, 3)
            .map((r) => `- ${r.service.name} (${this.formatPrice(r.service.price)}, ${r.service.duration_minutes} min) ${r.reasons[0] ? `— ${r.reasons[0]}` : ''}`)
            .join('\n')}\n\nWant details on any of these? Please consult with our clinic professionals for personalized advice.`;
        }
      }
      return this.clarifyResponse('services');
    }

    return this.HELP_REPLY;
  }
}

export const aiService = new AiService();