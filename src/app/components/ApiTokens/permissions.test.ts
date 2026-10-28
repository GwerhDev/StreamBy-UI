import { describe, expect, it } from 'vitest';
import { levelOf, levelPermissions } from './permissions';

describe('token levels', () => {
  // Publishing a document is choosing what its exports deliver: not editing it.
  it('give publishing documents only with admin, as deleting them', () => {
    expect(levelPermissions('edit', 'user')).toContain('docs:write');
    expect(levelPermissions('edit', 'user')).not.toContain('docs:publish');
    expect(levelPermissions('edit', 'user')).not.toContain('docs:delete');
    expect(levelPermissions('admin', 'project')).toEqual(expect.arrayContaining(['docs:publish', 'docs:delete']));
    expect(levelPermissions('read', 'user')).toEqual(expect.arrayContaining(['docs:read']));
  });

  it('call editing plus publishing custom', () => {
    expect(levelOf([...levelPermissions('edit', 'project'), 'docs:publish'], 'project')).toBe('custom');
  });
});
