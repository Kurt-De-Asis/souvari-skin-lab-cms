#!/usr/bin/env node
'use strict';

/**
 * AI coverage audit (dev-only).
 *
 * Runs a large probe corpus through the deterministic assistant engine against
 * the real database and writes a Markdown report of every gap it finds.
 *
 * It calls the internal `ruleBasedResponse` so nothing is persisted: no chat
 * sessions or messages are written. All reads are SELECTs.
 *
 * Usage (from server/):
 *   NODE_ENV=production node scripts/ai-coverage.cjs
 */

require('dotenv').config();
const fs = require('fs');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({ log: ['error'] });
const { aiService } = require('../dist/modules/ai/ai.service');
const C = aiService.constructor;

const OUT = '/tmp/opencode/ai-coverage-report.md';

const STOP = new Set([
  'the', 'a', 'an', 'and', 'or', 'but', 'for', 'to', 'of', 'in', 'on', 'at', 'by', 'with',
  'is', 'are', 'was', 'were', 'be', 'been', 'being', 'do', 'does', 'did', 'you', 'your',
  'our', 'us', 'it', 'its', 'this', 'that', 'these', 'those', 'what', 'which', 'who', 'when',
  'where', 'why', 'how', 'can', 'will', 'would', 'should', 'may', 'must', 'not', 'no', 'yes',
  'please', 'tell', 'about', 'want', 'need', 'have', 'has', 'get', 'got', 'good', 'any',
  'some', 'there', 'here', 'like', 'really', 'much', 'many', 'also', 'just', 'very', 'per',
  'set', 'full', 'half', 'new', 'old', 'up', 'down', 'out', 'off', 'day', 'days', 'week',
  'weeks', 'month', 'months', 'session', 'sessions', 'sess', 'area', 'areas', 'other',
]);

function tokensOf(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length >= 3 && /^[a-z]+$/.test(t) && !STOP.has(t));
}

function classify(resp) {
  if (resp.includes('outside what I can help with')) return 'OFF_TOPIC';
  if (resp.includes("I don't have that specific information")) return 'UNRECOGNIZED';
  if (resp.includes('not able to give medical advice')) return 'MEDICAL';
  if (resp.includes('may be a medical emergency')) return 'EMERGENCY';
  if (resp.includes('could not find a product matching')) return 'PRODUCT_NOMATCH';
  if (resp.includes('do not have a product on file that is linked')) return 'RELATED_NOMATCH';
  if (resp.includes('specific aftercare instructions')) return 'AFTERCARE_GAP';
  if (resp.includes('I found more than one product that matches')) return 'PRODUCT_AMBIGUOUS';
  if (resp.includes('We currently carry these')) return 'PRODUCT_CATALOG';
  if (resp.includes('Availability:') || resp.includes('Related services:')) return 'PRODUCT';
  if (resp.includes('- Price:') || /\n- Price:/.test(resp)) return 'SERVICE_DETAIL';
  return 'ANSWER';
}

