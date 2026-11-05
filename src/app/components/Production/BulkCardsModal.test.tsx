import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { BulkCardsModal } from './BulkCardsModal';
import * as production from '../../../services/production';
import { ProductionShot } from '../../../interfaces';

const MEMBERS = [{ userId: 'u1', username: 'ada', role: 'admin', status: 'active' as const }];
const TEAMS = [{ id: 'tm1', name: 'Artists', members: [], createdAt: '', updatedAt: '' }];
const TEMPLATES = [{ id: 't1', projectId: 'p1', name: 'Character', tasks: [{ name: 'Modeling', priority: 'medium' as const, notes: null }], createdBy: 'u1', createdAt: '', updatedAt: '' }];
const SEQ = { id: 'q1', projectId: 'p1', name: 'Characters', order: 0, createdBy: 'u1', createdAt: '', updatedAt: '' };
const card = (i: number) => ({ id: `s${i}`, key: `WOG-${i}`, name: `Character ${i}` }) as unknown as ProductionShot;

const open = () => {
  const onCreated = vi.fn();
  const onError = vi.fn();
  render(
    <BulkCardsModal
      projectId="p1" sequence={SEQ} members={MEMBERS} teams={TEAMS} templates={TEMPLATES}
      names={{ shot: 'Asset', shots: 'Assets' }} onCreated={onCreated} onError={onError} onClose={vi.fn()}
    />,
  );
  return { onCreated, onError };
};
const paste = (text: string) => fireEvent.change(screen.getByLabelText('Paste a table or a CSV'), { target: { value: text } });

beforeEach(() => vi.restoreAllMocks());

describe('BulkCardsModal', () => {
  it('makes 18 cards of a pasted table of 18 rows, in one call, with a template', async () => {
    const create = vi.spyOn(production, 'createShots').mockResolvedValue({ shots: Array.from({ length: 18 }, (_, i) => card(i + 1)), tasks: 18 });
    const { onCreated } = open();
    paste(['name\tpeople\tteams', ...Array.from({ length: 18 }, (_, i) => `Character ${i + 1}\tada\tArtists`)].join('\n'));
    expect(within(screen.getByRole('table', { name: 'Assets to create' })).getAllByRole('row')).toHaveLength(19);
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: 'None' }));
    fireEvent.mouseDown(screen.getByText('Character (1 tasks)'));
    await user.click(screen.getByRole('button', { name: 'Create 18 assets' }));
    await waitFor(() => expect(onCreated).toHaveBeenCalledWith(expect.any(Array), 18));
    expect(create).toHaveBeenCalledTimes(1);
    const [, seqId, cards, templateId] = create.mock.calls[0];
    expect(seqId).toBe('q1');
    expect(cards).toHaveLength(18);
    expect(cards[0]).toEqual({ name: 'Character 1', assignedTo: ['u1'], teamIds: ['tm1'] });
    expect(templateId).toBe('t1');
  });

  it("doesn't make them while a row is wrong, and says which", () => {
    const create = vi.spyOn(production, 'createShots');
    open();
    paste('Hero\t\tzoe');
    expect(screen.getByText("Line 1: zoe isn't a member of the project")).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Create 1 asset' })).toBeDisabled();
    expect(create).not.toHaveBeenCalled();
  });

  it('says why they could not be made', async () => {
    vi.spyOn(production, 'createShots').mockRejectedValue(new Error('Row 2: name must not be blank'));
    const { onError } = open();
    paste('Hero');
    await userEvent.setup().click(screen.getByRole('button', { name: 'Create 1 asset' }));
    await waitFor(() => expect(onError).toHaveBeenCalledWith(expect.objectContaining({ message: 'Row 2: name must not be blank' })));
  });
});
