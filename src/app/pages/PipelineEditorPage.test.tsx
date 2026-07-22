import { render, screen, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { store } from '../../store';
import { PipelineEditorPage } from './PipelineEditorPage';
import * as pipelinesService from '../../services/pipelines';
import type { Pipeline } from '../../interfaces';

// Mock the canvas so the test doesn't pull in ReactFlow; assert it receives the loaded pipeline
// with the pipeline context.
vi.mock('../components/Workflow/PipelineCanvas', () => ({
  PipelineCanvas: ({ pipeline }: { pipeline: Pipeline }) => (
    <div data-testid="pipeline-canvas">{pipeline.name}</div>
  ),
}));

const PIPELINE: Pipeline = {
  id: 'p1',
  projectId: 'proj1',
  name: 'My Pipeline',
  description: null,
  order: 0,
  nodeSchema: null,
  createdBy: 'u1',
  createdAt: '',
  updatedAt: '',
};

const renderPage = () => render(
  <Provider store={store}>
    <MemoryRouter initialEntries={['/project/proj1/workflow/pipelines/p1/editor']}>
      <Routes>
        <Route path="/project/:id/workflow/pipelines/:pipelineId/editor" element={<PipelineEditorPage />} />
      </Routes>
    </MemoryRouter>
  </Provider>,
);

describe('PipelineEditorPage', () => {
  beforeEach(() => vi.restoreAllMocks());

  it('loads the pipeline and renders the canvas with it', async () => {
    vi.spyOn(pipelinesService, 'getPipeline').mockResolvedValue(PIPELINE);

    renderPage();

    await waitFor(() => expect(screen.getByTestId('pipeline-canvas')).toBeInTheDocument());
    expect(screen.getByText('My Pipeline')).toBeInTheDocument();
    expect(pipelinesService.getPipeline).toHaveBeenCalledWith('proj1', 'p1');
  });

  it('does not render the canvas when loading fails', async () => {
    vi.spyOn(pipelinesService, 'getPipeline').mockRejectedValue(new Error('nope'));

    renderPage();

    await waitFor(() => expect(pipelinesService.getPipeline).toHaveBeenCalled());
    expect(screen.queryByTestId('pipeline-canvas')).not.toBeInTheDocument();
  });
});