const CURATED = [
  // Policies / payment / booking
  ['what payment methods do you accept', 'policy'], ['do you accept gcash', 'policy'],
  ['do you accept credit card', 'policy'], ['can i pay in installments', 'policy'],
  ['is there a deposit', 'policy'], ['can i cancel my appointment', 'policy'],
  ['what is your cancellation policy', 'policy'], ['what is your refund policy', 'policy'],
  ['do you charge for no shows', 'policy'], ['can i reschedule', 'policy'],
  ['do you have a warranty', 'policy'], ['do you guarantee results', 'policy'],
  ['is parking available', 'policy'], ['do you accept walk ins', 'policy'],
  ['do you have gift cards', 'policy'], ['do you have vouchers', 'policy'],
  ['do you offer membership', 'policy'], ['how much is the membership', 'policy'],
  ['do you offer student discounts', 'policy'], ['senior citizen discount', 'policy'],
  ['pwd discount', 'policy'], ['do you accept hmo', 'policy'], ['do you accept insurance', 'policy'],
  ['do you have branches', 'policy'], ['where is your branch', 'policy'],
  ['are you open on sunday', 'policy'], ['are you open on holidays', 'policy'],
  ['what is your email', 'policy'], ['how do i book an appointment', 'policy'],
  ['can i book online', 'policy'], ['do i need an appointment', 'policy'],
  // Treatment specifics
  ['how long does a session take', 'treatment'], ['how many sessions do i need', 'treatment'],
  ['how often should i get a facial', 'treatment'], ['does it hurt', 'treatment'],
  ['is it painful', 'treatment'], ['is there downtime', 'treatment'],
  ['what are the side effects', 'treatment'], ['is it safe', 'treatment'],
  // Facility / staff
  ['do you have a doctor', 'facility'], ['is there a dermatologist', 'facility'],
  ['do you have male therapists', 'facility'], ['is there an age limit', 'facility'],
  ['do you treat men', 'facility'], ['do you have couple rooms', 'facility'],
  ['what should i wear', 'facility'], ['do i need to remove makeup', 'facility'],
  ['can i bring a friend', 'facility'],
  // Offers
  ['do you offer packages', 'offer'], ['do you have promos', 'offer'],
  ['do you offer birthday discounts', 'offer'], ['can i use my voucher', 'offer'],
  // Products
  ['what products do you recommend', 'product'], ['do you sell products', 'product'],
  ['how do i use the sunscreen', 'product'], ['product for acne', 'product'],
  ['product for dry skin', 'product'], ['what is the best facial', 'recommend'],
  ['which service is best for me', 'recommend'], ['what do you recommend for glowing skin', 'recommend'],
  // Concerns phrased naturally
  ['i have sensitive skin', 'concern'], ['i have oily skin', 'concern'],
  ['i want to look younger', 'concern'], ['my skin is dull', 'concern'],
  ['i have dandruff', 'concern'], ['i have a beard', 'concern'], ['i have a tattoo', 'concern'],
  ['i need to remove a mole', 'concern'], ['i have varicose veins', 'concern'],
  // Medical / safety
  ['i have a cold sore', 'medical'], ['i am pregnant', 'medical'],
  ['i take accutane', 'medical'], ['i am allergic to lidocaine', 'medical'],
  ['does the laser cure acne', 'medical'], ['will it remove my scar permanently', 'medical'],
  ['can i get botox', 'medical'],
  // Do-you-do X treatment coverage
  ['do you do dermaplaning', 'do-you'], ['do you do mesotherapy', 'do-you'],
  ['do you do skin boosters', 'do-you'], ['do you do co2 laser', 'do-you'],
  ['do you do fractional laser', 'do-you'], ['do you do microneedling', 'do-you'],
  ['do you do vampire facial', 'do-you'], ['do you do chemical peel', 'do-you'],
  ['do you do diamond peel', 'do-you'], ['do you do hydrafacial', 'do-you'],
  ['do you do carbon laser', 'do-you'], ['do you do pico laser', 'do-you'],
  ['do you do hifu', 'do-you'], ['do you do rf', 'do-you'], ['do you do exosome', 'do-you'],
  ['do you do rejuran', 'do-you'], ['do you do pdrn', 'do-you'], ['do you do thread lift', 'do-you'],
  ['do you do nose thread', 'do-you'], ['do you do eyebrow threading', 'do-you'],
  ['do you do eyelash extensions', 'do-you'], ['do you do lash lift', 'do-you'],
  ['do you do brow lamination', 'do-you'], ['do you do microblading', 'do-you'],
  ['do you do permanent makeup', 'do-you'], ['do you do tattoo removal', 'do-you'],
  ['do you do body whitening', 'do-you'], ['do you do glutathione drip', 'do-you'],
  ['do you do iv drip', 'do-you'], ['do you do slimming', 'do-you'],
  ['do you do liposuction', 'do-you'], ['do you do body contouring', 'do-you'],
  ['do you do hair removal', 'do-you'], ['do you do brazilian wax', 'do-you'],
  ['do you do hot wax', 'do-you'], ['do you do foot spa', 'do-you'],
  ['do you do hand spa', 'do-you'], ['do you do manicure', 'do-you'],
  ['do you do pedicure', 'do-you'], ['do you do gel nails', 'do-you'],
  ['do you do biab', 'do-you'], ['do you do nail extensions', 'do-you'],
  ['do you do gua sha', 'do-you'], ['do you do facial massage', 'do-you'],
  ['do you do body massage', 'do-you'], ['do you do slimming massage', 'do-you'],
  // One-liner treatment/tech words
  ['massage', 'word'], ['sauna', 'word'], ['steam', 'word'], ['dermaplaning', 'word'],
  ['mesotherapy', 'word'], ['skin booster', 'word'], ['co2 laser', 'word'],
  ['fractional laser', 'word'], ['vampire facial', 'word'], ['nose thread', 'word'],
  ['thread lift', 'word'], ['body massage', 'word'], ['facial massage', 'word'],
  ['lymphatic drainage', 'word'], ['acupuncture', 'word'], ['cupping', 'word'],
  ['diode', 'word'], ['titanium', 'word'], ['picosecond', 'word'], ['nanosecond', 'word'],
  ['q-switch', 'word'], ['alexandrite', 'word'], ['ipl', 'word'], ['bb glow', 'word'],
  ['prp', 'word'], ['dermabrasion', 'word'], ['rejuv', 'word'],
  // Policy one-liners
  ['payment', 'word'], ['gcash', 'word'], ['cash', 'word'], ['card', 'word'],
  ['installment', 'word'], ['deposit', 'word'], ['refund', 'word'], ['cancel', 'word'],
  ['cancellation', 'word'], ['reschedule', 'word'], ['noshow', 'word'], ['no show', 'word'],
  ['parking', 'word'], ['walkin', 'word'], ['walk in', 'word'], ['voucher', 'word'],
  ['gift card', 'word'], ['membership', 'word'], ['member', 'word'], ['discount', 'word'],
  ['senior', 'word'], ['pwd', 'word'], ['student', 'word'], ['hmo', 'word'],
  ['insurance', 'word'], ['receipt', 'word'], ['warranty', 'word'], ['guarantee', 'word'],
  ['branch', 'word'], ['branches', 'word'], ['holiday', 'word'], ['age limit', 'word'],
  // Product type words
  ['sunscreen', 'product-word'], ['serum', 'product-word'], ['cream', 'product-word'],
  ['toner', 'product-word'], ['cleanser', 'product-word'], ['moisturizer', 'product-word'],
  ['mask', 'product-word'], ['retinol', 'product-word'], ['aloe', 'product-word'],
];

