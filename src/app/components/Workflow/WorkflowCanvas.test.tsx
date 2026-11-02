import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import currentProject from '../../../store/currentProjectSlice';
import management from '../../../store/managementSlice';
import documents from '../../../store/documentsSlice';
import creditsSheets from '../../../store/creditsSheetsSlice';
import { Workflow } from '../../../interfaces';
import { WorkflowCanvas } from './WorkflowCanvas';

// A workflow saved when Shot, Assembly and Master were offered on it: they aren't anymore, and
// what was saved with them still shows.
const SAVED = {
  id: 'w1', name: 'Workflow', updatedAt: '2026-10-28T10:00:00.000Z',
  nodeSchema: {
    nodes: [
      { id: 'streamby', type: 'orchestratorNode', position: { x: 0, y: 0 }, data: { label: 'StreamBy', subtitle: 'Orchestrator' } },
      { id: 'shot-1', type: 'shotNode', position: { x: 300, y: 0 }, data: { label: 'Saved shot', subtitle: 'Raw video clip' } },
      { id: 'assembly-1', type: 'assemblyNode', position: { x: 600, y: 0 }, data: { label: 'Saved assembly', subtitle: 'Edit timeline' } },
      { id: 'master-1', type: 'masterNode', position: { x: 900, y: 0 }, data: { label: 'Saved master', subtitle: 'Versioned master' } },
    ],
    edges: [],
  },
} as unknown as Workflow;

const renderCanvas = () => {
  const store = configureStore({
    reducer: {
      currentProject, management, documents, creditsSheets,
      session: () => ({ logged: true, loader: false, username: 'ada', userId: 'u1', mode: 'developer' }),
      apiResponses: (state = { responses: [] as unknown[] }) => state,
    },
  });
  store.dispatch({ type: 'currentProject/setCurrentProject', payload: { id: 'p1', name: 'Test', public: false } });
  render(
    <Provider store={store}>
      <MemoryRouter initialEntries={['/project/p1/workflow']}>
        <Routes><Route path="/project/:id/workflow" element={<WorkflowCanvas workflow={SAVED} />} /></Routes>
      </MemoryRouter>
    </Provider>,
  );
};

beforeEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, status: 200, json: async () => ({ data: [] }) })));
  globalThis.ResizeObserver ??= class { observe() {} unobserve() {} disconnect() {} } as unknown as typeof ResizeObserver;
});

describe('a workflow saved with a Shot, an Assembly and a Master', () => {
  it('renders them, and its palette offers none, but still a Pipeline', async () => {
    renderCanvas();
    for (const label of ['Saved shot', 'Saved assembly', 'Saved master']) expect(await screen.findByText(label)).toBeInTheDocument();
    // By their own components: an unregistered type would show its label too, in a default node.
    for (const subtitle of ['Raw video clip', 'Edit timeline', 'Versioned master']) expect(screen.getByText(subtitle)).toBeInTheDocument();

    await userEvent.setup().click(screen.getByRole('switch'));
    expect(await screen.findByRole('button', { name: /Pipeline/ })).toBeInTheDocument();
    for (const name of ['Shot', 'Assembly', 'Master']) expect(screen.queryByRole('button', { name })).not.toBeInTheDocument();
    expect(screen.queryByText('Audiovisual')).not.toBeInTheDocument();
  });
});
