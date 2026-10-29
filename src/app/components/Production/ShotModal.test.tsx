import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ShotModal } from './ShotModal';
import * as production from '../../../services/production';
import * as deliverables from '../../../services/deliverables';
import { Member, ProductionShot, ProductionTask } from '../../../interfaces';

const SHOT: ProductionShot = {
  id: 's1', sequenceId: 'q1', projectId: 'p1', name: 'SH010', description: 'Wide establishing', order: 0, status: 'todo',
  assignedTo: ['u2'], dueDate: null, createdBy: 'u1', createdAt: '', updatedAt: '',
  taskSummary: { done: 0, total: 1, priority: 'medium' },
};
const TASK: ProductionTask = {
  id: 't1', shotId: 's1', projectId: 'p1', name: 'Layout', status: 'todo', priority: 'medium', assignedTo: null,
  dueDate: null, notes: null, createdBy: 'u1', createdAt: '', updatedAt: '',
};
const MEMBERS: Member[] = [
  { userId: 'u1', username: 'ada', role: 'admin', status: 'active' },
  { userId: 'u2', username: 'eli', role: 'editor', status: 'active' },
];

const renderModal = (shot: ProductionShot = SHOT) => {
  const store = configureStore({
    reducer: {
      apiResponses: (state = { responses: [] as unknown[] }, action: { type: string; payload?: unknown }) =>
        (action.type === 'apiResponses/addApiResponse' ? { responses: [...state.responses, action.payload] } : state),
    },
  });
  const onUpdate = vi.fn();
  const onClose = vi.fn();
  const onDelete = vi.fn();
  render(
    <Provider store={store}>
      <MemoryRouter>
        <ShotModal
          shot={shot} sequence={{ id: 'q1', projectId: 'p1', name: 'Opening', order: 0, createdBy: 'u1', createdAt: '', updatedAt: '' }}
          projectId="p1" members={MEMBERS} onClose={onClose} onUpdate={onUpdate} onDelete={onDelete}
        />
      </MemoryRouter>
    </Provider>,
  );
  return { store, onUpdate, onClose, onDelete };
};

beforeEach(() => {
  vi.restoreAllMocks();
  vi.spyOn(production, 'getTasks').mockResolvedValue([TASK]);
  vi.spyOn(deliverables, 'getDeliverables').mockResolvedValue([]);
});

