import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import sessionReducer from '../../../store/sessionSlice';
import { Browser } from './Browser';

const renderBrowser = (props: { preview?: boolean; env?: string } = {}, path = '/project/p1/dashboard/production') => {
  const empty = () => ({ data: null });
  const store = configureStore({
    reducer: {
      session: sessionReducer,
      currentProject: () => ({ data: { id: 'p1', name: 'Demo' }, membership: null }),
      currentExport: empty, currentWorkflow: empty, currentPipeline: empty, currentStorageFolder: empty,
      documents: () => ({ list: [] }),
      management: () => ({ databases: [], storages: [] }),
      apiResponses: () => ({ responses: [] }),
    },
  });
  render(
    <Provider store={store}>
      <MemoryRouter initialEntries={[path]}>
        <Routes><Route path="/project/:id/*" element={<Browser {...props}><p>Its page</p></Browser>} /></Routes>
      </MemoryRouter>
    </Provider>,
  );
  return store;
};

describe('Browser', () => {
  it('shows where the user is, as crumbs, and its page', () => {
    renderBrowser();
    expect(screen.getByText('dashboard')).toBeInTheDocument();
    expect(screen.getByText('production')).toBeInTheDocument();
    expect(screen.getByText('Its page')).toBeInTheDocument();
  });

  it("has the workspace's mode switch at the end of the crumbs, and it switches it", async () => {
    const store = renderBrowser();
    const toggle = screen.getByRole('switch');
    expect(toggle.closest('section')).toContainElement(screen.getByText('production'));
    const before = store.getState().session.mode;
    await userEvent.setup().click(toggle);
    expect(store.getState().session.mode).not.toBe(before);
  });

  it('a preview has no crumbs, nor the switch', () => {
    renderBrowser({ preview: true });
    expect(screen.queryByText('production')).not.toBeInTheDocument();
    expect(screen.queryByRole('switch')).not.toBeInTheDocument();
  });
});
