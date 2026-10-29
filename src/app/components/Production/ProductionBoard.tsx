import s from './ProductionBoard.module.css';
import { useEffect, useState, useCallback, FormEvent } from 'react';
import { useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCheck, faClipboardList, faPlus, faSpinner, faTableColumns, faList, faTrash, faPen, faXmark,
} from '@fortawesome/free-solid-svg-icons';
import {
  DndContext, DragEndEvent, DragOverlay, DragStartEvent, KeyboardSensor, PointerSensor,
  useDraggable, useDroppable, useSensor, useSensors,
} from '@dnd-kit/core';
import { AppDispatch } from '../../../store';
import { addApiResponse } from '../../../store/apiResponsesSlice';
import { useProjectMembers } from '../../../hooks/useProjectMembers';
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
} from '../../../services/production';
import { Member, ProductionSequence, ProductionShot, ShotStatus, TaskPriority } from '../../../interfaces';
import { ShotModal } from './ShotModal';
import { AssetThumbnail } from './AssetThumbnail';
import { formatDueDate } from './dueDate';
import { EditSequenceModal } from './ProductionEditModals';
import { PRIORITY_LABEL, STATUSES, STATUS_LABEL } from './shots';

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

// A cell of the board: a sequence's lane, in a status's column.
const cellId = (seqId: string, status: ShotStatus) => `${seqId}::${status}`;
const cellOf = (id: string) => {
  const [seqId, status] = id.split('::');
  return { seqId, status: status as ShotStatus };
};

export function ProductionBoard() {
  const { id: projectId = '' } = useParams<{ id: string }>();
  const [viewMode, setViewMode]     = useState<ViewMode>('board');
  const [sequences, setSequences]   = useState<ProductionSequence[]>([]);
  const [shots, setShots]           = useState<ProductionShot[]>([]);
  const [loading, setLoading]       = useState(true);
  const { members } = useProjectMembers(projectId);

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

  // create sequence
  const [showCreateSeq, setShowCreateSeq] = useState(false);
  const [newSeqName, setNewSeqName]       = useState('');
  const [seqSaving, setSeqSaving]         = useState(false);

  // edit sequence
  const [editSeqId, setEditSeqId]   = useState<string | null>(null);
  const [editSaving, setEditSaving] = useState(false);

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
      const seqs = await getSequences(projectId);
      setSequences(seqs);
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

  // A shot made in place, at the foot of its lane's cell: in that sequence, with that status.
  const handleCreateShot = async (seqId: string, status: ShotStatus, name: string) => {
    try {
      const order = shots.filter(sh => sh.sequenceId === seqId).length;
      const shot = await createShot(projectId, seqId, { name, status, order });
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

  // Moved at once; put back, told, if it can't be saved.
  const handleStatusChange = async (shot: ProductionShot, status: ShotStatus) => {
    if (shot.status === status) return;
    setShots(prev => prev.map(sh => sh.id === shot.id ? { ...sh, status } : sh));
    try {
      await updateShot(projectId, shot.id, { status });
    } catch (err) {
      setShots(prev => prev.map(sh => sh.id === shot.id ? { ...sh, status: shot.status } : sh));
      failed(err, "Failed to change the shot's status.");
    }
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

  const viewProps = {
    sequences, shots, members, projectId,
    onSelectShot: openShot,
    onStatusChange: handleStatusChange,
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
          subtitle={`${sequences.length} sequences · ${shots.length} shots`}
          action={
            <div className={s.toolbarActions}>
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
          <BoardView {...viewProps} />
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
          onClose={closeShot}
          onUpdate={handleShotUpdate}
          onDelete={id => setDeleteShotId(id)}
          closeOnEscape={!deleteShotId}
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
  members: Member[];
  projectId: string;
  onSelectShot: (shot: ProductionShot) => void;
  onStatusChange: (shot: ProductionShot, status: ShotStatus) => void;
  onCreateShot: (seqId: string, status: ShotStatus, name: string) => Promise<boolean>;
  onDeleteSeq: (id: string) => void;
  onEditSeq: (id: string) => void;
}

// ── Board view ─────────────────────────────────────────────────────────────────
// A column per status, a lane per sequence; a card dragged to another column takes its status.

function BoardView({ sequences, shots, members, projectId, onSelectShot, onStatusChange, onCreateShot, onDeleteSeq, onEditSeq }: ViewProps) {
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
    const { seqId, status } = cellOf(String(over.id));
    // Across columns only: its sequence is its lane, not something a drag changes.
    if (seqId === shot.sequenceId) onStatusChange(shot, status);
  };

  return (
    <DndContext sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd} onDragCancel={() => setDragging(null)}>
      <div className={s.board}>
        <div className={s.boardHead}>
          {STATUSES.map(status => (
            <div key={status} className={s.colHead}>
              <span className={`${s.colDot} ${STATUS_COLOR[status]}`} />
              <span className={s.colLabel}>{STATUS_LABEL[status]}</span>
              <span className={s.colCount}>{shots.filter(sh => sh.status === status).length}</span>
            </div>
          ))}
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
                {STATUSES.map(status => (
                  <BoardCell key={status} id={cellId(seq.id, status)} label={`${seq.name}, ${STATUS_LABEL[status]}`} accepts={!dragging || dragging.sequenceId === seq.id}>
                    {seqShots.filter(sh => sh.status === status).map(shot => (
                      <ShotCard key={shot.id} shot={shot} members={members} projectId={projectId} onSelect={onSelectShot} />
                    ))}
                    <InlineCreate label={`Create a shot in ${seq.name}, ${STATUS_LABEL[status]}`} onCreate={name => onCreateShot(seq.id, status, name)} />
                  </BoardCell>
                ))}
              </div>
            </section>
          );
        })}
      </div>
      <DragOverlay dropAnimation={null}>
        {dragging && <CardBody shot={dragging} members={members} projectId={projectId} />}
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

function ShotCard({ shot, members, projectId, onSelect }: {
  shot: ProductionShot;
  members: Member[];
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
      <CardBody shot={shot} members={members} projectId={projectId} />
    </div>
  );
}

// What a card shows: its name, its asset, its tasks' top priority and how they go, its due
// date, and who it's assigned to.
function CardBody({ shot, members, projectId }: { shot: ProductionShot; members: Member[]; projectId: string }) {
  const summary = shot.taskSummary;
  const assignees = members.filter(m => shot.assignedTo.includes(m.userId));
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

function ListView({ sequences, shots, onSelectShot, onStatusChange, onCreateShot, onDeleteSeq, onEditSeq, onDeleteShot }: ViewProps & { onDeleteShot: (id: string) => void }) {
  return (
    <div className={s.list}>
      <div className={s.listHead}>
        <span>Shot</span>
        <span>Status</span>
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
                <span className={`${s.listStatus} ${STATUS_CHIP[shot.status]}`} onClick={e => e.stopPropagation()} aria-label={`Status of ${shot.name}`}>
                  <DropdownInput
                    value={shot.status}
                    options={STATUSES.map(st => ({ value: st, label: STATUS_LABEL[st] }))}
                    onChange={v => onStatusChange(shot, v as ShotStatus)}
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
              <InlineCreate label={`Create a shot in ${seq.name}`} onCreate={name => onCreateShot(seq.id, 'todo', name)} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
