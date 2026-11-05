import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TaskTemplatesModal } from './TaskTemplatesModal';
import * as production from '../../../services/production';
import { TaskTemplate } from '../../../interfaces';

const CHARACTER: TaskTemplate = {
  id: 't1', projectId: 'p1', name: 'Character', createdBy: 'u1', createdAt: '', updatedAt: '',
  tasks: [{ name: 'Modeling', priority: 'medium', notes: null }, { name: 'Rig', priority: 'high', notes: 'Mixamo' }],
};

const open = (props: Partial<Parameters<typeof TaskTemplatesModal>[0]> = {}) => {
  const handlers = { onChange: vi.fn(), onSaved: vi.fn(), onError: vi.fn() };
  render(<TaskTemplatesModal projectId="p1" templates={[CHARACTER]} canEdit canDelete onClose={vi.fn()} {...handlers} {...props} />);
  return handlers;
};

beforeEach(() => vi.restoreAllMocks());

describe('TaskTemplatesModal', () => {
  it('lists the templates with their tasks', () => {
    open();
    expect(screen.getByText('Character')).toBeInTheDocument();
    expect(screen.getByText('Modeling · Rig')).toBeInTheDocument();
  });

  it('makes one, its tasks one per line', async () => {
    const made = { ...CHARACTER, id: 't2', name: 'Prop', tasks: [{ name: 'Model', priority: 'medium' as const, notes: null }] };
    const create = vi.spyOn(production, 'createTaskTemplate').mockResolvedValue(made);
    const { onChange, onSaved } = open();
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: 'New template' }));
    await user.type(screen.getByLabelText('Name'), 'Prop');
    await user.type(screen.getByLabelText('Tasks, one per line'), 'Model{enter}{enter}  Texture  ');
    await user.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(create).toHaveBeenCalledWith('p1', { name: 'Prop', tasks: ['Model', 'Texture'] }));
    expect(onChange).toHaveBeenCalledWith([CHARACTER, made]);
    expect(onSaved).toHaveBeenCalledWith('Template created.');
  });

  it('changes one, a task kept keeping its priority and notes', async () => {
    const update = vi.spyOn(production, 'updateTaskTemplate').mockResolvedValue(CHARACTER);
    open();
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: 'Edit Character' }));
    await user.type(screen.getByLabelText('Tasks, one per line'), '{enter}Export');
    await user.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(update).toHaveBeenCalledWith('p1', 't1', {
      name: 'Character', tasks: [CHARACTER.tasks[0], CHARACTER.tasks[1], 'Export'],
    }));
  });

  it('deletes one, and says why a change failed', async () => {
    vi.spyOn(production, 'deleteTaskTemplate').mockResolvedValue();
    const { onChange } = open();
    await userEvent.setup().click(screen.getByRole('button', { name: 'Delete Character' }));
    await waitFor(() => expect(onChange).toHaveBeenCalledWith([]));

    vi.spyOn(production, 'deleteTaskTemplate').mockRejectedValue(new Error('Nope'));
    const failing = open();
    await userEvent.setup().click(screen.getAllByRole('button', { name: 'Delete Character' })[1]);
    await waitFor(() => expect(failing.onError).toHaveBeenCalled());
  });

  it("is only seen by whoever can't change production", () => {
    open({ canEdit: false, canDelete: false });
    expect(screen.getByText('Character')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'New template' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Edit Character' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Delete Character' })).not.toBeInTheDocument();
  });
});
