import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ProductionBoard } from './ProductionBoard';
import * as production from '../../../services/production';
import * as projects from '../../../services/projects';
import { ProductionSequence, ProductionShot } from '../../../interfaces';

const seq = (over: Partial<ProductionSequence>): ProductionSequence => ({
  id: 'q1', projectId: 'p1', name: 'Opening', order: 0, createdBy: 'u1', createdAt: '', updatedAt: '', ...over,
});
const shot = (over: Partial<ProductionShot>): ProductionShot => ({
  id: 's1', sequenceId: 'q1', projectId: 'p1', name: 'SH010', order: 0, status: 'todo', assignedTo: [],
  createdBy: 'u1', createdAt: '', updatedAt: '', ...over,
});

const renderBoard = () => {
  const store = configureStore({
    reducer: {
      apiResponses: (state = { responses: [] as unknown[] }, action: { type: string; payload?: unknown }) =>
        (action.type === 'apiResponses/addApiResponse' ? { responses: [...state.responses, action.payload] } : state),
    },
  });
  render(
    <Provider store={store}>
      <MemoryRouter initialEntries={['/project/p1/workflow/production']}>
        <Routes><Route path="/project/:id/workflow/production" element={<ProductionBoard />} /></Routes>
      </MemoryRouter>
    </Provider>,
  );
  return store;
};

beforeEach(() => {
  vi.restoreAllMocks();
  vi.spyOn(production, 'getSequences').mockResolvedValue([seq({}), seq({ id: 'q2', name: 'Chase' })]);
  vi.spyOn(production, 'getShots').mockImplementation(async (_p, seqId) => (seqId === 'q1' ? [shot({})] : []));
  vi.spyOn(projects, 'fetchProjectMembers').mockResolvedValue([]);
});

const deleteButtons = () => screen.findAllByTitle('Delete sequence');

describe('ProductionBoard', () => {
  it('deletes a sequence, with its shots, once confirmed', async () => {
    const del = vi.spyOn(production, 'deleteSequence').mockResolvedValue();
    renderBoard();
    const user = userEvent.setup();
    await user.click((await deleteButtons())[0]);
    expect(screen.getByText(/and their tasks, will also be deleted/)).toBeInTheDocument();
    await user.click(screen.getByText('Delete sequence', { selector: 'button' }));
    await waitFor(() => expect(del).toHaveBeenCalledWith('p1', 'q1'));
    await waitFor(() => expect(screen.queryByText('SH010')).not.toBeInTheDocument());
    expect(screen.getByText(/1 sequences · 0 shots/)).toBeInTheDocument();
  });

  it("says so when deleting fails, and keeps the sequence", async () => {
    vi.spyOn(production, 'deleteSequence').mockRejectedValue(new Error('Database not available'));
    const store = renderBoard();
    const user = userEvent.setup();
    await user.click((await deleteButtons())[0]);
    await user.click(screen.getByText('Delete sequence', { selector: 'button' }));
    await waitFor(() => expect(store.getState().apiResponses.responses).toEqual([
      expect.objectContaining({ message: 'Database not available', type: 'error' }),
    ]));
    expect(screen.getByText('SH010')).toBeInTheDocument();
    expect(screen.getByText('Delete sequence', { selector: 'button' })).toBeEnabled();
  });

  it('renames a sequence', async () => {
    const update = vi.spyOn(production, 'updateSequence').mockResolvedValue(seq({ name: 'Prologue', description: 'Before the titles' }));
    renderBoard();
    const user = userEvent.setup();
    await user.click((await screen.findAllByTitle('Edit sequence'))[0]);
    const name = screen.getByLabelText('Name');
    await user.clear(name);
    await user.type(name, 'Prologue');
    await user.type(screen.getByLabelText('Description'), 'Before the titles');
    await user.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(update).toHaveBeenCalledWith('p1', 'q1', { name: 'Prologue', description: 'Before the titles' }));
    expect(await screen.findByText('Prologue')).toBeInTheDocument();
  });

  it("can't save a sequence without a name", async () => {
    renderBoard();
    const user = userEvent.setup();
    await user.click((await screen.findAllByTitle('Edit sequence'))[0]);
    await user.clear(screen.getByLabelText('Name'));
    expect(within(screen.getByRole('button', { name: 'Save' }).closest('form')!).getByRole('button', { name: 'Save' })).toBeDisabled();
  });
});
