import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { createMemoryRouter, Route, RouterProvider, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ExportEditor } from './ExportEditor';
import { Where } from '../../../test/Where';
import * as exportsService from '../../../services/exports';
import currentProject from '../../../store/currentProjectSlice';
import currentExport from '../../../store/currentExportSlice';
import currentJob from '../../../store/currentJobSlice';
import management from '../../../store/managementSlice';
import documents from '../../../store/documentsSlice';
import creditsSheets from '../../../store/creditsSheetsSlice';
import deliverableGates from '../../../store/deliverableGatesSlice';
import { Export } from '../../../interfaces';

// An export with a JSON Data node.
const anExport = {
  id: 'e1', name: 'site', method: 'GET', allowedOrigin: ['*'],
  nodeSchema: {
    nodes: [
      { id: 'request', type: 'requestNode', position: { x: 0, y: 0 }, data: { label: 'Request', subtitle: 'GET' } },
      { id: 'json', type: 'jsonInputNode', position: { x: 0, y: 200 }, data: { label: 'JSON Data', subtitle: 'Static', jsonString: '{"title":"old"}' } },
    ],
    edges: [],
  },
} as unknown as Export;

const EDITOR = '/project/p1/workflow/exports/e1/editor';

const renderEditor = () => {
  const store = configureStore({
    reducer: {
      currentProject, currentExport, currentJob, management, documents, creditsSheets, deliverableGates,
      session: () => ({ logged: true, loader: false, username: 'ada', userId: 'u1', mode: 'developer' }),
      apiResponses: (state = { responses: [] as unknown[] }) => state,
    },
  });
  store.dispatch({ type: 'currentProject/setCurrentProject', payload: { id: 'p1', name: 'Nhexa', connections: [] } });
  const router = createMemoryRouter([{ path: '*', element: (
    <Routes>
      <Route path="/project/:id/workflow/exports/:exportId/editor" element={<ExportEditor />} />
      <Route path="*" element={<Where />} />
    </Routes>
  ) }], { initialEntries: [EDITOR] });
  render(<Provider store={store}><RouterProvider router={router} /></Provider>);
  return router;
};

const saveButton = () => screen.getByRole('button', { name: /^Save$/ });

// Opens the JSON Data node's panel, by clicking it on the canvas.
const openJsonNode = async () => {
  const node = await waitFor(() => {
    const found = document.querySelector('.react-flow__node[data-id="json"]');
    if (!found) throw new Error('no node yet');
    return found as HTMLElement;
  });
  fireEvent.click(node);
};

// Opens the JSON Data node's editor, writes `json` and applies it.
const applyJson = async (json: string) => {
  const user = userEvent.setup();
  await openJsonNode();
  await user.click(await screen.findByRole('button', { name: /Edit JSON/ }));
  const textarea = document.querySelector('textarea') as HTMLTextAreaElement;
  fireEvent.change(textarea, { target: { value: json } });
  await user.click(screen.getByRole('button', { name: /^Apply$/ }));
};

beforeEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, status: 200, json: async () => ({ data: [] }) })));
  globalThis.ResizeObserver ??= class { observe() {} unobserve() {} disconnect() {} } as unknown as typeof ResizeObserver;
  vi.spyOn(exportsService, 'getExport').mockResolvedValue(structuredClone(anExport));
});

// The whole editor and its canvas render: slower than most, with the suite running alongside.
describe('ExportEditor, editing a JSON Data node', () => {
  it("applying the node's JSON shows the export as having unsaved changes", async () => {
    renderEditor();
    await openJsonNode();
    expect(await screen.findByRole('button', { name: /Edit JSON/ })).toBeInTheDocument();
    expect(saveButton()).toBeDisabled();
    await applyJson('{"title":"new"}');
    await waitFor(() => expect(saveButton()).toBeEnabled());
  }, 20_000);

  it('saving persists the JSON applied to the node', async () => {
    const update = vi.spyOn(exportsService, 'updateExport').mockResolvedValue({} as never);
    renderEditor();
    await applyJson('{"title":"new"}');
    await waitFor(() => expect(saveButton()).toBeEnabled());
    await userEvent.setup().click(saveButton());
    await waitFor(() => expect(update).toHaveBeenCalledTimes(1));
    const payload = update.mock.calls[0][2] as { nodeSchema: { nodes: { id: string; data: { jsonString?: string } }[] } };
    expect(payload.nodeSchema.nodes.find(n => n.id === 'json')?.data.jsonString).toBe('{"title":"new"}');
    await waitFor(() => expect(saveButton()).toBeDisabled());
  }, 20_000);

  it('leaving with the change unsaved asks first: kept, discarded or saved', async () => {
    const update = vi.spyOn(exportsService, 'updateExport').mockResolvedValue({} as never);
    const router = renderEditor();
    const user = userEvent.setup();
    await applyJson('{"title":"new"}');
    await waitFor(() => expect(saveButton()).toBeEnabled());

    // Any navigation: here the menu's, to the project's storage.
    await act(async () => { await router.navigate('/project/p1/storage'); });
    expect(screen.getByTestId('workflow-leave')).toHaveTextContent('The export has changes');
    await user.click(screen.getByRole('button', { name: /Keep editing/ }));
    expect(router.state.location.pathname).toBe(EDITOR);

    // Saved from the question, it goes.
    await act(async () => { await router.navigate('/project/p1/storage'); });
    const question = screen.getByTestId('workflow-leave').closest('[class*="container"]') as HTMLElement;
    await user.click(within(question).getByRole('button', { name: /^Save$/ }));
    await waitFor(() => expect(update).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(screen.getByTestId('location')).toHaveTextContent('/project/p1/storage'));
  }, 20_000);

  it('without changes, leaving asks nothing', async () => {
    const router = renderEditor();
    await openJsonNode();
    await screen.findByRole('button', { name: /Edit JSON/ });
    await act(async () => { await router.navigate('/project/p1/storage'); });
    expect(screen.queryByTestId('workflow-leave')).not.toBeInTheDocument();
    expect(screen.getByTestId('location')).toHaveTextContent('/project/p1/storage');
  }, 20_000);
});
