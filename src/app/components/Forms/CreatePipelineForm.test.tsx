import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CreatePipelineForm } from './CreatePipelineForm';
import * as pipelinesService from '../../../services/pipelines';

const makeStore = () =>
  configureStore({
    reducer: {
      currentProject: () => ({
        data: { id: 'p1', name: 'Demo', public: false, pipelines: [] },
        loading: false, error: null, membership: null,
      }),
    },
  });

const renderForm = () => render(
  <Provider store={makeStore()}>
    <MemoryRouter initialEntries={['/project/p1/workflow/pipelines/create']}>
      <Routes>
        <Route path="/project/:id/workflow/pipelines/create" element={<CreatePipelineForm />} />
      </Routes>
    </MemoryRouter>
  </Provider>,
);

describe('CreatePipelineForm', () => {
  beforeEach(() => vi.restoreAllMocks());

  it('renders without crashing', () => {
    renderForm();
    expect(screen.getByText('New Pipeline')).toBeInTheDocument();
  });

  it('defaults Type to Custom with an empty, editable name', () => {
    renderForm();
    expect(screen.getByText('Custom')).toBeInTheDocument();
    expect(screen.getByLabelText("Pipeline's name")).not.toBeDisabled();
  });

  it('disables Create until a name is filled', async () => {
    renderForm();
    const user = userEvent.setup();
    const createButton = screen.getByRole('button', { name: /create/i });
    expect(createButton).toBeDisabled();

    await user.type(screen.getByLabelText("Pipeline's name"), 'My Pipeline');
    expect(createButton).not.toBeDisabled();
  });

  const selectType = async (user: ReturnType<typeof userEvent.setup>, label: string) => {
    await user.click(screen.getByText('Custom'));
    await user.click(screen.getByText(label));
  };

  it('selecting a predefined type locks the name and pre-fills it with the template label', async () => {
    renderForm();
    const user = userEvent.setup();

    await selectType(user, 'Audiovisual Production');
    const nameInput = screen.getByLabelText("Pipeline's name") as HTMLInputElement;
    expect(nameInput.value).toBe('Audiovisual Production');
    expect(nameInput).toBeDisabled();
  });

  it('switching back to Custom re-enables the name field', async () => {
    renderForm();
    const user = userEvent.setup();

    await selectType(user, 'Audiovisual Production');
    await user.click(screen.getByText('Audiovisual Production'));
    await user.click(screen.getByText('Custom'));
    expect(screen.getByLabelText("Pipeline's name")).not.toBeDisabled();
  });

  it('creates a Custom pipeline without touching nodeSchema', async () => {
    vi.spyOn(pipelinesService, 'createPipeline').mockResolvedValue({
      pipeline: { id: 'pipe1', name: 'My Pipeline', description: '', order: 0, nodeSchema: null },
      pipelines: [{ id: 'pipe1', name: 'My Pipeline', order: 0 }],
    } as any);
    const updateSpy = vi.spyOn(pipelinesService, 'updatePipeline');
    renderForm();
    const user = userEvent.setup();

    await user.type(screen.getByLabelText("Pipeline's name"), 'My Pipeline');
    await user.click(screen.getByRole('button', { name: /create/i }));

    expect(pipelinesService.createPipeline).toHaveBeenCalledWith('p1', { name: 'My Pipeline', description: '' });
    expect(updateSpy).not.toHaveBeenCalled();
  });

  it('creates a predefined pipeline and immediately patches it with the template nodeSchema', async () => {
    vi.spyOn(pipelinesService, 'createPipeline').mockResolvedValue({
      pipeline: { id: 'pipe1', name: 'Audiovisual Production', description: '', order: 0, nodeSchema: null },
      pipelines: [{ id: 'pipe1', name: 'Audiovisual Production', order: 0 }],
    } as any);
    vi.spyOn(pipelinesService, 'updatePipeline').mockResolvedValue({
      id: 'pipe1', name: 'Audiovisual Production', description: '', order: 0, nodeSchema: { nodes: [], edges: [] },
    } as any);
    renderForm();
    const user = userEvent.setup();

    await selectType(user, 'Audiovisual Production');
    await user.click(screen.getByRole('button', { name: /create/i }));

    expect(pipelinesService.createPipeline).toHaveBeenCalledWith('p1', { name: 'Audiovisual Production', description: '' });
    expect(pipelinesService.updatePipeline).toHaveBeenCalledWith(
      'p1', 'pipe1', expect.objectContaining({ nodeSchema: expect.objectContaining({ nodes: expect.any(Array) }) }),
    );
  });
});
