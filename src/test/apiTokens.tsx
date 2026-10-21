import { ReactNode } from 'react';
import { render } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import { ApiToken } from '../interfaces';

export const PROJECTS = [
  { id: 'p1', name: 'Alpha', archived: false },
  { id: 'p2', name: 'Beta', archived: false },
];

export const token = (over: Partial<ApiToken>): ApiToken => ({
  id: 't1', kind: 'user', name: 'Laptop', prefix: 'sbt_abcd1234', permissions: ['project:read'], projectIds: ['p1'],
  createdAt: '2026-10-01T00:00:00Z', expiresAt: '2026-10-31T00:00:00Z', lastUsedAt: null,
  createdBy: { userId: 'u1', username: 'eli' }, ...over,
});

// The project p1, its admin being `admin`.
export const renderAt = (path: string, element: ReactNode, { admin = 'u1' }: { admin?: string } = {}) => {
  const store = configureStore({
    reducer: {
      session: () => ({ logged: true, loader: false, username: 'eli', userId: 'u1' }),
      projects: () => ({ list: PROJECTS, loading: false, error: null }),
      currentProject: () => ({
        data: { id: 'p1', name: 'Alpha', members: [{ userId: admin, role: 'admin' }, { userId: 'u1', role: admin === 'u1' ? 'admin' : 'editor' }] },
        loading: false, error: null, membership: null,
      }),
      apiResponses: (state = { responses: [] as unknown[], nextId: 0 }, action: { type: string; payload?: unknown }) =>
        (action.type === 'apiResponses/addApiResponse' ? { ...state, responses: [...state.responses, action.payload] } : state),
    },
  });
  render(
    <Provider store={store}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="*" element={element} />
        </Routes>
      </MemoryRouter>
    </Provider>,
  );
  return store;
};
