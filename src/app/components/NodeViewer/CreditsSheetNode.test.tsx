import { createRef } from 'react';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NodeViewer, NodeViewerHandle } from './NodeViewer';
import * as documents from '../../../services/documents';
import * as sheets from '../../../services/creditsSheets';
import { Export } from '../../../interfaces';
import { doc, renderAt } from '../../../test/documents';

// The workflow's Credits sheet node: dropping it makes its sheet (a project document), and it
// shows the sheet's status.
const workflow = (nodes: object[] = []) => ({ id: 'w1', name: 'Workflow', nodeSchema: { nodes, edges: [] } }) as unknown as Export;

beforeEach(() => {
  vi.restoreAllMocks();
  globalThis.ResizeObserver ??= class { observe() {} unobserve() {} disconnect() {} } as unknown as typeof ResizeObserver;
});

describe('Credits sheet node', () => {
  it('makes its credits sheet when added, and keeps its id', async () => {
    const create = vi.spyOn(documents, 'createDocument').mockResolvedValue(doc({ id: 'sheet-1', kind: 'credits', title: 'Credits sheet', content: '{"assetIds":[],"folderIds":[]}' }));
    vi.spyOn(sheets, 'getCreditsSheets').mockResolvedValue([{ id: 'sheet-1', title: 'Credits sheet', status: 'incomplete', rows: 0, incomplete: 0 }]);
    const ref = createRef<NodeViewerHandle>();
    renderAt('/project/p1/workflow', '/project/:id/workflow', <NodeViewer ref={ref} context="workflow" editMode exportDetails={workflow()} projectId="p1" />);

    await userEvent.setup().click(screen.getByRole('button', { name: /Credits sheet/ }));
    await waitFor(() => expect(create).toHaveBeenCalledWith('p1', { title: 'Credits sheet', kind: 'credits' }));
    await waitFor(() => expect(ref.current!.getSchema().nodes).toEqual([
      expect.objectContaining({ type: 'creditsSheetNode', data: expect.objectContaining({ documentId: 'sheet-1' }) }),
    ]));
  });

  it("shows its sheet's status", async () => {
    vi.spyOn(sheets, 'getCreditsSheets').mockResolvedValue([{ id: 'sheet-1', title: 'Trailer', status: 'incomplete', rows: 3, incomplete: 1 }]);
    renderAt('/project/p1/workflow', '/project/:id/workflow', (
      <NodeViewer context="workflow" exportDetails={workflow([
        { id: 'n1', type: 'creditsSheetNode', position: { x: 0, y: 0 }, data: { label: 'Trailer credits', subtitle: 'Assets credits table', documentId: 'sheet-1' } },
      ])} projectId="p1" />
    ));
    expect(await screen.findByTestId('credits-sheet-node-status')).toHaveTextContent('Incomplete · 1 of 3');
  });
});
