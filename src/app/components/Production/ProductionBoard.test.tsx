import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ProductionBoard } from './ProductionBoard';
import * as production from '../../../services/production';
import * as projects from '../../../services/projects';
import * as deliverables from '../../../services/deliverables';
import { ProductionSequence, ProductionShot } from '../../../interfaces';
import { STATUSES } from './shots';

const seq = (over: Partial<ProductionSequence>): ProductionSequence => ({
  id: 'q1', projectId: 'p1', name: 'Opening', order: 0, createdBy: 'u1', createdAt: '', updatedAt: '', ...over,
});
const shot = (over: Partial<ProductionShot>): ProductionShot => ({
  id: 's1', sequenceId: 'q1', projectId: 'p1', name: 'SH010', order: 0, status: 'todo', assignedTo: [],
  createdBy: 'u1', createdAt: '', updatedAt: '', ...over,
});
const MEMBERS = [
  { userId: 'u1', username: 'ada', role: 'admin', status: 'active' },
  { userId: 'u2', username: 'eli', role: 'editor', status: 'active' },
];

const Where = () => { const l = useLocation(); return <p data-testid="location">{l.pathname + l.search}</p>; };

const renderBoard = (path = '/project/p1/workflow/production') => {
  const store = configureStore({
    reducer: {
      apiResponses: (state = { responses: [] as unknown[] }, action: { type: string; payload?: unknown }) =>
        (action.type === 'apiResponses/addApiResponse' ? { responses: [...state.responses, action.payload] } : state),
    },
  });
  render(
    <Provider store={store}>
      <MemoryRouter initialEntries={[path]}>
        <Routes><Route path="/project/:id/workflow/production" element={<><ProductionBoard /><Where /></>} /></Routes>
      </MemoryRouter>
    </Provider>,
  );
  return store;
};
const where = () => screen.getByTestId('location').textContent;
const cell = (seqName: string, status: string) => screen.getByLabelText(`${seqName}, ${status}`);

beforeEach(() => {
  vi.restoreAllMocks();
  vi.spyOn(production, 'getSequences').mockResolvedValue([seq({}), seq({ id: 'q2', name: 'Chase' })]);
  vi.spyOn(production, 'getShots').mockImplementation(async (_p, seqId) => (seqId === 'q1'
    ? [shot({ assignedTo: ['u2'], taskSummary: { done: 2, total: 3, priority: 'high' } })]
    : [shot({ id: 's2', sequenceId: 'q2', name: 'SH200', status: 'review' })]));
  vi.spyOn(production, 'getTasks').mockResolvedValue([]);
  vi.spyOn(projects, 'fetchProjectMembers').mockResolvedValue(MEMBERS);
  vi.spyOn(deliverables, 'getDeliverables').mockResolvedValue([]);
});

const deleteButtons = () => screen.findAllByTitle('Delete sequence');
// The confirmation's button, not a lane's.
const confirmDelete = () => within(screen.getByText(/will also be deleted/).parentElement!).getByRole('button', { name: /Delete sequence/ });

