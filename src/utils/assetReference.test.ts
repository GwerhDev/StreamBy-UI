import { describe, expect, it } from 'vitest';
import { assetReference } from './assetReference';

describe('assetReference', () => {
  it("refers to an asset by its id, as StreamBy resolves it when answering an export", () => {
    expect(assetReference('3f2a')).toBe('streamby://asset/3f2a');
  });
});