const CONTROLS = [
  'pizza', 'ufo', 'weather', 'recipe', 'who is the president', 'play music',
  'tell me a joke', 'how to code python', 'capital of france', 'stock market',
  'football score', 'netflix', 'spaghetti recipe', 'the weather today', 'bitcoin',
];

(async () => {
  const [services, categories, products, settings] = await Promise.all([
    prisma.services.findMany({
      where: { status: 'active', deleted_at: null },
      select: { name: true, category: true, description: true, price: true, duration_minutes: true },
    }),
    prisma.service_categories.findMany({ select: { name: true } }).catch(() => []),
    prisma.products.findMany({
      where: { deleted_at: null, status: 'active', is_retail: true, unit_price: { gt: 0 } },
      select: { name: true, is_retail: true },
    }),
    prisma.system_settings.findMany({ select: { setting_key: true, setting_value: true } }),
  ]);

  const shortTopicTokens = new Set();
  for (const t of C.SHORT_TOPICS || []) for (const tok of t.tokens) shortTopicTokens.add(tok);
  const concernTokens = new Set();
  const concernPhrases = new Set();
  for (const g of C.SKIN_CONCERNS || []) {
    for (const tok of g.tokens) concernTokens.add(tok);
    for (const p of g.phrases) concernPhrases.add(p);
  }

  /** text -> Set(tags) */
  const probes = new Map();
  const add = (text, tag) => {
    const key = String(text).trim().toLowerCase();
    if (!key) return;
    if (!probes.has(key)) probes.set(key, new Set());
    probes.get(key).add(tag);
  };

  // Full service names (expect a service detail answer).
  for (const s of services) add(s.name, 'service-name');
  // Distinctive tokens from service names.
  for (const s of services) for (const t of tokensOf(s.name)) add(t, 'service-token');
  // Category enum + table names.
  for (const s of services) for (const t of tokensOf(s.category.replace(/_/g, ' '))) add(t, 'category-token');
  for (const c of categories) for (const t of tokensOf(c.name)) add(t, 'category-token');
  // Retail product names and tokens.
  for (const p of products) add(p.name, 'product-name');
  for (const p of products) for (const t of tokensOf(p.name)) add(t, 'product-token');
  // Vocabulary used by the engine itself.
  for (const t of shortTopicTokens) add(t, 'shorttopic');
  for (const t of concernTokens) add(t, 'concern');
  for (const t of C.OPERATIONAL_KEYWORDS || []) add(t, 'operational');
  for (const t of C.STRONG_CLINIC_KEYWORDS || []) add(t, 'strong');
  // Curated questions / one-liners.
  for (const [text, tag] of CURATED) add(text, tag);
  // Off-topic controls.
  for (const c of CONTROLS) add(c, 'offtopic');

  const rows = [];
  let i = 0;
  const total = probes.size;
  for (const [text, tags] of probes) {
    i += 1;
    if (i % 100 === 0) process.stderr.write(`  ...${i}/${total}\n`);
    let resp;
    try {
      resp = await aiService['ruleBasedResponse'](text);
    } catch (e) {
      resp = 'ERROR ' + e.message;
    }
    rows.push({
      text,
      tags: [...tags],
      kind: classify(resp),
      resp: resp.replace(/\s+/g, ' ').slice(0, 140),
      isServiceName: tags.has('service-name'),
      isSingleWord: text.split(/\s+/).length === 1,
    });
  }

  await prisma.$disconnect();

  // ---- Analysis -----------------------------------------------------------
  const offtopic = rows.filter((r) => r.tags.includes('offtopic'));
  const clinicProbes = rows.filter((r) => !r.tags.includes('offtopic'));

  const falseRefusals = clinicProbes.filter((r) => r.kind === 'OFF_TOPIC');
  const singleWordRefusals = falseRefusals.filter((r) => r.isSingleWord);

  const treatmentTagged = new Set(['shorttopic', 'concern', 'word', 'do-you']);
  const productCapture = clinicProbes.filter(
    (r) => (r.kind === 'PRODUCT' || r.kind === 'PRODUCT_AMBIGUOUS') &&
      (r.isSingleWord || r.tags.some((t) => treatmentTagged.has(t))),
  );

  const gaps = clinicProbes.filter((r) =>
    ['UNRECOGNIZED', 'PRODUCT_NOMATCH', 'RELATED_NOMATCH', 'AFTERCARE_GAP'].includes(r.kind),
  );

  const curatedRows = rows.filter((r) => r.tags.some((t) => ['policy', 'treatment', 'facility', 'offer', 'product', 'recommend', 'concern', 'medical', 'do-you'].includes(t)));

  const serviceNameRows = rows.filter((r) => r.isServiceName);
  const serviceDetailMiss = serviceNameRows.filter((r) => r.kind !== 'SERVICE_DETAIL' && r.kind !== 'PRODUCT');

  const noDesc = services.filter((s) => !s.description || !s.description.trim()).length;

  const controlsRefused = offtopic.filter((r) => r.kind === 'OFF_TOPIC').length;

  const fmt = (r) => `${r.text} — [${r.kind}] ${r.resp}`;
  const list = (arr, cap = 400) => arr.slice(0, cap).map((r) => `- ${fmt(r)}`).join('\n') || '_none_';

  const md = [];
  md.push('# AI assistant coverage audit');
  md.push('');
  md.push(`Generated: ${new Date().toISOString()}`);
  md.push('');
  md.push('## Summary');
  md.push('');
  md.push(`- Probes run: **${rows.length}** (single words: ${rows.filter((r) => r.isSingleWord).length}, multi-word: ${rows.filter((r) => !r.isSingleWord).length})`);
  md.push(`- Active services: **${services.length}** — without a description: **${noDesc}**`);
  md.push(`- Retail products: **${products.length}**`);
  md.push(`- Off-topic controls correctly refused: **${controlsRefused}/${offtopic.length}**`);
  md.push(`- **False refusals** (clinic word/question answered as off-topic): **${falseRefusals.length}**`);
  md.push(`- **Treatment/concern words answered with a product**: **${productCapture.length}**`);
  md.push(`- **On-topic honest gaps** (no stored answer): **${gaps.length}**`);
  md.push(`- Service names that did not return a service detail: **${serviceDetailMiss.length}/${serviceNameRows.length}**`);
  md.push('');
  md.push('## A. False refusals — on-topic but answered "outside what I can help with"');
  md.push('');
  md.push('### A1. Single words');
  md.push(list(singleWordRefusals));
  md.push('');
  md.push('### A2. Phrases / questions');
  md.push(list(falseRefusals.filter((r) => !r.isSingleWord)));
  md.push('');
  md.push('## B. Treatment/concern words captured as a product');
  md.push('');
  md.push(list(productCapture));
  md.push('');
  md.push('## C. On-topic questions with no stored answer (honest gaps)');
  md.push('');
  md.push('### C1. Single words');
  md.push(list(gaps.filter((r) => r.isSingleWord)));
  md.push('');
  md.push('### C2. Phrases / questions');
  md.push(list(gaps.filter((r) => !r.isSingleWord)));
  md.push('');
  md.push('## D. Curated clinic questions (outcome)');
  md.push('');
  const byTag = {};
  for (const r of curatedRows) {
    const t = r.tags.find((x) => ['policy', 'treatment', 'facility', 'offer', 'product', 'recommend', 'concern', 'medical', 'do-you'].includes(x));
    (byTag[t] = byTag[t] || []).push(r);
  }
  for (const [tag, arr] of Object.entries(byTag)) {
    md.push(`### D.${tag} (${arr.length})`);
    md.push(list(arr, 120));
    md.push('');
  }
  md.push('## E. Service-name lookups that did not return a service detail');
  md.push('');
  md.push(list(serviceDetailMiss, 300));
  md.push('');
  md.push('## F. Data inventory gaps');
  md.push('');
  md.push(`- Services without descriptions: **${noDesc}/${services.length}**`);
  const keys = settings.map((s) => s.setting_key);
  const policyKeys = ['payment_methods', 'deposit', 'cancellation_policy', 'refund_policy', 'parking', 'walk_ins', 'gift_cards', 'membership_terms'];
  md.push(`- Settings keys present: ${keys.join(', ')}`);
  md.push(`- Missing policy-like settings: ${policyKeys.filter((k) => !keys.includes(k)).join(', ') || 'none'}`);
  md.push('');
  md.push('## G. All results (machine-readable order)');
  md.push('');
  md.push('```');
  for (const r of rows) md.push(`${r.kind}\t${r.text}\t${r.tags.join(',')}`);
  md.push('```');

  fs.mkdirSync('/tmp/opencode', { recursive: true });
  fs.writeFileSync(OUT, md.join('\n'));
  fs.writeFileSync('/tmp/opencode/ai-coverage.json', JSON.stringify(rows, null, 2));
  console.log(`Wrote ${OUT} (${rows.length} probes)`);
})().catch((e) => {
  console.error('AUDIT FAILED', e);
  process.exit(1);
});
