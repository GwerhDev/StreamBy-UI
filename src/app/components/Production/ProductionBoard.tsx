import s from './ProductionBoard.module.css';
import { useEffect, useState, useCallback, FormEvent } from 'react';
import { useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCheck, faClipboardList, faPlus, faSpinner, faTableColumns, faList, faTrash, faPen, faXmark,
} from '@fortawesome/free-solid-svg-icons';
import {
  DndContext, DragEndEvent, DragOverlay, DragStartEvent, KeyboardSensor, PointerSensor,
  useDraggable, useDroppable, useSensor, useSensors,
} from '@dnd-kit/core';
import { AppDispatch, RootState } from '../../../store';
import { addApiResponse } from '../../../store/apiResponsesSlice';
import { useProjectMembers } from '../../../hooks/useProjectMembers';
import { useProjectTeams } from '../../../hooks/useProjectTeams';
import { SectionHeader } from '../SectionHeader/SectionHeader';
import { EmptyBackground } from '../Backgrounds/EmptyBackground';
import { ModalShell } from '../Modals/ModalShell';
import { MemberAvatar } from '../Cards/MemberAvatar';
import { DropdownInput } from '../Inputs/DropdownInput';
import { ActionButton } from '../Buttons/ActionButton';
import { PrimaryButton } from '../Buttons/PrimaryButton';
import { SecondaryButton } from '../Buttons/SecondaryButton';
import {
  getSequences, createSequence, updateSequence, deleteSequence,
  getShots, createShot, updateShot, deleteShot,
  getBoardColumns, addBoardColumn, updateBoardColumn, orderBoardColumns, deleteBoardColumn,
} from '../../../services/production';
import { BoardColumn, Member, ProductionSequence, ProductionShot, ShotStatus, TaskPriority, Team } from '../../../interfaces';
import { ShotModal } from './ShotModal';
import { AssetThumbnail } from './AssetThumbnail';
import { formatDueDate } from './dueDate';
import { EditSequenceModal } from './ProductionEditModals';
import { PRIORITY_LABEL, columnOfShot } from './shots';
import { AddColumnModal, ColumnHead, DeleteColumnModal } from './BoardColumns';
import { isAssignedTo, isAssignedToTeam } from './assignees';

type ViewMode = 'board' | 'list';

const STATUS_COLOR: Record<ShotStatus, string> = {
  todo:        s.dotTodo,
  in_progress: s.dotProgress,
  review:      s.dotReview,
  done:        s.dotDone,
};

const STATUS_CHIP: Record<ShotStatus, string> = {
  todo:        s.chipTodo,
  in_progress: s.chipProgress,
  review:      s.chipReview,
  done:        s.chipDone,
};

const PRIORITY_CHIP: Record<TaskPriority, string> = {
  low:    s.priorityLow,
  medium: s.priorityMedium,
  high:   s.priorityHigh,
};

// A cell of the board: a sequence's lane, in one of its columns.
const cellId = (seqId: string, columnId: string) => `${seqId}::${columnId}`;
const cellOf = (id: string) => {
  const [seqId, columnId] = id.split('::');
  return { seqId, columnId };
};

