import { ReactNode } from 'react';
import { render } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import documents from '../store/documentsSlice';
import { DocumentAuthor, ProjectDocument } from '../interfaces';
import { Where } from './Where';

export const ADA: DocumentAuthor = { userId: 'u1', username: 'ada', via: 'session' };
export const CLAUDE: DocumentAuthor = { userId: 'u1', username: 'ada', via: 'oauth', clientId: 'dyn_1', clientName: 'Claude' };

export const doc = (over: Partial<ProjectDocument> = {}): ProjectDocument => ({
  id: 'd1', projectId: 'p1', kind: 'document', title: 'Architecture', parentId: null, position: 0,
  content: '## Storage\n\nIndexedDB.\n', version: 1, exportable: false, publishedVersion: null,
  createdAt: '2026-10-27T10:00:00Z', createdBy: ADA, updatedAt: '2026-10-27T10:00:00Z', updatedBy: ADA, ...over,
});

// A component at one of the project p1's routes, the signed-in member (u1) with `role`, with
// the documents' store and the toasts.
export const renderAt = (path: string, route: string, element: ReactNode, { role = 'editor' }: { role?: string } = {}) => {
  const store = configureStore({
    reducer: {
      documents,
      session: () => ({ logged: true, loader: false, username: 'ada', userId: 'u1' }),
      currentProject: () => ({ data: { id: 'p1', name: 'Spellcast', members: [{ userId: 'u1', role, status: 'active' }] }, loading: false, error: null, membership: null }),
      apiResponses: (state = { responses: [] as { message: string; type: string }[] }, action: { type: string; payload?: any }) =>
        (action.type === 'apiResponses/addApiResponse' ? { responses: [...state.responses, action.payload] } : state),
    },
  });
  render(
    <Provider store={store}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path={route} element={element} />
          <Route path="*" element={<Where />} />
        </Routes>
      </MemoryRouter>
    </Provider>,
  );
  return store;
};
