import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ProductionBoard } from './ProductionBoard';
import { OldProductionRedirect } from '../../pages/ProductionBoardPage';
import * as production from '../../../services/production';
import * as projects from '../../../services/projects';
import * as deliverables from '../../../services/deliverables';
import * as teamsService from '../../../services/teams';
import { ProductionSequence, ProductionShot } from '../../../interfaces';
import { STATUSES } from './shots';

const seq = (over: Partial<ProductionSequence>): ProductionSequence => ({
  id: 'q1', projectId: 'p1', name: 'Opening', order: 0, createdBy: 'u1', createdAt: '', updatedAt: '', ...over,
});
const shot = (over: Partial<ProductionShot>): ProductionShot => ({
  id: 's1', sequenceId: 'q1', projectId: 'p1', name: 'SH010', order: 0, status: 'todo', assignedTo: [],
  createdBy: 'u1', createdAt: '', updatedAt: '', ...over,
});
// The board a project starts with: a column per status.
const COLUMNS = [
  { id: 'todo', name: 'To Do', status: 'todo' as const },
  { id: 'in_progress', name: 'In Progress', status: 'in_progress' as const },
  { id: 'review', name: 'Review', status: 'review' as const },
  { id: 'done', name: 'Done', status: 'done' as const },
];
const MEMBERS = [
  { userId: 'u1', username: 'ada', role: 'admin', status: 'active' },
  { userId: 'u2', username: 'eli', role: 'editor', status: 'active' },
];

const Where = () => { const l = useLocation(); return <p data-testid="location">{l.pathname + l.search}</p>; };

const renderBoard = (path = '/project/p1/dashboard/production') => {
  const store = configureStore({
    reducer: {
      session: () => ({ logged: true, loader: false, username: 'ada', userId: 'u1' }),
      apiResponses: (state = { responses: [] as unknown[] }, action: { type: string; payload?: unknown }) =>
        (action.type === 'apiResponses/addApiResponse' ? { responses: [...state.responses, action.payload] } : state),
    },
  });
  render(
    <Provider store={store}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/project/:id/dashboard/production" element={<><ProductionBoard /><Where /></>} />
          <Route path="/project/:id/workflow/production" element={<OldProductionRedirect />} />
        </Routes>
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
  vi.spyOn(teamsService, 'getTeams').mockResolvedValue([]);
  vi.spyOn(production, 'getBoardColumns').mockResolvedValue(COLUMNS);
});

const deleteButtons = () => screen.findAllByTitle('Delete sequence');
// The confirmation's button, not a lane's.
const confirmDelete = () => within(screen.getByText(/will also be deleted/).parentElement!).getByRole('button', { name: /Delete sequence/ });

