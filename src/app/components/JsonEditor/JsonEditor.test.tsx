import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { JsonEditor } from './JsonEditor';
import * as storage from '../../../services/storage';
import { StorageFile } from '../../../interfaces';

describe('JsonEditor', () => {
  it('renders without crashing', () => {
    // TODO: implement
  });

  it('renders with required props', () => {
    // TODO: implement
  });

  it('handles user interaction', async () => {
    // TODO: implement
  });

  it('shows loading state', () => {
    // TODO: implement
  });

  it('shows empty/disabled state', () => {
    // TODO: implement
  });
});

describe('JsonEditor — inserting assets', () => {
  const file = (id: string, name: string) => ({
    id, displayName: name, category: 'images', size: 10,
    url: `https://streamby.s3.sa-east-1.amazonaws.com/p1/images/${id}.png?X-Amz-Signature=x`,
  }) as unknown as StorageFile;

  const insert = async (names: string[]) => {
    vi.spyOn(storage, 'getStorageFiles').mockResolvedValue([file('a1', 'logo.png'), file('a2', 'hero.png')]);
    const onChange = vi.fn();
    render(<JsonEditor value="" onChange={onChange} projectId="p1" />);
    const user = userEvent.setup();
    await user.click(screen.getByTitle(/Insert a reference to an asset/));
    for (const name of names) await user.click(await screen.findByTitle(name));
    await user.click(screen.getByRole('button', { name: new RegExp(`^Insert \\(${names.length}\\)$`) }));
    await waitFor(() => expect(onChange).toHaveBeenCalled());
    return onChange.mock.calls.at(-1)![0] as string;
  };

  it("inserts a reference StreamBy resolves, never the bucket's URL", async () => {
    const inserted = await insert(['logo.png']);
    expect(inserted).toBe('"streamby://asset/a1"');
    expect(inserted).not.toContain('amazonaws');
  });

  it('inserts several as a list of references', async () => {
    expect(JSON.parse(await insert(['logo.png', 'hero.png']))).toEqual(['streamby://asset/a1', 'streamby://asset/a2']);
  });
});
