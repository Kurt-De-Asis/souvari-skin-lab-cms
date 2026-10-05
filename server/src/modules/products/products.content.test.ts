import { describe, it, expect } from 'vitest';
import {
  mergeResearchedContent,
  PRODUCT_CONTENT_KEYS,
  type ProductContentFields,
} from './products.content';

const blank: ProductContentFields = { description: null, purpose: null, benefits: null };

describe('PRODUCT_CONTENT_KEYS', () => {
  it('covers exactly description, purpose and benefits', () => {
    expect(PRODUCT_CONTENT_KEYS).toEqual(['description', 'purpose', 'benefits']);
  });
});

describe('mergeResearchedContent', () => {
  it('fills every empty field from researched content', () => {
    const result = mergeResearchedContent(blank, {
      description: 'A soothing gel.',
      purpose: 'Used to calm the skin.',
      benefits: 'Helps keep skin comfortable.',
    });

    expect(result.updates).toEqual({
      description: 'A soothing gel.',
      purpose: 'Used to calm the skin.',
      benefits: 'Helps keep skin comfortable.',
    });
    expect(result.filled.sort()).toEqual(['benefits', 'description', 'purpose']);
    expect(result.preserved).toEqual([]);
  });

  it('trims researched values before writing', () => {
    const result = mergeResearchedContent(blank, { description: '  spaced out  ' });
    expect(result.updates.description).toBe('spaced out');
  });

  it('preserves fields the clinic has already filled, even if research disagrees', () => {
    const existing: ProductContentFields = {
      description: 'Clinic-approved wording.',
      purpose: null,
      benefits: null,
    };
    const result = mergeResearchedContent(existing, {
      description: 'Researched wording that should lose.',
      purpose: 'Researched purpose.',
      benefits: null,
    });

    expect(result.updates).toEqual({ purpose: 'Researched purpose.' });
    expect(result.preserved).toEqual(['description']);
    expect(result.filled).toEqual(['purpose']);
  });

  it('treats a whitespace-only existing value as empty', () => {
    const result = mergeResearchedContent(
      { description: '   ', purpose: '\n', benefits: null },
      { description: 'Real description.', purpose: null, benefits: null },
    );
    expect(result.updates).toEqual({ description: 'Real description.' });
  });

  it('ignores blank researched values', () => {
    const result = mergeResearchedContent(blank, {
      description: '   ',
      purpose: null,
      benefits: undefined,
    });
    expect(result.updates).toEqual({});
    expect(result.filled).toEqual([]);
  });

  it('is idempotent: applying the updates once leaves nothing to do', () => {
    const researched = {
      description: 'A soothing gel.',
      purpose: 'Used to calm the skin.',
      benefits: 'Helps keep skin comfortable.',
    };

    const first = mergeResearchedContent(blank, researched);
    const applied: ProductContentFields = { ...blank, ...first.updates };
    const second = mergeResearchedContent(applied, researched);

    expect(second.updates).toEqual({});
    expect(second.filled).toEqual([]);
    expect(second.preserved.sort()).toEqual(['benefits', 'description', 'purpose']);
  });
});
