import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ShotPanel } from './ShotPanel';
import * as production from '../../../services/production';
import * as projects from '../../../services/projects';
import * as deliverables from '../../../services/deliverables';
import { ProductionShot, ProductionTask } from '../../../interfaces';

const SHOT: ProductionShot = {
  id: 's1', sequenceId: 'q1', projectId: 'p1', name: 'SH010', description: 'Wide establishing', order: 0, status: 'todo',
  assignedTo: ['u2'], dueDate: null, createdBy: 'u1', createdAt: '', updatedAt: '',
};
const TASK: ProductionTask = {
  id: 't1', shotId: 's1', projectId: 'p1', name: 'Layout', status: 'todo', priority: 'medium', assignedTo: null,
  dueDate: null, notes: null, createdBy: 'u1', createdAt: '', updatedAt: '',
};
const MEMBERS = [
  { userId: 'u1', username: 'ada', role: 'admin', status: 'active' },
  { userId: 'u2', username: 'eli', role: 'editor', status: 'active' },
  { userId: 'u3', username: 'pat', role: 'editor', status: 'pending' },
];

const renderPanel = (onUpdate = vi.fn()) => {
  const store = configureStore({
    reducer: {
      apiResponses: (state = { responses: [] as unknown[] }, action: { type: string; payload?: unknown }) =>
        (action.type === 'apiResponses/addApiResponse' ? { responses: [...state.responses, action.payload] } : state),
    },
  });
  render(
    <Provider store={store}>
      <MemoryRouter>
        <ShotPanel shot={SHOT} projectId="p1" onClose={vi.fn()} onUpdate={onUpdate} onDelete={vi.fn()} />
      </MemoryRouter>
    </Provider>,
  );
  return { store, onUpdate };
};

beforeEach(() => {
  vi.restoreAllMocks();
  vi.spyOn(production, 'getTasks').mockResolvedValue([TASK]);
  vi.spyOn(projects, 'fetchProjectMembers').mockResolvedValue(MEMBERS);
  vi.spyOn(deliverables, 'getDeliverables').mockResolvedValue([]);
});

describe('ShotPanel', () => {
  it("shows the shot's description and who it's assigned to", async () => {
    renderPanel();
    expect(screen.getByText('Wide establishing')).toBeInTheDocument();
    await waitFor(() => expect(screen.getByTestId('shot-assignees')).toHaveTextContent('eli'));
  });

  it('edits the shot: name, description, due date and assignees (active members only)', async () => {
    const update = vi.spyOn(production, 'updateShot').mockResolvedValue({ ...SHOT, name: 'SH011' });
    const { onUpdate } = renderPanel();
    const user = userEvent.setup();
    await screen.findByText('Layout');
    await user.click(screen.getByTitle('Edit shot'));
    expect(screen.queryByLabelText('pat')).not.toBeInTheDocument();
    const name = screen.getByLabelText('Name');
    await user.clear(name);
    await user.type(name, 'SH011');
    await user.type(screen.getByLabelText('Due date'), '2026-12-01');
    await user.click(screen.getByLabelText('ada'));
    await user.click(screen.getByLabelText('eli'));
    await user.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(update).toHaveBeenCalledWith('p1', 's1', {
      name: 'SH011', description: 'Wide establishing', dueDate: '2026-12-01', assignedTo: ['u1'],
    }));
    expect(onUpdate).toHaveBeenCalledWith(expect.objectContaining({ name: 'SH011' }));
    expect(screen.queryByRole('button', { name: 'Save' })).not.toBeInTheDocument();
  });

  it('edits a task: name, notes and assignee', async () => {
    const update = vi.spyOn(production, 'updateTask').mockResolvedValue({ ...TASK, name: 'Blocking', assignedTo: 'u2' });
    renderPanel();
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
    expect(screen.getByText('eli', { selector: 'small' })).toBeInTheDocument();
  });

  it('says so when saving fails, and keeps the dialog open', async () => {
    vi.spyOn(production, 'updateShot').mockRejectedValue(new Error('assignedTo must be a list of members of the project'));
    const { store } = renderPanel();
    const user = userEvent.setup();
    await user.click(screen.getByTitle('Edit shot'));
    await user.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(store.getState().apiResponses.responses).toEqual([
      expect.objectContaining({ type: 'error', message: 'assignedTo must be a list of members of the project' }),
    ]));
    expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument();
  });
});