describe('ProductionBoard', () => {
  it('has a column per status and a lane per sequence, its cards in their cells', async () => {
    renderBoard();
    const opening = await screen.findByRole('region', { name: 'Opening' });
    expect(within(opening).getAllByLabelText(/^Opening, /)).toHaveLength(STATUSES.length);
    expect(within(cell('Opening', 'To Do')).getByText('SH010')).toBeInTheDocument();
    expect(within(cell('Chase', 'Review')).getByText('SH200')).toBeInTheDocument();
    expect(within(cell('Opening', 'Review')).queryByText('SH200')).not.toBeInTheDocument();
  });

  it("a card shows its tasks' top priority, how they go, and who it's assigned to", async () => {
    renderBoard();
    const card = await screen.findByRole('button', { name: 'SH010' });
    expect(within(card).getByText('High')).toBeInTheDocument();
    expect(within(card).getByText('2/3')).toBeInTheDocument();
    await waitFor(() => expect(within(card).getByLabelText('eli')).toBeInTheDocument());
  });

  it('opens a card in a modal, at its own URL; Esc closes it', async () => {
    renderBoard();
    const user = userEvent.setup();
    await user.click(await screen.findByRole('button', { name: 'SH010' }));
    expect(screen.getByTestId('shot-modal')).toBeInTheDocument();
    expect(where()).toBe('/project/p1/workflow/production?shot=s1');

    fireEvent.keyDown(window, { key: 'Escape' });
    await waitFor(() => expect(screen.queryByTestId('shot-modal')).not.toBeInTheDocument());
    expect(where()).toBe('/project/p1/workflow/production');
  });

  it('a link with ?shot=<id> opens that card; closed, the link is the board', async () => {
    renderBoard('/project/p1/workflow/production?shot=s2');
    const modal = await screen.findByTestId('shot-modal');
    expect(within(modal).getByText('SH200')).toBeInTheDocument();
    fireEvent.keyDown(window, { key: 'Escape' });
    await waitFor(() => expect(screen.queryByTestId('shot-modal')).not.toBeInTheDocument());
    expect(where()).toBe('/project/p1/workflow/production');
  });

  it('creates a card in place, at the foot of a cell: in that sequence, with that status', async () => {
    const create = vi.spyOn(production, 'createShot').mockResolvedValue(shot({ id: 's3', name: 'SH020', status: 'in_progress' }));
    renderBoard();
    const user = userEvent.setup();
    await user.click(await screen.findByRole('button', { name: 'Create a shot in Opening, In Progress' }));
    await user.type(screen.getByLabelText('New shot name'), 'SH020{Enter}');
    await waitFor(() => expect(create).toHaveBeenCalledWith('p1', 'q1', { name: 'SH020', status: 'in_progress', order: 1 }));
    expect(await within(cell('Opening', 'In Progress')).findByText('SH020')).toBeInTheDocument();
    // Another can follow.
    expect(screen.getByLabelText('New shot name')).toHaveValue('');
  });

  it('deletes a sequence, with its shots, once confirmed', async () => {
    const del = vi.spyOn(production, 'deleteSequence').mockResolvedValue();
    renderBoard();
    const user = userEvent.setup();
    await user.click((await deleteButtons())[0]);
    expect(screen.getByText(/and their tasks, will also be deleted/)).toBeInTheDocument();
    await user.click(confirmDelete());
    await waitFor(() => expect(del).toHaveBeenCalledWith('p1', 'q1'));
    await waitFor(() => expect(screen.queryByText('SH010')).not.toBeInTheDocument());
    expect(screen.getByText(/1 sequences · 1 shots/)).toBeInTheDocument();
  });

  it("says so when deleting fails, and keeps the sequence", async () => {
    vi.spyOn(production, 'deleteSequence').mockRejectedValue(new Error('Database not available'));
    const store = renderBoard();
    const user = userEvent.setup();
    await user.click((await deleteButtons())[0]);
    await user.click(confirmDelete());
    await waitFor(() => expect(store.getState().apiResponses.responses).toEqual([
      expect.objectContaining({ message: 'Database not available', type: 'error' }),
    ]));
    expect(screen.getByText('SH010')).toBeInTheDocument();
    expect(confirmDelete()).toBeEnabled();
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

// Dragging, from the keyboard (Space picks a card up, arrows move it, Space drops it), over a
// laid-out board: each column 250px wide, side by side.
describe('dragging a card', () => {
  const original = Element.prototype.getBoundingClientRect;
  const rect = (x: number, y: number, width: number, height: number) =>
    ({ x, y, left: x, top: y, width, height, right: x + width, bottom: y + height, toJSON: () => ({}) }) as DOMRect;
  beforeEach(() => {
    Element.prototype.getBoundingClientRect = function (this: Element) {
      const label = this.getAttribute('aria-label') ?? '';
      const column = STATUSES.findIndex(st => label.endsWith(`, ${{ todo: 'To Do', in_progress: 'In Progress', review: 'Review', done: 'Done' }[st]}`));
      if (this.getAttribute('data-testid')?.startsWith('cell-') && column >= 0) {
        return rect(column * 250, label.startsWith('Opening') ? 0 : 300, 240, 200);
      }
      // The card, and the copy of it that's dragged (DragOverlay's), where it is.
      const draggedCopy = String(this.className).includes('cardBody') && !this.closest('[aria-label="SH010"]');
      if (label === 'SH010' || draggedCopy) return rect(10, 10, 200, 60);
      return rect(0, 0, 0, 0);
    };
  });
  afterEach(() => { Element.prototype.getBoundingClientRect = original; });

  const drag = async (key: 'ArrowRight' | 'ArrowDown', steps: number) => {
    const card = await screen.findByRole('button', { name: 'SH010' });
    card.focus();
    fireEvent.keyDown(card, { code: 'Space', key: ' ' });
    // The sensor listens for the keys after the one that picked the card up, and each arrow
    // moves it on from where it was drawn last.
    const tick = () => act(() => new Promise(resolve => setTimeout(resolve, 0)));
    await tick();
    for (let i = 0; i < steps; i++) {
      fireEvent.keyDown(document, { code: key, key });
      await tick();
    }
    fireEvent.keyDown(document, { code: 'Space', key: ' ' });
  };

  it('to another column, changes its status, and saves it', async () => {
    const update = vi.spyOn(production, 'updateShot').mockResolvedValue(shot({ status: 'in_progress' }));
    renderBoard();
    await drag('ArrowRight', 10);
    await waitFor(() => expect(update).toHaveBeenCalledWith('p1', 's1', { status: 'in_progress' }));
    expect(within(cell('Opening', 'In Progress')).getByText('SH010')).toBeInTheDocument();
  });

  it("goes back to its place, told, when it can't be saved", async () => {
    vi.spyOn(production, 'updateShot').mockRejectedValue(new Error('Database not available'));
    const store = renderBoard();
    await drag('ArrowRight', 20);
    await waitFor(() => expect(store.getState().apiResponses.responses).toEqual([
      expect.objectContaining({ message: 'Database not available', type: 'error' }),
    ]));
    // Told as it's put back: the board shows it after.
    expect(await within(cell('Opening', 'To Do')).findByText('SH010')).toBeInTheDocument();
  });

  it("to another sequence's lane, changes nothing: its lane is its sequence", async () => {
    const update = vi.spyOn(production, 'updateShot');
    renderBoard();
    await drag('ArrowDown', 12);
    await act(() => new Promise(resolve => setTimeout(resolve, 0)));
    expect(update).not.toHaveBeenCalled();
    expect(within(cell('Opening', 'To Do')).getByText('SH010')).toBeInTheDocument();
  });
});
