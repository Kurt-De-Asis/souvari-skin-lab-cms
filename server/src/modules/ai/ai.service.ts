import prisma from '../../config/database';
import { env } from '../../config/env';
import { SendMessageInput } from './ai.validation';
import crypto from 'crypto';

class AiService {
  private systemPrompt = '';

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

  /** Is this message about the clinic / its services? */
  private isClinicRelated(message: string, services: Array<{ name: string; category: string }>): boolean {
    const lower = message.toLowerCase();

    // 1) Strong clinic word alone is enough.
    for (const kw of AiService.STRONG_CLINIC_KEYWORDS) {
      if (lower.includes(kw)) return true;
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

    const addressesClinic = /\byou\b|\byour\b|\byours\b/.test(lower);
    if (addressesClinic) return true;
    if (weakHits.length >= 2) return true;

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
        if (
          !best ||
          candidate.score > best.score ||
          (candidate.score === best.score && candidate.name.length < best.name.length)
        ) {
          best = candidate;
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

    // A) Direct / fuzzy service-name hit gets the strongest priority.
    const svcHit = this.findServiceByMessage(lowerMessage, services);
    if (svcHit) {
      bump(svcHit.service.id, 100, 'This matches exactly what you asked about');
      services
        .filter((s) => s.id !== svcHit.service.id && s.category === svcHit.service.category)
        .slice(0, 2)
        .forEach((s) => bump(s.id, 8, `Popular in the ${svcHit.service.category} category`));
    }

    // B) Concern-group keyword matching across name + description + category.
    const activeGroups: Array<{ group: (typeof AiService.SKIN_CONCERNS)[number]; hits: string[] }> = [];
    for (const group of AiService.SKIN_CONCERNS) {
      const hits = this.concernHits(lowerMessage, msgTokens, group);
      if (hits.length > 0) activeGroups.push({ group, hits });
    }

    for (const { group, hits } of activeGroups) {
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
          if (s.name.toLowerCase().includes(target)) {
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
    if (activeGroups.length === 0 && !svcHit && !category) {
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
      .filter((r) => !(AiService.NAIL_PATTERN.test(r.service.name.toLowerCase()) && r.score < 12))
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);

    return ranked.map((r) => ({ service: r.service, reasons: r.reasons.slice(0, 2) }));
  }

  private readonly OFF_TOPIC_REPLY =
    "I'm here to answer questions about Souvari Skin Lab — our services, pricing, " +
    'clinic hours, location, and appointments. That question is outside what I can help with. ' +
    'If you have any questions about our treatments, pricing, or booking, feel free to ask!';

  private readonly HELP_REPLY =
    "I can help you with:\n" +
    "- Information about our services and treatments\n" +
    "- Service pricing and packages\n" +
    "- Our best-selling and recommended services\n" +
    "- Clinic hours, location, and contact details\n" +
    "- Booking or rescheduling appointments\n\n" +
    "What would you like to know?";

  private greetingResponse(): string {
    return `Hello! Welcome to Souvari Skin Lab. I can help you with:\n- Service information and pricing\n- Best-selling and recommended services\n- Clinic hours and contact details\n- Booking appointments\n\nHow can I assist you today?\n\nPlease consult with our clinic professionals for personalized advice.`;
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

  async buildSystemPrompt(): Promise<string> {
    if (this.systemPrompt) {
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
          `- ${s.name} (${s.category}): ₱${Number(s.price).toLocaleString()} - ${s.duration_minutes} minutes. ${s.description || ''}`
      )
      .join('\n');

    const popularList = popular
      .map((s) => `- ${s.name}: ₱${Number(s.price).toLocaleString()} (${s.duration_minutes} minutes)`)
      .join('\n');

    this.systemPrompt = `You are a helpful AI assistant for ${clinicName}, a beauty and aesthetics clinic.

CLINIC INFORMATION:
- Name: ${clinicName}
- Hours: ${clinicHours}
- Phone: ${clinicPhone}
- Address: ${clinicAddress}

AVAILABLE SERVICES:
${serviceList || 'No services currently listed. Please contact the clinic directly.'}

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
- Focus on booking inquiries, service information, clinic hours, best-selling services, and general beauty/aesthetics questions

STRICT TOPIC RULE:
- You may ONLY answer questions directly related to this clinic, its services, pricing, hours, location, contact details, bookings, and general beauty/aesthetics care provided by this clinic.
- For ANY question that is not about this clinic or its services (for example politics, sports, current events, recipes, programming, or any unrelated topic), respond ONLY with: "${this.OFF_TOPIC_REPLY}"
- Do not engage with, elaborate on, or answer off-topic questions under any circumstances.

You should be friendly, professional, and helpful while staying within these boundaries.`;
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
      } else {
        const services = await this.getActiveServices();
        const related = this.isGreeting(lower) || this.isClinicRelated(lower, services);
        if (!related) {
          botResponse = this.OFF_TOPIC_REPLY;
        } else if (this.isGreeting(lower)) {
          botResponse = this.greetingResponse();
        } else {
          botResponse = await this.llmWithFallback(input.message, session.id);
        }
      }
    } else {
      botResponse = await this.ruleBasedResponse(input.message);
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
      return this.ruleBasedResponse(message);
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
      max_tokens: 500,
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
    return `- ${s.name}: ₱${Number(s.price).toLocaleString()} (${s.duration_minutes} min)`;
  }

  /** Returns the category name if one is mentioned in the message, else undefined. */
  private mentionedCategory(lowerMessage: string, services: Array<{ category: string }>): string | undefined {
    return services
      .map((s) => s.category)
      .filter((cat) => cat.length >= 3)
      .find((cat) => lowerMessage.includes(cat.toLowerCase().replace(/_/g, ' ')));
  }

  private async ruleBasedResponse(message: string): Promise<string> {
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

    // Strict topic gate: refuse anything not related to the clinic
    if (!this.isClinicRelated(lowerMessage, services)) {
      return this.OFF_TOPIC_REPLY;
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
      const popular = await this.getPopularServices(5);
      if (popular.length === 0) {
        return `We don't have booking data available yet, but some of our most loved treatments include:\n${services.slice(0, 5).map((s) => this.formatServiceLine(s)).join('\n')}\n\nPlease consult with our clinic professionals for personalized advice.`;
      }
      const lines = popular.map((s, i) => {
        const desc = s.description ? ` — ${s.description.trim()}` : '';
        return `${i + 1}. ${s.name} (${s.duration_minutes} min, ₱${s.price.toLocaleString()})${desc}`;
      });
      return `Here are our best-selling services based on most-booked treatments:\n\n${lines.join('\n')}\n\nThese are our clients' most trusted treatments. Please consult with our clinic professionals for personalized advice.`;
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
      const recommended = this.recommend(lowerMessage, services);
      if (recommended.length === 0) {
        return `Based on what we offer, I'd recommend booking a free consultation first so our professionals can create a personalized plan for you. We'll match you with the right treatment.\n\nPlease consult with our clinic professionals for personalized advice.`;
      }
      return `I'd be happy to recommend a treatment just for you! Based on your needs, here are my top recommendations:\n\n${recommended
        .map((r) => `- ${r.service.name} (₱${Number(r.service.price).toLocaleString()}, ${r.service.duration_minutes} min) ${r.reasons[0] ? `— ${r.reasons[0]}` : ''}`)
        .join('\n')}\n\nFor the most accurate recommendation, please consult with our clinic professionals for personalized advice.`;
    }

    // --- Clinic hours ---
    if (lowerMessage.includes('hour') || lowerMessage.includes('open') || lowerMessage.includes('close') || lowerMessage.includes('time')) {
      const settings = await prisma.system_settings.findUnique({
        where: { setting_key: 'clinic_hours' },
      });
      const hours = settings?.setting_value?.replace(/"/g, '') || 'Monday-Saturday: 9:00 AM - 6:00 PM, Sunday: Closed';
      return `Our clinic hours are:\n${hours}\n\nPlease consult with our clinic professionals for personalized advice. For appointments, please contact us directly.`;
    }

    // --- Booking ---
    if (lowerMessage.includes('book') || lowerMessage.includes('appointment') || lowerMessage.includes('schedule') || lowerMessage.includes('reserve')) {
      return `To book an appointment, please contact us directly or use our online booking system.\n\nAvailable services:\n${services.map((s) => this.formatServiceLine(s)).join('\n')}\n\nPlease consult with our clinic professionals for personalized advice.`;
    }

    // --- Service details (exact or fuzzy name match) ---
    const directHit = services.find((s) => {
      const name = s.name.toLowerCase();
      return name.length >= 4 && lowerMessage.includes(name);
    });
    const fuzzyHit = this.findServiceByMessage(lowerMessage, services);
    const nameHit = directHit || (fuzzyHit ? fuzzyHit.service : undefined);
    if (nameHit) {
      const price = Number(nameHit.price).toLocaleString();
      return `${nameHit.name}:\n- Price: ₱${price}\n- Duration: ${nameHit.duration_minutes} minutes\n- Category: ${nameHit.category}\n${nameHit.description ? `- About: ${nameHit.description.trim()}\n` : ''}\nPlease consult with our clinic professionals for personalized advice.`;
    }

    // --- Prices ---
    if (lowerMessage.includes('price') || lowerMessage.includes('cost') || lowerMessage.includes('how much') || lowerMessage.includes('fee') || lowerMessage.includes('rate')) {
      if (services.length === 0) {
        return "Please contact the clinic directly for pricing information.\n\nPlease consult with our clinic professionals for personalized advice.";
      }
      const priceSvc = this.findServiceByMessage(lowerMessage, services);
      if (priceSvc) {
        return `The price for ${priceSvc.service.name} is ₱${Number(priceSvc.service.price).toLocaleString()} (${priceSvc.service.duration_minutes} min).\n\nPlease consult with our clinic professionals for personalized advice.`;
      }
      const category = this.mentionedCategory(lowerMessage, services);
      const filtered = category ? services.filter((s) => s.category === category) : services;
      const scope = category ? `${category} services` : 'services';
      if (filtered.length === 0) {
        return `I don't have pricing information for that yet. Please contact the clinic directly.\n\nPlease consult with our clinic professionals for personalized advice.`;
      }
      return `Our ${scope} pricing:\n${filtered.map((s) => this.formatServiceLine(s)).join('\n')}\n\nPlease consult with our clinic professionals for personalized advice.`;
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
      const filtered = category ? services.filter((s) => s.category === category) : services;
      const scope = category ? `${category} services` : 'services';
      if (filtered.length === 0) {
        return `We currently don't offer that service. Please contact the clinic directly to learn more.\n\nPlease consult with our clinic professionals for personalized advice.`;
      }
      return `We offer the following ${scope}:\n${filtered.map((s) => `${this.formatServiceLine(s)} (${s.category})`).join('\n')}\n\nPlease consult with our clinic professionals for personalized advice.`;
    }

    return this.HELP_REPLY;
  }
}

export const aiService = new AiService();