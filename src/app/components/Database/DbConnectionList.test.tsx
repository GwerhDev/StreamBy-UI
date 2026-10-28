import { render, screen, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import { beforeEach, vi } from 'vitest';
import * as database from '../../../services/database';
import * as resources from '../../../services/projectResources';
import currentProject from '../../../store/currentProjectSlice';
import { DbConnection, Project } from '../../../interfaces';
import userEvent from '@testing-library/user-event';
import { DbConnectionList } from './DbConnectionList';

describe('DbConnectionList', () => {
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

describe('DbConnectionList — disconnecting', () => {
  const PG = { id: 'c1', name: 'PostgreSQL', dbType: 'postgresql', isBuiltin: true } as DbConnection;
  const renderList = () => {
    const store = configureStore({ reducer: { currentProject, apiResponses: (state = { responses: [] as unknown[] }) => state } });
    store.dispatch({ type: 'currentProject/setCurrentProject', payload: { id: 'p1', name: 'Spellcast', public: false, dbConnections: [PG] } as unknown as Project });
    render(
      <Provider store={store}>
        <MemoryRouter initialEntries={['/project/p1/database']}>
          <Routes><Route path="/project/:id/database" element={<DbConnectionList />} /></Routes>
        </MemoryRouter>
      </Provider>,
    );
    return store;
  };
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(database, 'fetchDbConnections').mockResolvedValue([PG]);
    vi.spyOn(resources, 'getDependents').mockResolvedValue([]);
  });

  it("a built-in can be disconnected too, only after confirming; it shows so until the server answers", async () => {
    let settle!: (v: { key: 'dbConnections'; value: unknown[] }) => void;
    const remove = vi.spyOn(resources, 'removeResource').mockReturnValue(new Promise(resolve => { settle = resolve; }));
    const store = renderList();
    const user = userEvent.setup();
    await user.click(await screen.findByTestId('disconnect-c1'));
    expect(remove).not.toHaveBeenCalled();
    expect(screen.getByTestId('remove-resource')).toHaveTextContent('built-in database connection PostgreSQL');
    await user.click(screen.getByRole('button', { name: /^Disconnect$/ }));
    expect(remove).toHaveBeenCalledWith('p1', 'db', PG);
    expect(screen.getByTestId('db-c1')).toHaveTextContent('Disconnecting…');
    settle({ key: 'dbConnections', value: [] });
    await waitFor(() => expect(screen.queryByTestId('db-c1')).not.toBeInTheDocument());
    expect(store.getState().currentProject.data?.dbConnections).toEqual([]);
  });
});

