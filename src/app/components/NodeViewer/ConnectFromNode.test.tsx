import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { createMemoryRouter, MemoryRouter, Route, RouterProvider, Routes } from 'react-router-dom';
import { act } from '@testing-library/react';
import { Where } from '../../../test/Where';
import { configureStore } from '@reduxjs/toolkit';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as resources from '../../../services/projectResources';
import * as workflowService from '../../../services/workflow';
import currentProject from '../../../store/currentProjectSlice';
import management, { upsertIntegration } from '../../../store/managementSlice';
import documents from '../../../store/documentsSlice';
import creditsSheets from '../../../store/creditsSheetsSlice';
import { DbConnection, Project, Workflow } from '../../../interfaces';
import { WorkflowCanvas } from '../Workflow/WorkflowCanvas';

// Connecting and disconnecting from the workflow: nothing changes in the project until the
// workflow is saved, in one change the server makes (it connects what the nodes were set to,
// and removes what their nodes are gone of). Deleting a resource's node asks first.
const MONGO = { id: 'c-mongo', name: 'MongoDB', dbType: 'mongodb', integrationId: 'mongo', source: 'builtin', isBuiltin: true } as DbConnection;
const PG = { id: 'c-pg', name: 'PostgreSQL', dbType: 'postgresql', integrationId: 'postgres', source: 'builtin', isBuiltin: true } as DbConnection;
const workflow = {
  id: 'w1', name: 'Workflow', nodeSchema: {
    nodes: [
      { id: 'streamby', type: 'orchestratorNode', position: { x: 0, y: 0 }, data: { label: 'StreamBy', subtitle: 'Orchestrator' } },
      { id: 'mongo-node', type: 'dataSourceNode', position: { x: 300, y: -160 }, data: { label: 'MongoDB', subtitle: 'mongodb', connectionId: 'c-mongo' } },
      { id: 'ds1', type: 'dataSourceNode', position: { x: 0, y: 200 }, data: { label: 'Spells source', subtitle: 'DB collection' } },
    ],
    edges: [
      { id: 'e-db', source: 'mongo-node', sourceHandle: 'out-stream', target: 'streamby', targetHandle: 'in-top' },
      { id: 'e1', source: 'ds1', sourceHandle: 'out-stream', target: 'streamby', targetHandle: 'in-top' },
    ],
  },
  updatedAt: '2026-10-28T10:00:00.000Z',
} as unknown as Workflow;

const renderCanvas = (shown: Workflow = workflow) => {
  const store = configureStore({
    reducer: {
      currentProject, management, documents, creditsSheets,
      session: () => ({ logged: true, loader: false, username: 'ada', userId: 'u1', mode: 'developer' }),
      apiResponses: (state = { responses: [] as unknown[] }, action: { type: string; payload?: unknown }) =>
        (action.type === 'apiResponses/addApiResponse' ? { responses: [...state.responses, action.payload] } : state),
    },
  });
  store.dispatch({ type: 'currentProject/setCurrentProject', payload: { id: 'p1', name: 'Test', public: false, dbConnections: [MONGO] } as unknown as Project });
  store.dispatch(upsertIntegration({ id: 'mongo', kind: 'database', name: 'MongoDB', provider: 'nosql', source: 'builtin', available: true }));
  store.dispatch(upsertIntegration({ id: 'postgres', kind: 'database', name: 'PostgreSQL', provider: 'sql', source: 'builtin', available: true }));
  store.dispatch(upsertIntegration({ id: 's3', kind: 'storage', name: 'AWS S3', provider: 's3', source: 'builtin', available: true }));
  render(
    <Provider store={store}>
      <MemoryRouter initialEntries={['/project/p1/workflow']}>
        <Routes><Route path="/project/:id/workflow" element={<WorkflowCanvas workflow={shown} />} /></Routes>
      </MemoryRouter>
    </Provider>,
  );
  return store;
};

beforeEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  // What else the canvas loads (a connection's tables) isn't this test's.
  vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, status: 200, json: async () => ({ data: [] }) })));
  globalThis.ResizeObserver ??= class { observe() {} unobserve() {} disconnect() {} } as unknown as typeof ResizeObserver;
  vi.spyOn(resources, 'getDependents').mockResolvedValue([]);
});

const editMode = async () => { await userEvent.setup().click(screen.getByRole('switch')); };

