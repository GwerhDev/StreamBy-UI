import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DeliverableTab } from './DeliverableTab';
import * as deliverables from '../../../services/deliverables';
import * as storage from '../../../services/storage';
import * as permissions from '../../../services/permissions';
import { Deliverable, StorageFile } from '../../../interfaces';

const deliverable = (over: Partial<Deliverable> = {}): Deliverable => ({
  id: 'd1', projectId: 'p1', assetId: 'a1', versionId: null, shotId: null, exportId: 'e1', note: null, createdBy: 'u1',
  createdAt: '', asset: { displayName: 'trailer.mp4', category: 'videos', contentType: 'video/mp4' }, version: null,
  shotName: null, exportName: 'trailer', ...over,
});
const poster = { id: 'a2', displayName: 'poster.png', category: 'images', url: 'https://cdn.test/poster.png', size: 10 } as unknown as StorageFile;

const renderTab = (role = 'admin') => {
  const store = configureStore({
    reducer: {
      session: () => ({ logged: true, loader: false, username: 'ada', userId: 'u1' }),
      currentProject: () => ({ data: { id: 'p1', members: [{ userId: 'u1', role, status: 'active' }] }, loading: false, error: null }),
      apiResponses: (state = { responses: [] as { message: string }[] }, action: { type: string; payload?: { message: string } }) =>
        (action.type === 'apiResponses/addApiResponse' ? { responses: [...state.responses, action.payload!] } : state),
    },
  });
  render(<Provider store={store}><DeliverableTab projectId="p1" exportId="e1" /></Provider>);
  return store;
};

beforeEach(() => vi.restoreAllMocks());

describe('DeliverableTab', () => {
  it("lists the export's deliverables", async () => {
    const list = vi.spyOn(deliverables, 'getDeliverables').mockResolvedValue([deliverable()]);
    renderTab();
    expect(await screen.findByText('trailer.mp4')).toBeInTheDocument();
    expect(list).toHaveBeenCalledWith('p1', { exportId: 'e1' });
  });

  it('adds the assets picked as deliverables of the export, and shows what blocks them', async () => {
    const list = vi.spyOn(deliverables, 'getDeliverables').mockResolvedValueOnce([]);
    vi.spyOn(storage, 'getStorageFiles').mockResolvedValue([poster]);
    const blocked = deliverable({
      id: 'd2', assetId: 'a2', asset: { displayName: 'poster.png', category: 'images', contentType: 'image/png' },
      status: 'blocked', gated: true, blockedBy: [{ nodeId: 'gate', type: 'reviewGateNode', label: 'Art review', reason: 'Waiting for approvals: 0 of 1' }],
    });
    const mark = vi.spyOn(deliverables, 'markDeliverable').mockResolvedValue({ deliverable: blocked, jobs: [] });
    const store = renderTab();
    const user = userEvent.setup();

    expect(await screen.findByText('Nothing delivered yet.')).toBeInTheDocument();
    list.mockResolvedValue([blocked]);
    await user.click(screen.getByRole('button', { name: /Add deliverable/ }));
    expect(screen.getByText('Add deliverables')).toBeInTheDocument();
    await user.click(await screen.findByTitle('poster.png'));
    await user.click(screen.getByRole('button', { name: 'Add (1)' }));

    await waitFor(() => expect(mark).toHaveBeenCalledWith('p1', 'a2', { exportId: 'e1' }));
    const row = await screen.findByTestId('deliverable-d2');
    expect(row).toHaveTextContent('Blocked');
    expect(row).toHaveTextContent('Art review: Waiting for approvals: 0 of 1');
    expect(screen.queryByText('Add deliverables')).not.toBeInTheDocument();
    expect(store.getState().apiResponses.responses.at(-1)?.message).toBe('1 deliverable added (1 blocked by the gates before it).');
  });

  it('says which asset it could not add', async () => {
    vi.spyOn(deliverables, 'getDeliverables').mockResolvedValue([]);
    vi.spyOn(storage, 'getStorageFiles').mockResolvedValue([poster]);
    vi.spyOn(deliverables, 'markDeliverable').mockRejectedValue(new Error('Asset not found'));
    const store = renderTab();
    const user = userEvent.setup();
    await user.click(await screen.findByRole('button', { name: /Add deliverable/ }));
    await user.click(await screen.findByTitle('poster.png'));
    await user.click(screen.getByRole('button', { name: 'Add (1)' }));
    await waitFor(() => expect(store.getState().apiResponses.responses.at(-1)?.message).toBe('poster.png: Asset not found'));
  });

  it("doesn't offer adding to who can't write the project's assets", async () => {
    vi.spyOn(deliverables, 'getDeliverables').mockResolvedValue([deliverable()]);
    vi.spyOn(permissions, 'getProjectPermissions').mockResolvedValue({ permissions: { roles: { 'assets:write': 'admin' } } } as never);
    renderTab('editor');
    expect(await screen.findByText('trailer.mp4')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Add deliverable/ })).not.toBeInTheDocument();
  });

  it('offers it to an editor when the project lets editors write assets', async () => {
    vi.spyOn(deliverables, 'getDeliverables').mockResolvedValue([]);
    vi.spyOn(permissions, 'getProjectPermissions').mockResolvedValue({ permissions: { roles: { 'assets:write': 'editor' } } } as never);
    renderTab('editor');
    expect(await screen.findByRole('button', { name: /Add deliverable/ })).toBeInTheDocument();
  });
});
