import { describe, it, expect } from 'vitest';
import { feat_api_caf_normalize_ensure_non_ascii_ } from './feat-api-caf-normalize-ensure-non-ascii-';
describe('feat-api-caf-normalize-ensure-non-ascii-', () => {
  it('returns input', () => {
    expect(feat_api_caf_normalize_ensure_non_ascii_(42)).toBe(42);
  });
});
