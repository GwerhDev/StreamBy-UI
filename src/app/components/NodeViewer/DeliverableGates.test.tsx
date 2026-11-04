import { fireEvent, screen, waitFor } from '@testing-library/react';
import { act, createRef } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NodeViewer, NodeViewerHandle } from './NodeViewer';
import * as deliverables from '../../../services/deliverables';
import * as exportsService from '../../../services/exports';
import { deliverableGatesEventReceived } from '../../../store/deliverableGatesSlice';
import { DeliverableNodeState, Export } from '../../../interfaces';
import { renderAt } from '../../../test/documents';

// The workflow's Deliverable node shows whether the gates before it let its deliverables out,
// and its panel sets what it applies to; a Review Gate's panel links it to a review session.
const choose = (field: string, option: string) => {
  const row = screen.getByText(field, { selector: 'span' }).parentElement!;
  fireEvent.click(row.querySelector('button')!);
  fireEvent.mouseDown(screen.getByText(option, { selector: 'li' }));
};
const workflow = (nodes: object[]) => ({ id: 'w1', name: 'Workflow', nodeSchema: { nodes, edges: [] } }) as unknown as Export;
const NODES = [
  { id: 'gate', type: 'reviewGateNode', position: { x: 0, y: 0 }, data: { label: 'Art review', subtitle: 'Require approvals' } },
  { id: 'deliver', type: 'deliverableNode', position: { x: 300, y: 0 }, data: { label: 'Release', subtitle: 'Package artifact' } },
];
const state = (over: Partial<DeliverableNodeState>): DeliverableNodeState => ({ status: 'ready', gated: true, blockedBy: [], appliesTo: 'all', exportId: null, ...over });
const BLOCKED = state({ status: 'blocked', blockedBy: [
  { nodeId: 'gate', type: 'reviewGateNode', label: 'Art review', reason: 'Waiting for approvals: 0 of 1' },
  { nodeId: 'sheet', type: 'creditsSheetNode', label: 'Model credits', reason: '1 of 2 assets lack credits' },
] });

beforeEach(() => {
  vi.restoreAllMocks();
  globalThis.ResizeObserver ??= class { observe() {} unobserve() {} disconnect() {} } as unknown as typeof ResizeObserver;
  vi.spyOn(exportsService, 'getProjectReviews').mockResolvedValue([
    { id: 'r1', projectId: 'p1', assetId: 'asset-0000abcd', assetVersionId: 'v1', status: 'open', requiredApprovers: 2, approvals: [], createdAt: '', updatedAt: '' },
  ]);
});

describe('Deliverable node', () => {
  it('shows what holds it, and reads it again when a gate changes', async () => {
    const gates = vi.spyOn(deliverables, 'getDeliverableGates').mockResolvedValueOnce({ deliver: BLOCKED }).mockResolvedValueOnce({ deliver: state({}) });
    const store = renderAt('/project/p1/workflow', '/project/:id/workflow', <NodeViewer context="workflow" exportDetails={workflow(NODES)} projectId="p1" />);
    expect(await screen.findByTestId('deliverable-node-status')).toHaveTextContent('Blocked · Art review +1');
    expect(screen.getByTestId('deliverable-node')).toHaveAttribute('title', 'Blocked: Art review (Waiting for approvals: 0 of 1); Model credits (1 of 2 assets lack credits)');
    expect(gates).toHaveBeenCalledWith('p1');

    act(() => { store.dispatch(deliverableGatesEventReceived()); });
    await waitFor(() => expect(screen.getByTestId('deliverable-node-status')).toHaveTextContent('Ready'));
  });

  it('with no gates before it, shows what it always did', async () => {
    vi.spyOn(deliverables, 'getDeliverableGates').mockResolvedValue({ deliver: state({ gated: false }) });
    renderAt('/project/p1/workflow', '/project/:id/workflow', <NodeViewer context="workflow" exportDetails={workflow(NODES)} projectId="p1" />);
    await waitFor(() => expect(deliverables.getDeliverableGates).toHaveBeenCalled());
    expect(await screen.findByTestId('deliverable-node-status')).toHaveTextContent('Package artifact');
    expect(screen.getByTestId('deliverable-node')).not.toHaveAttribute('title');
  });

  it("sets what it applies to: one export's deliverables, kept as what the server reads", async () => {
    vi.spyOn(deliverables, 'getDeliverableGates').mockResolvedValue({ deliver: BLOCKED });
    const ref = createRef<NodeViewerHandle>();
    renderAt('/project/p1/workflow', '/project/:id/workflow', <NodeViewer ref={ref} context="workflow" editMode exportDetails={workflow(NODES)} projectId="p1" />,
      { exports: [{ id: 'e1', name: 'Site' }] });
    fireEvent.click(await screen.findByTestId('deliverable-node'));
    expect(await screen.findByText('Blocked: Art review (Waiting for approvals: 0 of 1); Model credits (1 of 2 assets lack credits)')).toBeInTheDocument();
    choose('Applies to', "Site's deliverables");
    fireEvent.click(screen.getByRole('button', { name: /Save Changes/ }));
    await waitFor(() => expect(ref.current!.getSchema().nodes.find(n => n.id === 'deliver')!.data).toMatchObject({ appliesTo: 'exports', exportId: 'e1' }));
    expect(ref.current!.getSchema().nodes.find(n => n.id === 'deliver')!.data).not.toHaveProperty('target');

    choose('Applies to', "Shots' deliverables");
    fireEvent.click(screen.getByRole('button', { name: /Save Changes/ }));
    await waitFor(() => expect(ref.current!.getSchema().nodes.find(n => n.id === 'deliver')!.data).toMatchObject({ appliesTo: 'shots', exportId: '' }));
  });
});

describe('Review Gate node', () => {
  it('is linked to one of the review sessions of the project', async () => {
    vi.spyOn(deliverables, 'getDeliverableGates').mockResolvedValue({});
    const ref = createRef<NodeViewerHandle>();
    renderAt('/project/p1/workflow', '/project/:id/workflow', <NodeViewer ref={ref} context="workflow" editMode exportDetails={workflow(NODES)} projectId="p1" />);
    fireEvent.click(await screen.findByText('Art review'));
    await waitFor(() => expect(exportsService.getProjectReviews).toHaveBeenCalledWith('p1'));
    choose('Review session', '0000abcd · 0/2 · open');
    fireEvent.click(screen.getByRole('button', { name: /Save Changes/ }));
    await waitFor(() => expect(ref.current!.getSchema().nodes.find(n => n.id === 'gate')!.data).toMatchObject({ reviewId: 'r1' }));
  });
});
