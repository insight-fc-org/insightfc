import { describe, it, expect } from 'vitest';
import { feat_api_very_long_function_name_to_test } from './feat-api-very-long-function-name-to-test';
describe('feat-api-very-long-function-name-to-test', () => {
  it('returns input', () => {
    expect(feat_api_very_long_function_name_to_test(42)).toBe(42);
  });
});
