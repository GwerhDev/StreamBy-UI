import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { vi } from 'vitest';
import { WorkflowPreview } from './WorkflowPreview';

const getProjectWorkflow = vi.fn();
vi.mock('../../../services/workflow', () => ({ getProjectWorkflow: (...args: unknown[]) => getProjectWorkflow(...args) }));
// The canvas itself: a node that could be clicked or focused, were the preview not inert.
vi.mock('../NodeViewer/NodeViewer', () => ({
  NodeViewer: () => <button type="button" data-testid="canvas-node">Node</button>,
}));

const WORKFLOW = { id: 'w1', name: 'Workflow', nodeSchema: { nodes: [], edges: [] } };

const renderAt = (readonly?: boolean) => render(
  <MemoryRouter initialEntries={['/project/p1/dashboard/overview']}>
    <Routes>
      <Route path="/project/p1/dashboard/overview" element={<WorkflowPreview projectId="p1" readonly={readonly} />} />
      <Route path="/project/p1/workflow" element={<p>Workflow page</p>} />
    </Routes>
  </MemoryRouter>,
);

describe('WorkflowPreview', () => {
  beforeEach(() => { getProjectWorkflow.mockReset(); });

  it('shows a spinner while the workflow loads', () => {
    getProjectWorkflow.mockReturnValue(new Promise(() => {}));
    renderAt();
    expect(screen.queryByTestId('canvas-node')).not.toBeInTheDocument();
    expect(screen.getByTestId('workflow-preview-canvas').querySelector('svg')).toBeInTheDocument();
  });

  it('is a link to the workflow, over the whole card', async () => {
    getProjectWorkflow.mockResolvedValue(WORKFLOW);
    renderAt();
    const link = screen.getByRole('link', { name: 'Open the workflow' });
    expect(link).toHaveAttribute('href', '/project/p1/workflow');
    await userEvent.click(link);
    expect(screen.getByText('Workflow page')).toBeInTheDocument();
  });

  it('keeps its canvas inert: nothing in it is focused nor reached', async () => {
    getProjectWorkflow.mockResolvedValue(WORKFLOW);
    renderAt();
    await screen.findByTestId('canvas-node');
    expect(screen.getByTestId('workflow-preview-canvas')).toHaveAttribute('inert');
    // Its link is all there is to reach in it.
    expect(screen.getAllByRole('link')).toHaveLength(1);
  });

  it('links nowhere in the public preview', async () => {
    getProjectWorkflow.mockResolvedValue(WORKFLOW);
    renderAt(true);
    await screen.findByTestId('canvas-node');
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
    expect(screen.getByTestId('workflow-preview-canvas')).toHaveAttribute('inert');
  });

  it('shows a placeholder when the workflow can’t be read', async () => {
    getProjectWorkflow.mockRejectedValue(new Error('nope'));
    renderAt();
    expect(await screen.findByText('Workflow preview not available')).toBeInTheDocument();
  });
});