export function ProductionBoard() {
  const { id: projectId = '' } = useParams<{ id: string }>();
  const [viewMode, setViewMode]     = useState<ViewMode>('board');
  const [sequences, setSequences]   = useState<ProductionSequence[]>([]);
  const [shots, setShots]           = useState<ProductionShot[]>([]);
  const [columns, setColumns]       = useState<BoardColumn[]>([]);
  const [loading, setLoading]       = useState(true);
  const { members } = useProjectMembers(projectId);
  const { teams } = useProjectTeams(projectId);
  const userId = useSelector((state: RootState) => state.session.userId);

  // The shot open is in the URL (?shot=<id>): a link to it opens it, Back closes it.
  const [params, setParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const openShotId = params.get('shot');
  const selectedShot = shots.find(sh => sh.id === openShotId) ?? null;
  const openShot = (shot: ProductionShot) =>
    setParams(p => { p.set('shot', shot.id); return p; }, { state: { shotOpened: true } });
  const closeShot = useCallback(() => {
    // Opened from the board, closing it is going back; from a link, there's nothing to go back to.
    if ((location.state as { shotOpened?: boolean } | null)?.shotOpened) navigate(-1);
    else setParams(p => { p.delete('shot'); return p; }, { replace: true });
  }, [location.state, navigate, setParams]);

  // The board filtered by who its cards are assigned to (?person=me, or a member's id) and by a
  // team (?team=<id>), in the URL as the open card is.
  const person = params.get('person') ?? '';
  const team = params.get('team') ?? '';
  const setFilter = (key: 'person' | 'team', value: string) =>
    setParams(p => { if (value) p.set(key, value); else p.delete(key); return p; }, { replace: true });
  const personId = person === 'me' ? userId ?? '' : person;
  const visibleShots = shots.filter(shot =>
    (!personId || isAssignedTo(shot, personId, teams)) && (!team || isAssignedToTeam(shot, team)));
  const filtering = !!person || !!team;

  // create sequence
  const [showCreateSeq, setShowCreateSeq] = useState(false);
  const [newSeqName, setNewSeqName]       = useState('');
  const [seqSaving, setSeqSaving]         = useState(false);

  // edit sequence
  const [editSeqId, setEditSeqId]   = useState<string | null>(null);
  const [editSaving, setEditSaving] = useState(false);

  // columns: being added, being deleted, a change on its way
  const [addingColumn, setAddingColumn]   = useState(false);
  const [deleteColumnId, setDeleteColumnId] = useState<string | null>(null);
  const [columnSaving, setColumnSaving]   = useState(false);

  // delete confirms
  const [deleteSeqId, setDeleteSeqId]   = useState<string | null>(null);
  const [deleteShotId, setDeleteShotId] = useState<string | null>(null);
  const [deleting, setDeleting]         = useState(false);

  const dispatch = useDispatch<AppDispatch>();
  // A failed change says so, instead of leaving its dialog open with nothing shown.
  const failed = (err: unknown, fallback: string) =>
    dispatch(addApiResponse({ message: err instanceof Error && err.message ? err.message : fallback, type: 'error' }));

  const load = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    try {
      const [seqs, cols] = await Promise.all([getSequences(projectId), getBoardColumns(projectId)]);
      setSequences(seqs);
      setColumns(cols);
      const allShots = (await Promise.all(seqs.map(seq => getShots(projectId, seq.id)))).flat();
      setShots(allShots);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => { load(); }, [load]);

  // ── handlers ───────────────────────────────────────────────────────────────

  const handleCreateSequence = async (e: FormEvent) => {
    e.preventDefault();
    if (!newSeqName.trim()) return;
    setSeqSaving(true);
    try {
      const seq = await createSequence(projectId, { name: newSeqName.trim(), order: sequences.length });
      setSequences(prev => [...prev, seq]);
      setNewSeqName('');
      setShowCreateSeq(false);
    } catch (err) {
      failed(err, 'Failed to create the sequence.');
    } finally { setSeqSaving(false); }
  };

  const handleEditSequence = async (changes: Partial<ProductionSequence>) => {
    if (!editSeqId) return;
    setEditSaving(true);
    try {
      const updated = await updateSequence(projectId, editSeqId, changes as { name: string; description: string });
      setSequences(prev => prev.map(seq => (seq.id === updated.id ? updated : seq)));
      setEditSeqId(null);
    } catch (err) {
      failed(err, 'Failed to save the sequence.');
    } finally { setEditSaving(false); }
  };

  const handleDeleteSequence = async (seqId: string) => {
    setDeleting(true);
    try {
      await deleteSequence(projectId, seqId);
      setSequences(prev => prev.filter(s => s.id !== seqId));
      setShots(prev => prev.filter(sh => sh.sequenceId !== seqId));
      if (selectedShot?.sequenceId === seqId) closeShot();
      setDeleteSeqId(null);
    } catch (err) {
      failed(err, 'Failed to delete the sequence.');
    } finally { setDeleting(false); }
  };

  // A shot made in place, at the foot of its lane's cell: in that sequence, in that column.
  const handleCreateShot = async (seqId: string, columnId: string, name: string) => {
    try {
      const order = shots.filter(sh => sh.sequenceId === seqId).length;
      const shot = await createShot(projectId, seqId, { name, columnId, order });
      setShots(prev => [...prev, { ...shot, taskSummary: { done: 0, total: 0, priority: null } }]);
      return true;
    } catch (err) {
      failed(err, 'Failed to create the shot.');
      return false;
    }
  };

  const handleDeleteShot = async (shotId: string) => {
    const shot = shots.find(sh => sh.id === shotId);
    if (!shot) return;
    setDeleting(true);
    try {
      await deleteShot(projectId, shotId);
      if (selectedShot?.id === shotId) closeShot();
      setShots(prev => prev.filter(sh => sh.id !== shotId));
      setDeleteShotId(null);
    } catch (err) {
      failed(err, 'Failed to delete the shot.');
    } finally { setDeleting(false); }
  };

  // A card moved to a column, taking its status: at once; put back, told, if it can't be saved.
  const handleMove = async (shot: ProductionShot, columnId: string) => {
    const column = columns.find(c => c.id === columnId);
    if (!column || columnOfShot(columns, shot)?.id === columnId) return;
    setShots(prev => prev.map(sh => sh.id === shot.id ? { ...sh, columnId, status: column.status } : sh));
    try {
      await updateShot(projectId, shot.id, { columnId });
    } catch (err) {
      setShots(prev => prev.map(sh => sh.id === shot.id ? { ...sh, columnId: shot.columnId, status: shot.status } : sh));
      failed(err, 'Failed to move the shot.');
    }
  };

  // The board's columns: each change answers them as they are then.
  const changeColumns = async (change: () => Promise<BoardColumn[]>, fallback: string) => {
    setColumnSaving(true);
    try {
      setColumns(await change());
      return true;
    } catch (err) {
      failed(err, fallback);
      return false;
    } finally { setColumnSaving(false); }
  };
  const handleAddColumn = async (name: string, status: ShotStatus) => {
    if (await changeColumns(() => addBoardColumn(projectId, { name, status }), 'Failed to add the column.')) setAddingColumn(false);
  };
  const handleRenameColumn = (columnId: string, name: string) =>
    changeColumns(() => updateBoardColumn(projectId, columnId, { name }), 'Failed to rename the column.');
  const handleMoveColumn = (columnId: string, by: -1 | 1) => {
    if (columnSaving) return;
    const order = columns.map(c => c.id);
    const from = order.indexOf(columnId);
    const to = from + by;
    if (from < 0 || to < 0 || to >= order.length) return;
    [order[from], order[to]] = [order[to], order[from]];
    return changeColumns(() => orderBoardColumns(projectId, order), 'Failed to move the column.');
  };
  // Its cards, moved to another column, take that column's status: shown as the server has them.
  const handleDeleteColumn = async (columnId: string, moveTo?: string) => {
    setColumnSaving(true);
    try {
      const { columns: left, moved } = await deleteBoardColumn(projectId, columnId, moveTo);
      setColumns(left);
      if (moved && moveTo) {
        const target = left.find(c => c.id === moveTo);
        setShots(prev => prev.map(sh => (columnOfShot(columns, sh)?.id === columnId && target ? { ...sh, columnId: target.id, status: target.status } : sh)));
      }
      setDeleteColumnId(null);
    } catch (err) {
      failed(err, 'Failed to delete the column.');
    } finally { setColumnSaving(false); }
  };

  const handleShotUpdate = (updated: ProductionShot) => {
    setShots(prev => prev.map(sh => sh.id === updated.id ? updated : sh));
  };

  // ── render ─────────────────────────────────────────────────────────────────

  // Centered in the board's container, as the board fills it.
  if (loading) {
    return (
      <div className={s.container}>
        <div className={s.center}>
          <FontAwesomeIcon icon={faSpinner} spin className={s.spinner} />
        </div>
      </div>
    );
  }

  const seqToDelete = sequences.find(s => s.id === deleteSeqId);
  const seqToEdit = sequences.find(s => s.id === editSeqId);
  const shotToDelete = shots.find(sh => sh.id === deleteShotId);

  const columnToDelete = columns.find(c => c.id === deleteColumnId);

  const viewProps = {
    sequences, shots: visibleShots, columns, members, teams, projectId,
    onSelectShot: openShot,
    onMove: handleMove,
    onCreateShot: handleCreateShot,
    onDeleteSeq: (id: string) => setDeleteSeqId(id),
    onEditSeq: (id: string) => setEditSeqId(id),
  };

  return (
    <div className={s.container}>
      <div className={s.header}>
        <SectionHeader
          icon={faClipboardList}
          title="Production"
          subtitle={`${sequences.length} sequences · ${shots.length} shots${filtering ? ` · ${visibleShots.length} shown` : ''}`}
          action={
            <div className={s.toolbarActions}>
              <div className={s.filter} aria-label="Filter by person">
                <DropdownInput
                  value={person}
                  onChange={v => setFilter('person', v)}
                  options={[
                    { value: '', label: 'Everyone' },
                    { value: 'me', label: 'Assigned to me' },
                    ...members.map(m => ({ value: m.userId, label: m.username })),
                  ]}
                />
              </div>
              <div className={s.filter} aria-label="Filter by team">
                <DropdownInput
                  value={team}
                  onChange={v => setFilter('team', v)}
                  options={[{ value: '', label: 'All teams' }, ...teams.map(t => ({ value: t.id, label: t.name }))]}
                />
              </div>
              <div className={s.viewToggle}>
                <button
                  type="button"
                  className={`${s.viewBtn} ${viewMode === 'board' ? s.viewBtnActive : ''}`}
                  onClick={() => setViewMode('board')}
                >
                  <FontAwesomeIcon icon={faTableColumns} />
                  Board
                </button>
                <button
                  type="button"
                  className={`${s.viewBtn} ${viewMode === 'list' ? s.viewBtnActive : ''}`}
                  onClick={() => setViewMode('list')}
                >
                  <FontAwesomeIcon icon={faList} />
                  List
                </button>
              </div>
              <ActionButton icon={faPlus} text="New sequence" onClick={() => { setShowCreateSeq(true); setNewSeqName(''); }} />
            </div>
          }
        />
      </div>

      {/* Content */}
      <div className={s.content}>
        {sequences.length === 0 ? (
          <div className={s.emptyWrap}><EmptyBackground /></div>
        ) : viewMode === 'board' ? (
          <BoardView
            {...viewProps}
            columnSaving={columnSaving}
            onAddColumn={() => setAddingColumn(true)}
            onRenameColumn={handleRenameColumn}
            onMoveColumn={handleMoveColumn}
            onDeleteColumn={id => setDeleteColumnId(id)}
          />
        ) : (
          <ListView {...viewProps} onDeleteShot={id => setDeleteShotId(id)} />
        )}
      </div>

      {/* The shot open */}
      {selectedShot && (
        <ShotModal
          key={selectedShot.id}
          shot={selectedShot}
          sequence={sequences.find(seq => seq.id === selectedShot.sequenceId)}
          projectId={projectId}
          members={members}
          teams={teams}
          columns={columns}
          onClose={closeShot}
          onUpdate={handleShotUpdate}
          onDelete={id => setDeleteShotId(id)}
          closeOnEscape={!deleteShotId}
        />
      )}

      {/* Columns */}
      {addingColumn && (
        <AddColumnModal saving={columnSaving} onSave={handleAddColumn} onClose={() => setAddingColumn(false)} />
      )}
      {columnToDelete && (
        <DeleteColumnModal
          column={columnToDelete} columns={columns} saving={columnSaving}
          count={shots.filter(sh => columnOfShot(columns, sh)?.id === columnToDelete.id).length}
          onDelete={moveTo => handleDeleteColumn(columnToDelete.id, moveTo)}
          onClose={() => setDeleteColumnId(null)}
        />
      )}

      {/* Create sequence modal */}
      {showCreateSeq && (
        <ModalShell title="New sequence" icon={faClipboardList} onClose={() => setShowCreateSeq(false)}>
          <form onSubmit={handleCreateSequence} className={s.form}>
            <label className={s.formLabel}>Name</label>
            <input
              autoFocus
              className={s.formInput}
              value={newSeqName}
              onChange={e => setNewSeqName(e.target.value)}
              placeholder="e.g. Act 1 — Intro"
            />
            <div className={s.formActions}>
              <ActionButton type="submit" icon={faPlus} text={seqSaving ? 'Creating…' : 'Create sequence'} disabled={seqSaving || !newSeqName.trim()} />
              <SecondaryButton icon={faXmark} text="Cancel" onClick={() => setShowCreateSeq(false)} />
            </div>
          </form>
        </ModalShell>
      )}

      {/* Edit sequence */}
      {editSeqId && seqToEdit && (
        <EditSequenceModal sequence={seqToEdit} saving={editSaving} onSave={handleEditSequence} onClose={() => setEditSeqId(null)} />
      )}

      {/* Delete sequence confirm */}
      {deleteSeqId && seqToDelete && (
        <ModalShell title="Delete sequence" icon={faTrash} onClose={() => setDeleteSeqId(null)}>
          <div className={s.confirmBody}>
            <p className={s.confirmText}>
              Delete <strong>{seqToDelete.name}</strong>? All shots in this sequence, and their tasks, will also be deleted.
            </p>
            <div className={s.formActions}>
              <PrimaryButton icon={faTrash} text={deleting ? 'Deleting…' : 'Delete sequence'} disabled={deleting} onClick={() => handleDeleteSequence(deleteSeqId)} />
              <SecondaryButton icon={faXmark} text="Cancel" onClick={() => setDeleteSeqId(null)} />
            </div>
          </div>
        </ModalShell>
      )}

      {/* Delete shot confirm (over the shot's modal) */}
      {deleteShotId && shotToDelete && (
        <ModalShell title="Delete shot" icon={faTrash} onClose={() => setDeleteShotId(null)}>
          <div className={s.confirmBody}>
            <p className={s.confirmText}>
              Delete <strong>{shotToDelete.name}</strong>? All tasks in this shot will also be deleted.
            </p>
            <div className={s.formActions}>
              <PrimaryButton icon={faTrash} text={deleting ? 'Deleting…' : 'Delete shot'} disabled={deleting} onClick={() => handleDeleteShot(deleteShotId)} />
              <SecondaryButton icon={faXmark} text="Cancel" onClick={() => setDeleteShotId(null)} />
            </div>
          </div>
        </ModalShell>
      )}
    </div>
  );
}

interface ViewProps {
  sequences: ProductionSequence[];
  shots: ProductionShot[];
  columns: BoardColumn[];
  members: Member[];
  teams: Team[];
  projectId: string;
  onSelectShot: (shot: ProductionShot) => void;
  onMove: (shot: ProductionShot, columnId: string) => void;
  onCreateShot: (seqId: string, columnId: string, name: string) => Promise<boolean>;
  onDeleteSeq: (id: string) => void;
  onEditSeq: (id: string) => void;
}

// ── Board view ─────────────────────────────────────────────────────────────────
// Its columns, each in one of the statuses, and a lane per sequence; a card dragged to another
// column takes its status.

interface ColumnActions {
  columnSaving: boolean;
  onAddColumn: () => void;
  onRenameColumn: (columnId: string, name: string) => void;
  onMoveColumn: (columnId: string, by: -1 | 1) => void;
  onDeleteColumn: (columnId: string) => void;
}

function BoardView({
  sequences, shots, columns, members, teams, projectId, onSelectShot, onMove, onCreateShot, onDeleteSeq, onEditSeq,
  columnSaving, onAddColumn, onRenameColumn, onMoveColumn, onDeleteColumn,
}: ViewProps & ColumnActions) {
  const [dragging, setDragging] = useState<ProductionShot | null>(null);
  // A press that moves is a drag; one that doesn't, a click (opens the card). From the keyboard,
  // Space picks a card up and Enter opens it.
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { keyboardCodes: { start: ['Space'], cancel: ['Escape'], end: ['Space', 'Enter'] } }),
  );

  const onDragStart = ({ active }: DragStartEvent) => setDragging(shots.find(sh => sh.id === active.id) ?? null);
  const onDragEnd = ({ active, over }: DragEndEvent) => {
    setDragging(null);
    const shot = shots.find(sh => sh.id === active.id);
    if (!shot || !over) return;
    const { seqId, columnId } = cellOf(String(over.id));
    // Across columns only: its sequence is its lane, not something a drag changes.
    if (seqId === shot.sequenceId) onMove(shot, columnId);
  };

  return (
    <DndContext sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd} onDragCancel={() => setDragging(null)}>
      <div className={s.board}>
        <div className={s.boardHead}>
          {columns.map((column, i) => (
            <div key={column.id} className={s.column}>
              <ColumnHead
                column={column}
                count={shots.filter(sh => columnOfShot(columns, sh)?.id === column.id).length}
                dotClassName={STATUS_COLOR[column.status]}
                canMoveLeft={i > 0}
                canMoveRight={i < columns.length - 1}
                busy={columnSaving}
                onRename={name => onRenameColumn(column.id, name)}
                onMove={by => onMoveColumn(column.id, by)}
                onDelete={() => onDeleteColumn(column.id)}
              />
            </div>
          ))}
          <button type="button" className={s.addColumn} onClick={onAddColumn} aria-label="Add a column" title="Add a column">
            <FontAwesomeIcon icon={faPlus} />
          </button>
        </div>

        {sequences.map(seq => {
          const seqShots = shots.filter(sh => sh.sequenceId === seq.id);
          return (
            <section key={seq.id} className={s.lane} aria-label={seq.name}>
              <div className={s.laneHead}>
                <span className={s.laneName}>{seq.name}</span>
                <span className={s.colCount}>{seqShots.length}</span>
                <button type="button" className={s.seqEditBtn} onClick={() => onEditSeq(seq.id)} title="Edit sequence">
                  <FontAwesomeIcon icon={faPen} />
                </button>
                <button type="button" className={s.seqDeleteBtn} onClick={() => onDeleteSeq(seq.id)} title="Delete sequence">
                  <FontAwesomeIcon icon={faTrash} />
                </button>
              </div>
              <div className={s.laneCells}>
                {columns.map(column => (
                  <BoardCell key={column.id} id={cellId(seq.id, column.id)} label={`${seq.name}, ${column.name}`} accepts={!dragging || dragging.sequenceId === seq.id}>
                    {seqShots.filter(sh => columnOfShot(columns, sh)?.id === column.id).map(shot => (
                      <ShotCard key={shot.id} shot={shot} members={members} teams={teams} projectId={projectId} onSelect={onSelectShot} />
                    ))}
                    <InlineCreate label={`Create a shot in ${seq.name}, ${column.name}`} onCreate={name => onCreateShot(seq.id, column.id, name)} />
                  </BoardCell>
                ))}
                <span className={s.addColumnSpace} aria-hidden="true" />
              </div>
            </section>
          );
        })}
      </div>
      <DragOverlay dropAnimation={null}>
        {dragging && <CardBody shot={dragging} members={members} teams={teams} projectId={projectId} />}
      </DragOverlay>
    </DndContext>
  );
}

