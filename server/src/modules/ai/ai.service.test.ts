import { describe, it, expect, vi, beforeEach } from 'vitest';

const { findUnique, createSession, createMessage } = vi.hoisted(() => ({
  findUnique: vi.fn(),
  createSession: vi.fn(),
  createMessage: vi.fn(),
}));

vi.mock('../../config/database', () => ({
  default: {
    chat_sessions: { findUnique, create: createSession },
    chat_messages: { create: createMessage },
  },
}));

import { aiService } from './ai.service';

describe('AiService.processMessage error handling', () => {
  beforeEach(() => {
    findUnique.mockReset();
    createSession.mockReset();
    createMessage.mockReset();
  });

  it('answers gracefully instead of throwing when the database fails', async () => {
    findUnique.mockRejectedValue(new Error('database is down'));

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