// The whole canvas renders: slower than most, with the suite running alongside.
describe('the workflow, connecting and disconnecting', () => {
  it("offers what the project isn't connected to; saved, the server connects it and answers the project", async () => {
    const save = vi.spyOn(workflowService, 'saveWorkflow').mockImplementation(async (_p, nodeSchema) => ({
      data: { ...workflow, nodeSchema, updatedAt: '2026-10-28T11:00:00.000Z' } as Workflow,
      project: { dbConnections: [MONGO, PG] }, errors: [],
    }));
    const store = renderCanvas();
    await editMode();
    const user = userEvent.setup();
    // A plain click: the canvas' drag handlers need a real window on mousedown.
    fireEvent.click(await screen.findByText('Spells source'));
    await user.click(await screen.findByRole('button', { name: /Configure/ }));
    await user.click(screen.getByRole('button', { name: /Select a connection/ }));
    expect(screen.queryByText('+ Connect MongoDB (built-in)')).not.toBeInTheDocument();
    expect(screen.queryByText('+ Connect AWS S3 (built-in)')).not.toBeInTheDocument();
    fireEvent.mouseDown(screen.getByText('+ Connect PostgreSQL (built-in)'));
    expect(screen.getByTestId('connect-on-save')).toHaveTextContent('Connected to the project when you save the workflow.');
    const modal = screen.getByTestId('connect-on-save').closest('[class*="configModalContainer"]') as HTMLElement;
    await user.click(within(modal).getByRole('button', { name: /Save/ }));
    // Named after it already, and nothing changed in the project yet.
    expect(await screen.findByText('PostgreSQL')).toBeInTheDocument();
    expect(save).not.toHaveBeenCalled();
    expect(store.getState().currentProject.data?.dbConnections).toEqual([MONGO]);

    await user.click(screen.getByTestId('workflow-save'));
    await waitFor(() => expect(save).toHaveBeenCalledTimes(1));
    const [projectId, nodeSchema, base] = save.mock.calls[0];
    expect(projectId).toBe('p1');
    expect(base).toBe('2026-10-28T10:00:00.000Z');
    expect((nodeSchema as { nodes: { id: string; data: Record<string, unknown> }[] }).nodes.find(n => n.id === 'ds1')?.data)
      .toMatchObject({ label: 'PostgreSQL', connectionId: '__connect__:postgres' });
    await waitFor(() => expect(store.getState().currentProject.data?.dbConnections?.map(c => c.id)).toEqual(['c-mongo', 'c-pg']));
  }, 20_000);

  it("deleting a resource's node asks; confirmed, the workflow saved without it", async () => {
    const remove = vi.spyOn(resources, 'removeResource');
    const save = vi.spyOn(workflowService, 'saveWorkflow').mockImplementation(async (_p, nodeSchema) => ({
      data: { ...workflow, nodeSchema, updatedAt: '2026-10-28T11:00:00.000Z' } as Workflow, project: { dbConnections: [] }, errors: [],
    }));
    // Selected already: on the canvas, a click selects a node on its drag's mousedown.
    const selected = { ...workflow, nodeSchema: { ...workflow.nodeSchema!, nodes: workflow.nodeSchema!.nodes.map(n => ((n as { id: string }).id === 'mongo-node' ? { ...n, selected: true } : n)) } } as Workflow;
    const store = renderCanvas(selected);
    await editMode();
    const user = userEvent.setup();
    await screen.findByText('MongoDB');
    // Opened, and selected: nothing to save yet.
    expect(screen.queryByTestId('workflow-unsaved')).not.toBeInTheDocument();
    fireEvent.keyDown(document.body, { key: 'Delete', code: 'Delete' });
    expect(await screen.findByTestId('remove-resource')).toHaveTextContent('Disconnect the built-in database connection MongoDB');
    await user.click(screen.getByRole('button', { name: /^Disconnect$/ }));
    expect(screen.queryByText('MongoDB')).not.toBeInTheDocument();
    expect(save).not.toHaveBeenCalled();
    expect(screen.getByTestId('workflow-unsaved')).toBeInTheDocument();

    await user.click(screen.getByTestId('workflow-save'));
    await waitFor(() => expect(save).toHaveBeenCalledTimes(1));
    const sent = save.mock.calls[0][1] as { nodes: { id: string }[] };
    expect(sent.nodes.map(n => n.id)).not.toContain('mongo-node');
    expect(remove).not.toHaveBeenCalled();
    await waitFor(() => expect(store.getState().currentProject.data?.dbConnections).toEqual([]));
    await waitFor(() => expect(screen.queryByTestId('workflow-unsaved')).not.toBeInTheDocument());
  }, 20_000);

  describe('leaving edit mode with changes', () => {
    const deleteMongo = async () => {
      const selected = { ...workflow, nodeSchema: { ...workflow.nodeSchema!, nodes: workflow.nodeSchema!.nodes.map(n => ((n as { id: string }).id === 'mongo-node' ? { ...n, selected: true } : n)) } } as Workflow;
      renderCanvas(selected);
      await editMode();
      await screen.findByText('MongoDB');
      fireEvent.keyDown(document.body, { key: 'Delete', code: 'Delete' });
      await userEvent.setup().click(await screen.findByRole('button', { name: /^Disconnect$/ }));
      expect(screen.queryByText('MongoDB')).not.toBeInTheDocument();
    };

    it('asks first; discarded, the canvas is as saved and it goes to view mode', async () => {
      const save = vi.spyOn(workflowService, 'saveWorkflow');
      await deleteMongo();
      const user = userEvent.setup();
      await user.click(screen.getByRole('switch'));
      expect(screen.getByTestId('workflow-leave')).toBeInTheDocument();
      expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'true');

      await user.click(screen.getByRole('button', { name: /Keep editing/ }));
      expect(screen.queryByTestId('workflow-leave')).not.toBeInTheDocument();
      expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'true');

      await user.click(screen.getByRole('switch'));
      await user.click(screen.getByRole('button', { name: /^Discard$/ }));
      expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'false');
      expect(await screen.findByText('MongoDB')).toBeInTheDocument();
      expect(save).not.toHaveBeenCalled();
    }, 20_000);

    it('saved, it goes to view mode', async () => {
      const save = vi.spyOn(workflowService, 'saveWorkflow').mockImplementation(async (_p, nodeSchema) => ({
        data: { ...workflow, nodeSchema, updatedAt: '2026-10-28T11:00:00.000Z' } as Workflow, project: { dbConnections: [] }, errors: [],
      }));
      await deleteMongo();
      const user = userEvent.setup();
      await user.click(screen.getByRole('switch'));
      await user.click(within(screen.getByTestId('workflow-leave').closest('[class*="container"]') as HTMLElement).getByRole('button', { name: /^Save$/ }));
      await waitFor(() => expect(save).toHaveBeenCalledTimes(1));
      await waitFor(() => expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'false'));
    }, 20_000);

    it('without changes, it goes to view mode at once', async () => {
      renderCanvas();
      await editMode();
      await userEvent.setup().click(screen.getByRole('switch'));
      expect(screen.queryByTestId('workflow-leave')).not.toBeInTheDocument();
      expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'false');
    }, 20_000);
  });

  it('navigating away with changes asks first; discarded, it goes', async () => {
    const save = vi.spyOn(workflowService, 'saveWorkflow');
    const store = renderCanvas();
    // The same store, now under a data router (as the app is), with somewhere to go.
    const selected = { ...workflow, nodeSchema: { ...workflow.nodeSchema!, nodes: workflow.nodeSchema!.nodes.map(n => ((n as { id: string }).id === 'mongo-node' ? { ...n, selected: true } : n)) } } as Workflow;
    const router = createMemoryRouter([{ path: '*', element: (
      <Routes>
        <Route path="/project/:id/workflow" element={<WorkflowCanvas workflow={selected} />} />
        <Route path="*" element={<Where />} />
      </Routes>
    ) }], { initialEntries: ['/project/p1/workflow'] });
    document.body.innerHTML = '';
    render(<Provider store={store}><RouterProvider router={router} /></Provider>);
    await editMode();
    const user = userEvent.setup();
    await screen.findByText('MongoDB');
    // Without changes, nothing holds it.
    expect(screen.queryByTestId('workflow-unsaved')).not.toBeInTheDocument();
    fireEvent.keyDown(document.body, { key: 'Delete', code: 'Delete' });
    await user.click(await screen.findByRole('button', { name: /^Disconnect$/ }));

    await act(async () => { await router.navigate('/project/p1/storage'); });
    expect(screen.getByTestId('workflow-leave')).toHaveTextContent('before leaving the page');
    await user.click(screen.getByRole('button', { name: /Keep editing/ }));
    expect(router.state.location.pathname).toBe('/project/p1/workflow');

    await act(async () => { await router.navigate('/project/p1/storage'); });
    await user.click(screen.getByRole('button', { name: /^Discard$/ }));
    await waitFor(() => expect(screen.getByTestId('location')).toHaveTextContent('/project/p1/storage'));
    expect(save).not.toHaveBeenCalled();
  }, 20_000);

  it('saved over a newer version, tells so and shows the workflow as it is now', async () => {
    const now = { ...workflow, updatedAt: '2026-10-28T12:00:00.000Z' } as Workflow;
    vi.spyOn(workflowService, 'saveWorkflow').mockRejectedValue(new workflowService.WorkflowConflict('The workflow changed since it was opened.', now));
    const selected = { ...workflow, nodeSchema: { ...workflow.nodeSchema!, nodes: workflow.nodeSchema!.nodes.map(n => ((n as { id: string }).id === 'mongo-node' ? { ...n, selected: true } : n)) } } as Workflow;
    const store = renderCanvas(selected);
    await editMode();
    const user = userEvent.setup();
    // Nothing changed: nothing to save.
    expect(screen.getByTestId('workflow-save')).toBeDisabled();
    await screen.findByText('MongoDB');
    fireEvent.keyDown(document.body, { key: 'Delete', code: 'Delete' });
    await user.click(await screen.findByRole('button', { name: /^Disconnect$/ }));
    expect(screen.getByTestId('workflow-save')).toBeEnabled();
    await user.click(screen.getByTestId('workflow-save'));
    await waitFor(() => expect(store.getState().apiResponses.responses).toEqual([expect.objectContaining({ message: 'The workflow changed since it was opened.', type: 'error' })]));
  }, 20_000);
});