describe('ProductionBoard', () => {
  it('has a column per status and a lane per sequence, its cards in their cells', async () => {
    renderBoard();
    const opening = await screen.findByRole('region', { name: 'Opening' });
    expect(within(opening).getAllByLabelText(/^Opening, /)).toHaveLength(COLUMNS.length);
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
    expect(where()).toBe('/project/p1/dashboard/production?shot=s1');

    fireEvent.keyDown(window, { key: 'Escape' });
    await waitFor(() => expect(screen.queryByTestId('shot-modal')).not.toBeInTheDocument());
    expect(where()).toBe('/project/p1/dashboard/production');
  });

  it('a link with ?shot=<id> opens that card; closed, the link is the board', async () => {
    renderBoard('/project/p1/dashboard/production?shot=s2');
    const modal = await screen.findByTestId('shot-modal');
    expect(within(modal).getByText('SH200')).toBeInTheDocument();
    fireEvent.keyDown(window, { key: 'Escape' });
    await waitFor(() => expect(screen.queryByTestId('shot-modal')).not.toBeInTheDocument());
    expect(where()).toBe('/project/p1/dashboard/production');
  });

  it('its old URL goes to the dashboard, with the card it linked to still open', async () => {
    renderBoard('/project/p1/workflow/production?shot=s2');
    expect(within(await screen.findByTestId('shot-modal')).getByText('SH200')).toBeInTheDocument();
    expect(where()).toBe('/project/p1/dashboard/production?shot=s2');
  });

  it('creates a card in place, at the foot of a cell: in that sequence, with that status', async () => {
    const create = vi.spyOn(production, 'createShot').mockResolvedValue(shot({ id: 's3', name: 'SH020', status: 'in_progress', columnId: 'in_progress' }));
    renderBoard();
    const user = userEvent.setup();
    await user.click(await screen.findByRole('button', { name: 'Create a shot in Opening, In Progress' }));
    await user.type(screen.getByLabelText('New shot name'), 'SH020{Enter}');
    await waitFor(() => expect(create).toHaveBeenCalledWith('p1', 'q1', { name: 'SH020', columnId: 'in_progress', order: 1 }));
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
    const update = vi.spyOn(production, 'updateShot').mockResolvedValue(shot({ status: 'in_progress', columnId: 'in_progress' }));
    renderBoard();
    await drag('ArrowRight', 10);
    await waitFor(() => expect(update).toHaveBeenCalledWith('p1', 's1', { columnId: 'in_progress' }));
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

describe('filtering the board', () => {
  // Ada (u1, the one signed in) is in Animation now; Eli (u2) isn't.
  const TEAMS = [
    { id: 'tm1', name: 'Animation', members: [{ userId: 'u1', username: 'ada' }], createdAt: '', updatedAt: '' },
    { id: 'tm2', name: 'Sound', members: [{ userId: 'u2', username: 'eli' }], createdAt: '', updatedAt: '' },
  ];
  beforeEach(() => {
    vi.spyOn(teamsService, 'getTeams').mockResolvedValue(TEAMS);
    vi.spyOn(production, 'getSequences').mockResolvedValue([seq({})]);
    vi.spyOn(production, 'getShots').mockResolvedValue([
      shot({ id: 's1', name: 'To Eli', assignedTo: ['u2'] }),
      shot({ id: 's2', name: 'To Animation', teamIds: ['tm1'] }),
      shot({ id: 's3', name: 'A task to Ada', taskSummary: { done: 0, total: 1, priority: 'low', assignedTo: ['u1'], teamIds: [] } }),
      shot({ id: 's4', name: 'A task to Sound', taskSummary: { done: 0, total: 1, priority: 'low', assignedTo: [], teamIds: ['tm2'] } }),
    ]);
  });
  // The board's cards (not, say, the open card's name in its modal).
  const shown = () => [...document.querySelectorAll('[aria-roledescription="draggable"]')].map(c => c.getAttribute('aria-label'));

  it("a card shows the teams it's assigned to", async () => {
    renderBoard();
    const card = await screen.findByRole('button', { name: 'To Animation' });
    expect(await within(card).findByText('Animation')).toBeInTheDocument();
  });

  it('"Assigned to me" shows what is assigned to me, or to a team I am in now, the card or one of its tasks', async () => {
    renderBoard();
    const user = userEvent.setup();
    await screen.findByRole('button', { name: 'To Eli' });
    await user.click(within(screen.getByLabelText('Filter by person')).getByRole('button'));
    fireEvent.mouseDown(screen.getByText('Assigned to me'));
    await waitFor(() => expect(shown()).toEqual(['To Animation', 'A task to Ada']));
    expect(where()).toBe('/project/p1/dashboard/production?person=me');
    expect(screen.getByText(/· 2 shown/)).toBeInTheDocument();
  });

  it("by a person, counts the teams they're in", async () => {
    renderBoard('/project/p1/dashboard/production?person=u2');
    await screen.findByRole('button', { name: 'To Eli' });
    expect(shown()).toEqual(['To Eli', 'A task to Sound']);
  });

  it("by a team, shows only its cards: the ones it's assigned, or one of their tasks", async () => {
    renderBoard('/project/p1/dashboard/production?team=tm1');
    await screen.findByRole('button', { name: 'To Animation' });
    expect(shown()).toEqual(['To Animation']);
  });

  it("keeps a card shown through a task of mine when a task of it changes in its modal", async () => {
    vi.spyOn(production, 'getTasks').mockResolvedValue([
      { id: 't1', shotId: 's3', projectId: 'p1', name: 'Layout', status: 'todo', priority: 'low', assignedTo: ['u1'], teamIds: [], createdBy: 'u1', createdAt: '', updatedAt: '' },
    ]);
    vi.spyOn(production, 'updateTask').mockImplementation(async (_p, _s, _t, changes) => ({
      id: 't1', shotId: 's3', projectId: 'p1', name: 'Layout', status: 'todo', priority: 'low', assignedTo: ['u1'], teamIds: [], createdBy: 'u1', createdAt: '', updatedAt: '', ...changes,
    } as never));
    renderBoard('/project/p1/dashboard/production?person=me');
    const user = userEvent.setup();
    await user.click(await screen.findByRole('button', { name: 'A task to Ada' }));
    await user.click(await screen.findByRole('checkbox', { name: 'Layout' }));
    await waitFor(() => expect(production.updateTask).toHaveBeenCalled());
    fireEvent.keyDown(window, { key: 'Escape' });
    await waitFor(() => expect(screen.queryByTestId('shot-modal')).not.toBeInTheDocument());
    expect(shown()).toEqual(['To Animation', 'A task to Ada']);
  });

  it("shows a card under a team's filter once one of its tasks is assigned to the team", async () => {
    vi.spyOn(production, 'getTasks').mockResolvedValue([
      { id: 't9', shotId: 's1', projectId: 'p1', name: 'Rig', status: 'todo', priority: 'low', assignedTo: [], teamIds: [], createdBy: 'u1', createdAt: '', updatedAt: '' },
    ]);
    vi.spyOn(production, 'updateTask').mockImplementation(async (_p, _s, _t, changes) => ({
      id: 't9', shotId: 's1', projectId: 'p1', name: 'Rig', status: 'todo', priority: 'low', assignedTo: [], teamIds: [], createdBy: 'u1', createdAt: '', updatedAt: '', ...changes,
    } as never));
    // Its card isn't under Animation yet: opened from its link.
    renderBoard('/project/p1/dashboard/production?team=tm1&shot=s1');
    const user = userEvent.setup();
    expect(await screen.findByTestId('shot-modal')).toBeInTheDocument();
    expect(shown()).toEqual(['To Animation']);
    await user.click(await screen.findByRole('button', { name: 'Edit task Rig' }));
    await user.click(screen.getByLabelText('Animation', { selector: '#task-t9-team-tm1' }));
    await user.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(production.updateTask).toHaveBeenCalledWith('p1', 's1', 't9', expect.objectContaining({ teamIds: ['tm1'] })));
    fireEvent.keyDown(window, { key: 'Escape' });
    await waitFor(() => expect(screen.queryByTestId('shot-modal')).not.toBeInTheDocument());
    expect(shown()).toEqual(['To Eli', 'To Animation']);
  });

  it('both filters together, and none', async () => {
    renderBoard('/project/p1/dashboard/production?person=u2&team=tm2');
    await screen.findByRole('button', { name: 'A task to Sound' });
    expect(shown()).toEqual(['A task to Sound']);
    const user = userEvent.setup();
    await user.click(within(screen.getByLabelText('Filter by team')).getByRole('button'));
    fireEvent.mouseDown(screen.getByText('All teams'));
    await user.click(within(screen.getByLabelText('Filter by person')).getByRole('button'));
    fireEvent.mouseDown(screen.getByText('Everyone'));
    await waitFor(() => expect(shown()).toEqual(['To Eli', 'To Animation', 'A task to Ada', 'A task to Sound']));
    expect(where()).toBe('/project/p1/dashboard/production');
  });
});

describe('the board\'s columns', () => {
  const QA = { id: 'qa', name: 'QA', status: 'in_progress' as const };
  const heads = () => screen.getAllByLabelText(/^Column /).map(h => h.getAttribute('aria-label')!.replace('Column ', ''));

  it('adds a QA column in in_progress, renames it and moves it among the others', async () => {
    const add = vi.spyOn(production, 'addBoardColumn').mockResolvedValue([...COLUMNS, QA]);
    const rename = vi.spyOn(production, 'updateBoardColumn').mockResolvedValue([...COLUMNS, { ...QA, name: 'Quality' }]);
    const order = vi.spyOn(production, 'orderBoardColumns').mockResolvedValue([COLUMNS[0], COLUMNS[1], { ...QA, name: 'Quality' }, COLUMNS[2], COLUMNS[3]]);
    renderBoard();
    const user = userEvent.setup();
    await user.click(await screen.findByRole('button', { name: 'Add a column' }));
    await user.type(screen.getByLabelText('Name'), 'QA');
    // In in_progress unless told otherwise (the dialog's status, not the column of that name).
    expect(within(screen.getByText('Status', { selector: 'label' }).parentElement!).getByRole('button', { name: 'In Progress' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Add column/ }));
    await waitFor(() => expect(add).toHaveBeenCalledWith('p1', { name: 'QA', status: 'in_progress' }));
    expect(heads()).toEqual(['To Do', 'In Progress', 'Review', 'Done', 'QA']);

    await user.click(screen.getByRole('button', { name: 'QA' }));
    const input = screen.getByLabelText('Column name');
    await user.clear(input);
    await user.type(input, 'Quality{Enter}');
    await waitFor(() => expect(rename).toHaveBeenCalledWith('p1', 'qa', { name: 'Quality' }));
    expect(heads()).toContain('Quality');

    await user.click(screen.getByRole('button', { name: 'Quality column actions' }));
    expect(screen.getByRole('menuitem', { name: /Move right/ })).toBeDisabled();
    await user.click(screen.getByRole('menuitem', { name: /Move left/ }));
    await waitFor(() => expect(order).toHaveBeenCalledWith('p1', ['todo', 'in_progress', 'review', 'qa', 'done']));
    expect(heads()).toEqual(['To Do', 'In Progress', 'Quality', 'Review', 'Done']);
  });

  it("doesn't move a column again until its last move is saved", async () => {
    let answer!: (columns: typeof COLUMNS) => void;
    vi.spyOn(production, 'orderBoardColumns').mockImplementation(() => new Promise(resolve => { answer = resolve; }));
    renderBoard();
    const user = userEvent.setup();
    await user.click(await screen.findByRole('button', { name: 'Done column actions' }));
    await user.click(screen.getByRole('menuitem', { name: /Move left/ }));
    await user.click(screen.getByRole('button', { name: 'Done column actions' }));
    expect(screen.getByRole('menuitem', { name: /Move left/ })).toBeDisabled();
    expect(screen.getByRole('menuitem', { name: /Delete column/ })).toBeDisabled();
    answer([COLUMNS[0], COLUMNS[1], COLUMNS[3], COLUMNS[2]]);
    await waitFor(() => expect(screen.getByRole('menuitem', { name: /Move left/ })).toBeEnabled());
    expect(heads()).toEqual(['To Do', 'In Progress', 'Done', 'Review']);
  });

  it("a card moved to QA is in QA, with QA's status", async () => {
    vi.spyOn(production, 'getBoardColumns').mockResolvedValue([...COLUMNS, QA]);
    const update = vi.spyOn(production, 'updateShot').mockResolvedValue(shot({ columnId: 'qa', status: 'in_progress' }));
    renderBoard();
    const user = userEvent.setup();
    await user.click(await screen.findByRole('button', { name: 'List' }));
    await user.click(within(screen.getByLabelText('Column of SH010')).getByRole('button'));
    fireEvent.mouseDown(screen.getByText('QA', { selector: 'li' }));
    await waitFor(() => expect(update).toHaveBeenCalledWith('p1', 's1', { columnId: 'qa' }));
    await user.click(screen.getByRole('button', { name: 'Board' }));
    expect(within(cell('Opening', 'QA')).getByText('SH010')).toBeInTheDocument();
  });

  it('deleting a column with cards asks where to move them', async () => {
    vi.spyOn(production, 'getBoardColumns').mockResolvedValue([...COLUMNS, QA]);
    vi.spyOn(production, 'getShots').mockImplementation(async (_p, seqId) => (seqId === 'q1' ? [shot({ columnId: 'qa', status: 'in_progress' })] : []));
    const del = vi.spyOn(production, 'deleteBoardColumn').mockResolvedValue({ columns: COLUMNS, moved: 1 });
    renderBoard();
    const user = userEvent.setup();
    await user.click(await screen.findByRole('button', { name: 'QA column actions' }));
    await user.click(screen.getByRole('menuitem', { name: /Delete column/ }));
    expect(screen.getByText(/Its card will move to another column/)).toBeInTheDocument();
    // Another column of its status first.
    expect(within(screen.getByText('Move its cards to').parentElement!).getByRole('button', { name: 'In Progress (In Progress)' })).toBeInTheDocument();
    await user.click(within(screen.getByText('Move its cards to').parentElement!).getByRole('button'));
    fireEvent.mouseDown(screen.getByText('Review (Review)'));
    await user.click(screen.getByRole('button', { name: /Delete column/ }));
    await waitFor(() => expect(del).toHaveBeenCalledWith('p1', 'qa', 'review'));
    expect(heads()).toEqual(['To Do', 'In Progress', 'Review', 'Done']);
    expect(within(cell('Opening', 'Review')).getByText('SH010')).toBeInTheDocument();
  });

  it("can't delete the last column of a status", async () => {
    const del = vi.spyOn(production, 'deleteBoardColumn');
    renderBoard();
    const user = userEvent.setup();
    await user.click(await screen.findByRole('button', { name: 'Done column actions' }));
    await user.click(screen.getByRole('menuitem', { name: /Delete column/ }));
    expect(screen.getByText(/each status keeps at least one/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Delete column/ })).toBeDisabled();
    expect(del).not.toHaveBeenCalled();
  });
});

