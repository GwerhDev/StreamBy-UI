import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import { createRef } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NodeViewer, NodeViewerHandle } from './NodeViewer';
import * as teams from '../../../services/teams';
import * as workers from '../../../services/workers';
import * as exportsService from '../../../services/exports';
import { Export } from '../../../interfaces';
import { renderAt } from '../../../test/documents';

// A pipeline's steps in its canvas: who completes each one, and the worker of a process step.
const pipeline = (nodes: object[]) => ({ id: 'pl1', name: 'Props', nodeSchema: { nodes, edges: [] } }) as unknown as Export;
const NODES = [
  { id: 'model', type: 'tasksNode', position: { x: 0, y: 0 }, data: { label: 'Modeling', subtitle: 'Done by people' } },
  { id: 'lod', type: 'lodNode', position: { x: 300, y: 0 }, data: { label: 'LODs', subtitle: 'Generate LOD levels' } },
  { id: 'deliver', type: 'deliverableNode', position: { x: 600, y: 0 }, data: { label: 'Game build', subtitle: 'Package artifact' } },
];
const dataOf = (ref: React.RefObject<NodeViewerHandle | null>, id: string) => ref.current!.getSchema().nodes.find(n => n.id === id)!.data;

beforeEach(() => {
  vi.restoreAllMocks();
  globalThis.ResizeObserver ??= class { observe() {} unobserve() {} disconnect() {} } as unknown as typeof ResizeObserver;
  vi.spyOn(teams, 'getTeams').mockResolvedValue([{ id: 'tm1', name: 'Artists', members: [], createdAt: '', updatedAt: '' }]);
  vi.spyOn(exportsService, 'getProjectReviews').mockResolvedValue([]);
  vi.spyOn(workers, 'getWorkers').mockResolvedValue([
    { source: 'builtin', id: 'blender', name: 'Blender LOD', provider: '', kinds: ['lod'], categories: ['3d-models'], autoKind: null, description: null, hasCredential: false, createdBy: null },
  ]);
});

describe("a pipeline's steps", () => {
  it('a Tasks step is given who completes it, its node then saying so', async () => {
    const ref = createRef<NodeViewerHandle>();
    renderAt('/project/p1/pipelines/pl1', '/project/:id/pipelines/:pipelineId', <NodeViewer ref={ref} context="pipeline" editMode exportDetails={pipeline(NODES)} projectId="p1" />);
    fireEvent.click(await screen.findByText('Modeling'));
    const panel = await screen.findByTestId('pipeline-step-panel');
    fireEvent.click(await within(panel).findByLabelText('Artists', { selector: 'input' }));
    await waitFor(() => expect(dataOf(ref, 'model')).toMatchObject({ teamIds: ['tm1'], subtitle: 'Artists' }));
  });

  it("a process step is set to one of the project's workers", async () => {
    const ref = createRef<NodeViewerHandle>();
    renderAt('/project/p1/pipelines/pl1', '/project/:id/pipelines/:pipelineId', <NodeViewer ref={ref} context="pipeline" editMode exportDetails={pipeline(NODES)} projectId="p1" />);
    fireEvent.click(await screen.findByText('LODs'));
    const panel = await screen.findByTestId('pipeline-step-panel');
    await waitFor(() => expect(workers.getWorkers).toHaveBeenCalledWith('p1'));
    fireEvent.click(within(panel).getByRole('button', { name: 'None: it passes' }));
    fireEvent.mouseDown(await screen.findByText('Blender LOD', { selector: 'li' }));
    await waitFor(() => expect(dataOf(ref, 'lod')).toMatchObject({ worker: { source: 'builtin', id: 'blender', name: 'Blender LOD' }, kind: 'lod', subtitle: 'Worker: Blender LOD' }));
  });

  it("a Deliverable doesn't show the workflow's gates in a pipeline", async () => {
    renderAt('/project/p1/pipelines/pl1', '/project/:id/pipelines/:pipelineId', <NodeViewer context="pipeline" editMode exportDetails={pipeline(NODES)} projectId="p1" />);
    fireEvent.click(await screen.findByText('Game build'));
    expect(await screen.findByTestId('pipeline-step-panel')).toBeInTheDocument();
    expect(screen.queryByText('Applies to', { selector: 'span' })).not.toBeInTheDocument();
    expect(screen.getByText('Delivered for')).toBeInTheDocument();
  });

  it("isn't a step's panel in the workflow", async () => {
    renderAt('/project/p1/workflow', '/project/:id/workflow', <NodeViewer context="workflow" editMode exportDetails={pipeline(NODES)} projectId="p1" />);
    fireEvent.click(await screen.findByText('Game build'));
    await screen.findByText('Applies to', { selector: 'span' });
    expect(screen.queryByTestId('pipeline-step-panel')).not.toBeInTheDocument();
  });
});
