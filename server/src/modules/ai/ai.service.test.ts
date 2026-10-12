import { describe, it, expect, vi, beforeEach } from 'vitest';

const {
  findUnique,
  createSession,
  createMessage,
  servicesFindMany,
  productsFindMany,
} = vi.hoisted(() => ({
  findUnique: vi.fn(),
  createSession: vi.fn(),
  createMessage: vi.fn(),
  servicesFindMany: vi.fn(),
  productsFindMany: vi.fn(),
}));

vi.mock('../../config/database', () => ({
  default: {
    chat_sessions: { findUnique, create: createSession },
    chat_messages: { create: createMessage },
    services: { findMany: servicesFindMany },
    products: { findMany: productsFindMany },
    system_settings: { findUnique: vi.fn(), findMany: vi.fn().mockResolvedValue([]) },
    appointments: { findMany: vi.fn().mockResolvedValue([]) },
  },
}));

// Force the deterministic engine so tests never attempt a real model call.
vi.mock('../../config/env', () => ({
  env: { AI_API_KEY: '', AI_MODEL: 'gpt-3.5-turbo', AI_BASE_URL: undefined },
}));

import { aiService } from './ai.service';

const CATALOG = [
  { id: 1, name: '10 in 1 HydraFacial', description: 'Deep clean', price: 1500, duration_minutes: 60, category: 'facial' },
  { id: 2, name: 'Hollywood Carbon Laser Peel (Face)', description: 'Refine pores', price: 2000, duration_minutes: 45, category: 'laser' },
  { id: 3, name: 'Full Legs', description: 'Laser hair removal', price: 3000, duration_minutes: 60, category: 'hair_removal' },
  { id: 4, name: 'Free Skin Consultation', description: 'Consult', price: 0, duration_minutes: 15, category: 'consultation' },
  { id: 5, name: 'Signature Manicure (No polish)', description: 'Nails', price: 400, duration_minutes: 45, category: 'other' },
  { id: 6, name: 'Essential Hand Spa', description: 'Spa', price: 600, duration_minutes: 60, category: 'other' },
  { id: 7, name: 'Lemon Bio-Lipolysis: Body Focus', description: 'Fat', price: 2500, duration_minutes: 45, category: 'injection' },
];

describe('AiService.processMessage error handling', () => {
  beforeEach(() => {
    findUnique.mockReset();
    createSession.mockReset();
    createMessage.mockReset();

    findUnique.mockResolvedValue(null);
    createSession.mockResolvedValue({ id: 1, session_token: 'sess' });
    createMessage.mockResolvedValue({});
    servicesFindMany.mockResolvedValue(CATALOG);
    productsFindMany.mockResolvedValue([]);
  });

  it('answers gracefully instead of throwing when the database fails', async () => {
    createSession.mockRejectedValue(new Error('database is down'));

    const result = await aiService.processMessage({ message: 'what are your hours?' });

    expect(result.response).toContain("I'm sorry, something went wrong");
    expect(typeof result.response).toBe('string');
  });

  it('echoes the incoming session token back when recovering from an error', async () => {
    findUnique.mockRejectedValue(new Error('database is down'));

    const result = await aiService.processMessage({
      message: 'services',
      session_token: 'keep-me',
    });

    expect(result.session_token).toBe('keep-me');
  });
});

describe('AiService concern routing', () => {
  beforeEach(() => {
    findUnique.mockReset();
    createSession.mockReset();
    createMessage.mockReset();
    servicesFindMany.mockReset();
    productsFindMany.mockReset();

    findUnique.mockResolvedValue(null);
    createSession.mockResolvedValue({ id: 1, session_token: 'sess' });
    createMessage.mockResolvedValue({});
    servicesFindMany.mockResolvedValue(CATALOG);
    productsFindMany.mockResolvedValue([]);
  });

  it.each(['pores', 'oily', 'blackheads', 'dry lips', 'fat', 'spa', 'hairy legs'])(
    'answers the concern "%s" instead of reporting a missing product',
    async (message) => {
      const result = await aiService.processMessage({ message });

      expect(result.response).not.toContain('could not find a product');
      expect(result.response).not.toContain('outside what I can help with');
    },
  );

  it.each(['pizza', 'ufo', 'spaghetti recipe', 'the weather today'])(
    'still refuses off-topic chatter "%s"',
    async (message) => {
      const result = await aiService.processMessage({ message });

      expect(result.response).toContain('outside what I can help with');
    },
  );

  it('still answers a real retail product by name', async () => {
    productsFindMany.mockResolvedValue([
      {
        id: 1,
        name: 'Sunscreen SPF50+',
        description: 'Broad spectrum sun protection.',
        purpose: null,
        benefits: null,
        sku: 'SKU-1',
        unit: 'piece',
        unit_price: 500,
        current_stock: 10,
        category: { name: 'Retail Items' },
        service_inventory_items: [],
      },
    ]);

    const result = await aiService.processMessage({ message: 'sunscreen' });

    expect(result.response).toContain('Sunscreen SPF50+');
  });
});
