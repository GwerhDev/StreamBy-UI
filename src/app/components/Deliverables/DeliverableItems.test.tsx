import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DeliverableItems } from './DeliverableItems';
import * as deliverablesService from '../../../services/deliverables';
import { Deliverable } from '../../../interfaces';
import deliverableGates, { deliverableGatesEventReceived } from '../../../store/deliverableGatesSlice';

const deliverable = (over: Partial<Deliverable>): Deliverable => ({
  id: 'd1', projectId: 'p1', assetId: 'a1', versionId: 'v2', shotId: 's1', exportId: null, note: 'Layout pass',
  createdBy: 'u1', createdAt: '2026-10-22T00:00:00Z', asset: { displayName: 'SH010_layout.glb', category: '3d-models', contentType: 'model/gltf-binary' },
  version: 2, shotName: 'SH010', exportName: null, ...over,
});

const renderSection = (of: { shotId: string } | { exportId: string } = { shotId: 's1' }) => {
  const store = configureStore({
    reducer: {
      deliverableGates,
      apiResponses: (state = { responses: [] as unknown[] }, action: { type: string; payload?: unknown }) =>
        (action.type === 'apiResponses/addApiResponse' ? { responses: [...state.responses, action.payload] } : state),
    },
  });
  render(<Provider store={store}><DeliverableItems projectId="p1" of={of} /></Provider>);
  return store;
};

const assign = vi.fn();
beforeEach(() => {
  vi.restoreAllMocks();
  assign.mockReset();
  vi.stubGlobal('location', { ...window.location, assign });
});
afterEach(() => vi.unstubAllGlobals());

describe('DeliverableItems', () => {
  it("lists an export's deliverables", async () => {
    const list = vi.spyOn(deliverablesService, 'getDeliverables').mockResolvedValue([deliverable({ shotId: null, exportId: 'e1' })]);
    renderSection({ exportId: 'e1' });
    expect(await screen.findByTestId('deliverable-d1')).toHaveTextContent('SH010_layout.glb');
    expect(list).toHaveBeenCalledWith('p1', { exportId: 'e1' });
  });

  it("lists the shot's deliverables, with their version and note", async () => {
    const list = vi.spyOn(deliverablesService, 'getDeliverables').mockResolvedValue([
      deliverable({}), deliverable({ id: 'd2', versionId: null, version: null, note: null, asset: { displayName: 'SH010.png', category: 'images', contentType: 'image/png' } }),
    ]);
    renderSection();
    const first = await screen.findByTestId('deliverable-d1');
    expect(list).toHaveBeenCalledWith('p1', { shotId: 's1' });
    expect(first).toHaveTextContent('SH010_layout.glb');
    expect(first).toHaveTextContent('v2');
    expect(first).toHaveTextContent('Layout pass');
    expect(screen.getByTestId('deliverable-d2')).toHaveTextContent('latest');
  });

  it('says when nothing has been delivered', async () => {
    vi.spyOn(deliverablesService, 'getDeliverables').mockResolvedValue([]);
    renderSection();
    expect(await screen.findByText('Nothing delivered yet.')).toBeInTheDocument();
  });

  it('downloads the version delivered', async () => {
    vi.spyOn(deliverablesService, 'getDeliverables').mockResolvedValue([deliverable({})]);
    const url = vi.spyOn(deliverablesService, 'getAssetDownloadUrl').mockResolvedValue('https://storage.test/get/x');
    renderSection();
    await userEvent.setup().click(await screen.findByRole('button', { name: /Download SH010_layout.glb/ }));
    await waitFor(() => expect(assign).toHaveBeenCalledWith('https://storage.test/get/x'));
    expect(url).toHaveBeenCalledWith('p1', 'a1', 'v2');
  });

  it("can't download one whose asset is gone", async () => {
    vi.spyOn(deliverablesService, 'getDeliverables').mockResolvedValue([deliverable({ asset: null })]);
    renderSection();
    expect(await screen.findByText('Deleted asset')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Download/ })).toBeDisabled();
  });

  it('shows whether the gates before each one let it out, and what holds a blocked one', async () => {
    vi.spyOn(deliverablesService, 'getDeliverables').mockResolvedValue([
      deliverable({ status: 'blocked', gated: true, blockedBy: [{ nodeId: 'gate', type: 'reviewGateNode', label: 'Art review', reason: 'Waiting for approvals: 0 of 1' }] }),
      deliverable({ id: 'd2', status: 'ready', gated: true, blockedBy: [] }),
      deliverable({ id: 'd3', status: 'ready', gated: false, blockedBy: [] }),
    ]);
    renderSection();
    const blocked = await screen.findByTestId('deliverable-d1');
    expect(blocked).toHaveTextContent('Blocked');
    expect(blocked).toHaveTextContent('Art review: Waiting for approvals: 0 of 1');
    expect(screen.getByTestId('deliverable-d2')).toHaveTextContent('Ready');
    // One with no gates before it is as it always was.
    expect(screen.getByTestId('deliverable-d3')).not.toHaveTextContent(/Ready|Blocked/);
  });

  it('reads them again when a gate changes, keeping the list meanwhile', async () => {
    const list = vi.spyOn(deliverablesService, 'getDeliverables')
      .mockResolvedValueOnce([deliverable({ status: 'blocked', gated: true, blockedBy: [{ nodeId: 'gate', type: 'reviewGateNode', label: 'Art review', reason: 'Waiting for approvals: 0 of 1' }] })])
      .mockResolvedValueOnce([deliverable({ status: 'ready', gated: true, blockedBy: [] })]);
    const store = renderSection();
    expect(await screen.findByTestId('deliverable-d1')).toHaveTextContent('Blocked');
    act(() => { store.dispatch(deliverableGatesEventReceived()); });
    expect(screen.getByTestId('deliverable-d1')).toBeInTheDocument();
    await waitFor(() => expect(screen.getByTestId('deliverable-d1')).toHaveTextContent('Ready'));
    expect(list).toHaveBeenCalledTimes(2);
  });
});