describe('ShotModal', () => {
  it("shows the shot: its sequence, name, description, status and who it's assigned to", async () => {
    renderModal();
    expect(screen.getByText('Opening')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /SH010/ })).toBeInTheDocument();
    expect(screen.getByLabelText('Description')).toHaveValue('Wide establishing');
    expect(screen.getByRole('button', { name: 'To Do' })).toBeInTheDocument();
    expect(within(screen.getByTestId('shot-assignees')).getByLabelText('eli')).toBeInTheDocument();
    expect(screen.getByLabelText('eli', { selector: 'input' })).toBeChecked();
    expect(await screen.findByText('Layout')).toBeInTheDocument();
  });

  it('renames it in place: Enter saves, Esc puts it back (and leaves the modal open)', async () => {
    const update = vi.spyOn(production, 'updateShot').mockResolvedValue({ ...SHOT, name: 'SH011' });
    const { onUpdate, onClose } = renderModal();
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: /SH010/ }));
    const input = screen.getByLabelText('Shot name');
    await user.clear(input);
    await user.type(input, 'SH011{Enter}');
    await waitFor(() => expect(update).toHaveBeenCalledWith('p1', 's1', { name: 'SH011' }));
    expect(onUpdate).toHaveBeenCalledWith(expect.objectContaining({ name: 'SH011', taskSummary: SHOT.taskSummary }));

    await user.click(screen.getByRole('button', { name: /SH010/ }));
    await user.type(screen.getByLabelText('Shot name'), 'X');
    await user.keyboard('{Escape}');
    expect(screen.queryByLabelText('Shot name')).not.toBeInTheDocument();
    expect(onClose).not.toHaveBeenCalled();
    expect(update).toHaveBeenCalledTimes(1);
  });

  it('saves the description when it leaves it, and assigns as it is checked', async () => {
    const update = vi.spyOn(production, 'updateShot').mockImplementation(async (_p, _id, changes) => ({ ...SHOT, ...changes } as ProductionShot));
    renderModal();
    const user = userEvent.setup();
    await user.type(screen.getByLabelText('Description'), ', at dawn');
    await user.click(screen.getByLabelText('ada', { selector: 'input' }));
    await waitFor(() => expect(update).toHaveBeenCalledWith('p1', 's1', { description: 'Wide establishing, at dawn' }));
    await waitFor(() => expect(update).toHaveBeenCalledWith('p1', 's1', { assignedTo: ['u2', 'u1'] }));
  });

  it("checks tasks off and sets their priority, its card's summary following", async () => {
    const updateTask = vi.spyOn(production, 'updateTask').mockResolvedValue(TASK);
    const { onUpdate } = renderModal();
    const user = userEvent.setup();
    await user.click(await screen.findByRole('checkbox', { name: 'Layout' }));
    await waitFor(() => expect(updateTask).toHaveBeenCalledWith('p1', 's1', 't1', { status: 'done' }));
    expect(onUpdate).toHaveBeenLastCalledWith(expect.objectContaining({ taskSummary: { done: 1, total: 1, priority: null } }));
    expect(screen.getByText('1/1')).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: 'Layout' })).toBeChecked();

    await user.click(within(screen.getByLabelText('Priority of Layout')).getByRole('button', { name: 'Medium' }));
    fireEvent.mouseDown(screen.getByText('High'));
    await waitFor(() => expect(updateTask).toHaveBeenCalledWith('p1', 's1', 't1', { priority: 'high' }));
  });

  it('adds a task in place', async () => {
    const create = vi.spyOn(production, 'createTask').mockResolvedValue({ ...TASK, id: 't2', name: 'Lighting', priority: 'high' });
    const { onUpdate } = renderModal();
    const user = userEvent.setup();
    await screen.findByText('Layout');
    await user.click(screen.getByRole('button', { name: /Add$/ }));
    await user.type(screen.getByLabelText('New task'), 'Lighting{Enter}');
    await waitFor(() => expect(create).toHaveBeenCalledWith('p1', 's1', { name: 'Lighting' }));
    expect(await screen.findByText('Lighting')).toBeInTheDocument();
    expect(onUpdate).toHaveBeenLastCalledWith(expect.objectContaining({ taskSummary: { done: 0, total: 2, priority: 'high' } }));
  });

  it('edits a task: name, notes and assignee', async () => {
    const update = vi.spyOn(production, 'updateTask').mockResolvedValue({ ...TASK, name: 'Blocking', assignedTo: 'u2' });
    renderModal();
    const user = userEvent.setup();
    await user.click(await screen.findByRole('button', { name: 'Edit task Layout' }));
    const name = screen.getByLabelText('Name');
    await user.clear(name);
    await user.type(name, 'Blocking');
    await user.type(screen.getByLabelText('Notes'), 'Old rig');
    await user.selectOptions(screen.getByLabelText('Assigned to'), 'u2');
    await user.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(update).toHaveBeenCalledWith('p1', 's1', 't1', {
      name: 'Blocking', notes: 'Old rig', dueDate: null, assignedTo: 'u2',
    }));
    expect(await screen.findByText('Blocking')).toBeInTheDocument();
  });

  it("puts a task back, told, when its change can't be saved", async () => {
    vi.spyOn(production, 'updateTask').mockRejectedValue(new Error('Database not available'));
    const { store } = renderModal();
    const user = userEvent.setup();
    await user.click(await screen.findByRole('checkbox', { name: 'Layout' }));
    await waitFor(() => expect(store.getState().apiResponses.responses).toEqual([
      expect.objectContaining({ type: 'error', message: 'Database not available' }),
    ]));
    expect(screen.getByRole('checkbox', { name: 'Layout' })).not.toBeChecked();
  });

  it('is closed by Esc, and deleted from its button', async () => {
    const { onClose, onDelete } = renderModal();
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: /Delete shot/ }));
    expect(onDelete).toHaveBeenCalledWith('s1');
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onClose).toHaveBeenCalled();
  });
});