function BoardCell({ id, label, accepts, children }: { id: string; label: string; accepts: boolean; children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id, disabled: !accepts });
  return (
    <div ref={setNodeRef} className={`${s.cell} ${isOver ? s.cellOver : ''}`} data-testid={`cell-${id}`} aria-label={label}>
      {children}
    </div>
  );
}

// ── Shot card (board) ──────────────────────────────────────────────────────────

function ShotCard({ shot, members, teams, projectId, onSelect }: {
  shot: ProductionShot;
  members: Member[];
  teams: Team[];
  projectId: string;
  onSelect: (shot: ProductionShot) => void;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: shot.id });
  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      className={`${s.card} ${isDragging ? s.cardDragging : ''}`}
      aria-label={shot.name}
      onClick={() => onSelect(shot)}
      onKeyDown={e => {
        if (e.key === 'Enter') onSelect(shot);
        else listeners?.onKeyDown?.(e);
      }}
    >
      <CardBody shot={shot} members={members} teams={teams} projectId={projectId} />
    </div>
  );
}

// What a card shows: its name, its asset, its tasks' top priority and how they go, its due
// date, and who it's assigned to: people and teams.
function CardBody({ shot, members, teams, projectId }: { shot: ProductionShot; members: Member[]; teams: Team[]; projectId: string }) {
  const summary = shot.taskSummary;
  const assignees = members.filter(m => shot.assignedTo.includes(m.userId));
  const assignedTeams = teams.filter(t => (shot.teamIds ?? []).includes(t.id));
  return (
    <div className={s.cardBody}>
      {shot.assetId && <AssetThumbnail projectId={projectId} assetId={shot.assetId} className={s.cardThumb} />}
      <span className={s.cardName}>{shot.name}</span>
      <div className={s.cardMeta}>
        {summary?.priority && (
          <span className={`${s.priority} ${PRIORITY_CHIP[summary.priority]}`} title="Top priority of its open tasks">
            {PRIORITY_LABEL[summary.priority]}
          </span>
        )}
        {!!summary?.total && (
          <span className={`${s.progress} ${summary.done === summary.total ? s.progressDone : ''}`} title="Tasks done">
            <FontAwesomeIcon icon={faCheck} /> {summary.done}/{summary.total}
          </span>
        )}
        {shot.dueDate && <span className={s.cardDue}>{formatDueDate(shot.dueDate)}</span>}
        <span className={s.cardAvatars}>
          {assignees.slice(0, 3).map(m => <MemberAvatar key={m.userId} username={m.username} profilePic={m.profilePic} size="small" />)}
          {assignees.length > 3 && <span className={s.moreAvatars}>+{assignees.length - 3}</span>}
        </span>
      </div>
      {assignedTeams.length > 0 && (
        <div className={s.cardTeams}>
          {assignedTeams.map(t => <span key={t.id} className={s.teamChip}>{t.name}</span>)}
        </div>
      )}
    </div>
  );
}

