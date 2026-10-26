import { ReactNode } from 'react';
import { render } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import currentJob from '../store/currentJobSlice';
import { JobRecord, Worker } from '../interfaces';
import { Where } from './Where';

export const worker = (over: Partial<Worker> = {}): Worker => ({
  source: 'builtin', id: 'gltf', name: 'glTF optimizer', provider: 'streamby-worker', kinds: ['gltf-optimize', 'lod'],
  categories: ['3d-models'], autoKind: null, description: null, hasCredential: true, createdBy: null, ...over,
});

export const job = (over: Partial<JobRecord> = {}): JobRecord => ({
  jobId: 'j1', jobType: 'process', projectId: 'p1', assetId: 'a1', status: 'processing', stage: 'accepted', progress: 40,
  kind: 'gltf-optimize', worker: { source: 'builtin', id: 'gltf', name: 'glTF optimizer' }, resultMode: 'derived',
  createdAt: '2026-10-26T10:00:00Z', ...over,
});

// A component at a project's route, with the job store and the toasts.
export const renderAt = (path: string, route: string, element: ReactNode) => {
  const store = configureStore({
    reducer: {
      currentJob,
      apiResponses: (state = { responses: [] as unknown[] }, action: { type: string; payload?: unknown }) =>
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
