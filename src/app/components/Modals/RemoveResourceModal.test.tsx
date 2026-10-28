import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { RemoveResourceModal } from './RemoveResourceModal';
import * as resources from '../../../services/projectResources';
import currentProject from '../../../store/currentProjectSlice';
import { DbConnection, Project } from '../../../interfaces';

const PG = { id: 'c1', name: 'PostgreSQL', dbType: 'postgresql', isBuiltin: true } as DbConnection;
const MONGO = { id: 'c2', name: 'MongoDB', dbType: 'mongodb', isBuiltin: true } as DbConnection;
const PROJECT = { id: 'p1', name: 'Spellcast', public: false, dbConnections: [PG, MONGO] } as unknown as Project;

const renderModal = (ui: React.ReactElement) => {
  const store = configureStore({
    reducer: {
      currentProject,
      apiResponses: (state = { responses: [] as unknown[] }, action: { type: string; payload?: unknown }) =>
        (action.type === 'apiResponses/addApiResponse' ? { responses: [...state.responses, action.payload] } : state),
    },
  });
  store.dispatch({ type: 'currentProject/setCurrentProject', payload: PROJECT });
  render(<Provider store={store}>{ui}</Provider>);
  return store;
};

// A promise the test settles when it wants: the server's answer, held.
const held = <T,>() => {
  let settle!: (value: T) => void;
  let fail!: (err: Error) => void;
  const promise = new Promise<T>((resolve, reject) => { settle = resolve; fail = reject; });
  return { promise, settle, fail };
};

beforeEach(() => vi.restoreAllMocks());

describe('RemoveResourceModal', () => {
  it("tells what depends on it and what's kept before anything is done", async () => {
    vi.spyOn(resources, 'getDependents').mockResolvedValue([
      { type: 'export', id: 'e1', name: 'Site', count: 2 },
      { type: 'workflow', name: 'Spells', count: 1 },
    ]);
    const remove = vi.spyOn(resources, 'removeResource');
    renderModal(<RemoveResourceModal kind="db" resource={{ id: 'c1', name: 'PostgreSQL', isBuiltin: true }} onClose={vi.fn()} />);
    expect(screen.getByTestId('remove-resource')).toHaveTextContent('Disconnect the built-in database connection PostgreSQL from the project?');
    expect(screen.getByTestId('remove-resource')).toHaveTextContent('Its tables and records stay in the built-in database');
    const dependents = await screen.findByTestId('resource-dependents');
    expect(dependents).toHaveTextContent('Export Site (2 nodes)');
    expect(dependents).toHaveTextContent('The workflow: Spells (1 node)');
    expect(remove).not.toHaveBeenCalled();
  });

  it('closes on confirming, shows it being removed, then takes the list the server answers', async () => {
    vi.spyOn(resources, 'getDependents').mockResolvedValue([]);
    const answer = held<{ key: 'dbConnections'; value: unknown[] }>();
    const remove = vi.spyOn(resources, 'removeResource').mockReturnValue(answer.promise);
    const onClose = vi.fn();
    const store = renderModal(<RemoveResourceModal kind="db" resource={{ id: 'c1', name: 'PostgreSQL', isBuiltin: true }} onClose={onClose} />);
    await userEvent.setup().click(screen.getByRole('button', { name: /^Disconnect$/ }));

    expect(onClose).toHaveBeenCalled();
    expect(remove).toHaveBeenCalledWith('p1', 'db', { id: 'c1', name: 'PostgreSQL', isBuiltin: true });
    expect(store.getState().currentProject.removingIds).toEqual(['c1']);
    expect(store.getState().currentProject.data?.dbConnections).toHaveLength(2);

    answer.settle({ key: 'dbConnections', value: [MONGO] });
    await waitFor(() => expect(store.getState().currentProject.removingIds).toEqual([]));
    expect(store.getState().currentProject.data?.dbConnections?.map(c => c.id)).toEqual(['c2']);
  });

  it('keeps it when the server refuses, telling why', async () => {
    vi.spyOn(resources, 'getDependents').mockResolvedValue([]);
    vi.spyOn(resources, 'removeResource').mockRejectedValue(new Error('Unauthorized project access'));
    const store = renderModal(<RemoveResourceModal kind="storage" resource={{ id: 's1', name: 'AWS S3' }} onClose={vi.fn()} />);
    await userEvent.setup().click(screen.getByRole('button', { name: /^Disconnect$/ }));
    await waitFor(() => expect(store.getState().apiResponses.responses).toEqual([expect.objectContaining({ message: 'Unauthorized project access', type: 'error' })]));
    expect(store.getState().currentProject.removingIds).toEqual([]);
    expect(store.getState().currentProject.data?.dbConnections).toHaveLength(2);
  });

  it("on the workflow, only tells it's confirmed: it's removed when the workflow is saved", async () => {
    vi.spyOn(resources, 'getDependents').mockResolvedValue([{ type: 'files', name: 'Files', count: 12 }]);
    const remove = vi.spyOn(resources, 'removeResource');
    const onConfirm = vi.fn();
    renderModal(<RemoveResourceModal kind="storage" resource={{ id: 's1', name: 'AWS S3', isBuiltin: true }} onClose={vi.fn()} onConfirm={onConfirm} />);
    expect(await screen.findByTestId('resource-dependents')).toHaveTextContent('Kept for it:12 files');
    expect(screen.getByTestId('remove-on-save')).toHaveTextContent("It's disconnected when you save the workflow.");
    await userEvent.setup().click(screen.getByRole('button', { name: /^Disconnect$/ }));
    expect(onConfirm).toHaveBeenCalled();
    expect(remove).not.toHaveBeenCalled();
  });
});