// "+ Create" at the foot of a cell: a name typed in place makes a shot, and another can follow.
function InlineCreate({ label, onCreate }: { label: string; onCreate: (name: string) => Promise<boolean> }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim() || saving) return;
    setSaving(true);
    if (await onCreate(name.trim())) setName('');
    setSaving(false);
  };

  if (!open) {
    return (
      <button type="button" className={s.addShotBtn} onClick={() => setOpen(true)} aria-label={label}>
        <FontAwesomeIcon icon={faPlus} /> Create
      </button>
    );
  }
  return (
    <form onSubmit={submit} className={s.inlineCreate}>
      <input
        autoFocus
        aria-label="New shot name"
        className={s.inlineInput}
        value={name}
        disabled={saving}
        placeholder="e.g. SH_010"
        onChange={e => setName(e.target.value)}
        onBlur={() => { if (!name.trim()) setOpen(false); }}
        onKeyDown={e => { if (e.key === 'Escape') { setName(''); setOpen(false); } }}
      />
    </form>
  );
}

// ── List view ──────────────────────────────────────────────────────────────────

function ListView({ sequences, shots, columns, onSelectShot, onMove, onCreateShot, onDeleteSeq, onEditSeq, onDeleteShot }: ViewProps & { onDeleteShot: (id: string) => void }) {
  return (
    <div className={s.list}>
      <div className={s.listHead}>
        <span>Shot</span>
        <span>Column</span>
        <span>Due</span>
        <span />
      </div>
      {sequences.map(seq => {
        const seqShots = shots.filter(sh => sh.sequenceId === seq.id);
        return (
          <div key={seq.id} className={s.listGroup}>
            <div className={s.listSeqRow}>
              <span className={s.listSeqName}>{seq.name}</span>
              <button type="button" className={s.seqEditBtn} onClick={() => onEditSeq(seq.id)} title="Edit sequence">
                <FontAwesomeIcon icon={faPen} />
              </button>
              <button type="button" className={s.seqDeleteBtn} onClick={() => onDeleteSeq(seq.id)} title="Delete sequence">
                <FontAwesomeIcon icon={faTrash} />
              </button>
            </div>
            {seqShots.map(shot => (
              <div key={shot.id} className={s.listRow} onClick={() => onSelectShot(shot)}>
                <span className={s.listShotName}>{shot.name}</span>
                <span className={`${s.listStatus} ${STATUS_CHIP[shot.status]}`} onClick={e => e.stopPropagation()} aria-label={`Column of ${shot.name}`}>
                  <DropdownInput
                    value={columnOfShot(columns, shot)?.id ?? ''}
                    options={columns.map(c => ({ value: c.id, label: c.name }))}
                    onChange={v => onMove(shot, v)}
                  />
                </span>
                <span className={s.listDue}>
                  {shot.dueDate ? formatDueDate(shot.dueDate) : '—'}
                </span>
                <span onClick={e => e.stopPropagation()}>
                  <button type="button" className={s.rowDeleteBtn} onClick={() => onDeleteShot(shot.id)} title="Delete shot">
                    <FontAwesomeIcon icon={faTrash} />
                  </button>
                </span>
              </div>
            ))}
            <div className={s.listCreate}>
              <InlineCreate label={`Create a shot in ${seq.name}`} onCreate={name => onCreateShot(seq.id, columns[0]?.id ?? 'todo', name)} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
