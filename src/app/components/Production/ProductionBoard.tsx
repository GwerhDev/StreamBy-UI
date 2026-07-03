import s from './ProductionBoard.module.css';
import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faClipboardList, faPlus, faSpinner, faTableColumns, faList,
  faTrash, faEllipsisVertical,
} from '@fortawesome/free-solid-svg-icons';
import { SectionHeader } from '../SectionHeader/SectionHeader';
import { EmptyBackground } from '../Backgrounds/EmptyBackground';
import { ModalShell } from '../Modals/ModalShell';
import {
  getSequences, createSequence, deleteSequence,
  getShots, createShot, updateShot, deleteShot,
} from '../../../services/production';
import { ProductionSequence, ProductionShot, ShotStatus } from '../../../interfaces';
import { ShotPanel } from './ShotPanel';

type ViewMode = 'board' | 'list';

const STATUSES: ShotStatus[] = ['todo', 'in_progress', 'review', 'done'];

const STATUS_LABEL: Record<ShotStatus, string> = {
  todo: 'To Do',
  in_progress: 'In Progress',
  review: 'Review',
  done: 'Done',
};

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

export function ProductionBoard() {
  const { id: projectId = '' } = useParams<{ id: string }>();
  const [viewMode, setViewMode]     = useState<ViewMode>('board');
  const [sequences, setSequences]   = useState<ProductionSequence[]>([]);
  const [shots, setShots]           = useState<ProductionShot[]>([]);
  const [loading, setLoading]       = useState(true);
  const [selectedShot, setSelectedShot] = useState<ProductionShot | null>(null);

  // create sequence
  const [showCreateSeq, setShowCreateSeq] = useState(false);
  const [newSeqName, setNewSeqName]       = useState('');
  const [seqSaving, setSeqSaving]         = useState(false);

  // create shot
  const [createShotSeqId, setCreateShotSeqId] = useState<string | null>(null);
  const [newShotName, setNewShotName]          = useState('');
  const [shotSaving, setShotSaving]            = useState(false);

  // delete confirms
  const [deleteSeqId, setDeleteSeqId]   = useState<string | null>(null);
  const [deleteShotId, setDeleteShotId] = useState<string | null>(null);

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

  const handleCreateSequence = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSeqName.trim()) return;
    setSeqSaving(true);
    try {
      const seq = await createSequence(projectId, { name: newSeqName.trim(), order: sequences.length });
      setSequences(prev => [...prev, seq]);
      setNewSeqName('');
      setShowCreateSeq(false);
    } finally { setSeqSaving(false); }
  };

  const handleDeleteSequence = async (seqId: string) => {
    await deleteSequence(projectId, seqId);
    setSequences(prev => prev.filter(s => s.id !== seqId));
    setShots(prev => prev.filter(sh => sh.sequenceId !== seqId));
    if (selectedShot?.sequenceId === seqId) setSelectedShot(null);
    setDeleteSeqId(null);
  };

  const handleCreateShot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newShotName.trim() || !createShotSeqId) return;
    setShotSaving(true);
    try {
      const seqShots = shots.filter(sh => sh.sequenceId === createShotSeqId);
      const shot = await createShot(projectId, createShotSeqId, {
        name: newShotName.trim(), order: seqShots.length,
      });
      setShots(prev => [...prev, shot]);
      setNewShotName('');
      setCreateShotSeqId(null);
    } finally { setShotSaving(false); }
  };

  const handleDeleteShot = async (shotId: string) => {
    const shot = shots.find(sh => sh.id === shotId);
    if (!shot) return;
    await deleteShot(projectId, shotId);
    setShots(prev => prev.filter(sh => sh.id !== shotId));
    if (selectedShot?.id === shotId) setSelectedShot(null);
    setDeleteShotId(null);
  };

  const handleStatusChange = async (shot: ProductionShot, status: ShotStatus) => {
    setShots(prev => prev.map(sh => sh.id === shot.id ? { ...sh, status } : sh));
    try {
      await updateShot(projectId, shot.id, { status });
    } catch {
      setShots(prev => prev.map(sh => sh.id === shot.id ? shot : sh));
    }
  };

  const handleShotUpdate = (updated: ProductionShot) => {
    setShots(prev => prev.map(sh => sh.id === updated.id ? updated : sh));
    setSelectedShot(updated);
  };

  // ── render ─────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className={s.center}>
        <FontAwesomeIcon icon={faSpinner} spin className={s.spinner} />
      </div>
    );
  }

  const seqToDelete = sequences.find(s => s.id === deleteSeqId);
  const shotToDelete = shots.find(sh => sh.id === deleteShotId);

  return (
    <div className={s.container}>
      {/* Toolbar */}
      <div className={s.toolbar}>
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
              <button
                type="button"
                className={s.primaryBtn}
                onClick={() => { setShowCreateSeq(true); setNewSeqName(''); }}
              >
                <FontAwesomeIcon icon={faPlus} />
                New sequence
              </button>
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
            sequences={sequences}
            shots={shots}
            onSelectShot={setSelectedShot}
            onStatusChange={handleStatusChange}
            onAddShot={seqId => { setCreateShotSeqId(seqId); setNewShotName(''); }}
            onDeleteSeq={id => setDeleteSeqId(id)}
            onDeleteShot={id => setDeleteShotId(id)}
            selectedShotId={selectedShot?.id}
          />
        ) : (
          <ListView
            sequences={sequences}
            shots={shots}
            onSelectShot={setSelectedShot}
            onStatusChange={handleStatusChange}
            onAddShot={seqId => { setCreateShotSeqId(seqId); setNewShotName(''); }}
            onDeleteSeq={id => setDeleteSeqId(id)}
            onDeleteShot={id => setDeleteShotId(id)}
            selectedShotId={selectedShot?.id}
            statusChip={STATUS_CHIP}
            statusLabel={STATUS_LABEL}
          />
        )}
      </div>

      {/* Shot panel */}
      <div className={`${s.panelSlot} ${selectedShot ? s.panelSlotOpen : ''}`}>
        {selectedShot && (
          <ShotPanel
            shot={selectedShot}
            projectId={projectId}
            onClose={() => setSelectedShot(null)}
            onUpdate={handleShotUpdate}
            onDelete={id => setDeleteShotId(id)}
          />
        )}
      </div>

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
              <button type="submit" className={s.submitBtn} disabled={seqSaving || !newSeqName.trim()}>
                {seqSaving ? 'Creating…' : 'Create sequence'}
              </button>
              <button type="button" className={s.cancelBtn} onClick={() => setShowCreateSeq(false)}>
                Cancel
              </button>
            </div>
          </form>
        </ModalShell>
      )}

      {/* Create shot modal */}
      {createShotSeqId && (
        <ModalShell title="New shot" icon={faClipboardList} onClose={() => setCreateShotSeqId(null)}>
          <form onSubmit={handleCreateShot} className={s.form}>
            <label className={s.formLabel}>Name</label>
            <input
              autoFocus
              className={s.formInput}
              value={newShotName}
              onChange={e => setNewShotName(e.target.value)}
              placeholder="e.g. SH_010"
            />
            <div className={s.formActions}>
              <button type="submit" className={s.submitBtn} disabled={shotSaving || !newShotName.trim()}>
                {shotSaving ? 'Creating…' : 'Create shot'}
              </button>
              <button type="button" className={s.cancelBtn} onClick={() => setCreateShotSeqId(null)}>
                Cancel
              </button>
            </div>
          </form>
        </ModalShell>
      )}

      {/* Delete sequence confirm */}
      {deleteSeqId && seqToDelete && (
        <ModalShell title="Delete sequence" icon={faTrash} onClose={() => setDeleteSeqId(null)}>
          <div className={s.confirmBody}>
            <p className={s.confirmText}>
              Delete <strong>{seqToDelete.name}</strong>? All shots in this sequence will also be deleted.
            </p>
            <div className={s.formActions}>
              <button type="button" className={s.dangerBtn} onClick={() => handleDeleteSequence(deleteSeqId)}>
                Delete sequence
              </button>
              <button type="button" className={s.cancelBtn} onClick={() => setDeleteSeqId(null)}>
                Cancel
              </button>
            </div>
          </div>
        </ModalShell>
      )}

      {/* Delete shot confirm */}
      {deleteShotId && shotToDelete && (
        <ModalShell title="Delete shot" icon={faTrash} onClose={() => setDeleteShotId(null)}>
          <div className={s.confirmBody}>
            <p className={s.confirmText}>
              Delete <strong>{shotToDelete.name}</strong>? All tasks in this shot will also be deleted.
            </p>
            <div className={s.formActions}>
              <button type="button" className={s.dangerBtn} onClick={() => handleDeleteShot(deleteShotId)}>
                Delete shot
              </button>
              <button type="button" className={s.cancelBtn} onClick={() => setDeleteShotId(null)}>
                Cancel
              </button>
            </div>
          </div>
        </ModalShell>
      )}
    </div>
  );
}

// ── Board view ─────────────────────────────────────────────────────────────────

interface BoardProps {
  sequences: ProductionSequence[];
  shots: ProductionShot[];
  selectedShotId?: string;
  onSelectShot: (shot: ProductionShot) => void;
  onStatusChange: (shot: ProductionShot, status: ShotStatus) => void;
  onAddShot: (seqId: string) => void;
  onDeleteSeq: (id: string) => void;
  onDeleteShot: (id: string) => void;
}

function BoardView({ sequences, shots, selectedShotId, onSelectShot, onStatusChange, onAddShot, onDeleteSeq, onDeleteShot }: BoardProps) {
  return (
    <div className={s.board}>
      {STATUSES.map(status => (
        <div key={status} className={s.column}>
          <div className={s.colHead}>
            <span className={`${s.colDot} ${STATUS_COLOR[status]}`} />
            <span className={s.colLabel}>{STATUS_LABEL[status]}</span>
            <span className={s.colCount}>{shots.filter(sh => sh.status === status).length}</span>
          </div>
          <div className={s.colBody}>
            {sequences.map(seq => {
              const seqShots = shots.filter(sh => sh.sequenceId === seq.id && sh.status === status);
              if (seqShots.length === 0 && status !== 'todo') return null;
              return (
                <div key={seq.id} className={s.seqBlock}>
                  <div className={s.seqRow}>
                    <span className={s.seqName}>{seq.name}</span>
                    {status === 'todo' && (
                      <button
                        type="button"
                        className={s.seqDeleteBtn}
                        onClick={() => onDeleteSeq(seq.id)}
                        title="Delete sequence"
                      >
                        <FontAwesomeIcon icon={faTrash} />
                      </button>
                    )}
                  </div>
                  {seqShots.map(shot => (
                    <ShotCard
                      key={shot.id}
                      shot={shot}
                      selected={shot.id === selectedShotId}
                      onSelect={onSelectShot}
                      onStatusChange={onStatusChange}
                      onDelete={onDeleteShot}
                    />
                  ))}
                  {status === 'todo' && (
                    <button type="button" className={s.addShotBtn} onClick={() => onAddShot(seq.id)}>
                      <FontAwesomeIcon icon={faPlus} />
                      Add shot
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── List view ──────────────────────────────────────────────────────────────────

interface ListProps extends Omit<BoardProps, 'selectedShotId'> {
  selectedShotId?: string;
  statusChip: Record<ShotStatus, string>;
  statusLabel: Record<ShotStatus, string>;
}

function ListView({ sequences, shots, selectedShotId, onSelectShot, onStatusChange, onAddShot, onDeleteSeq, onDeleteShot, statusChip, statusLabel }: ListProps) {
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
              <button
                type="button"
                className={s.seqDeleteBtn}
                onClick={() => onDeleteSeq(seq.id)}
                title="Delete sequence"
              >
                <FontAwesomeIcon icon={faTrash} />
              </button>
            </div>
            {seqShots.map(shot => (
              <div
                key={shot.id}
                className={`${s.listRow} ${shot.id === selectedShotId ? s.listRowActive : ''}`}
                onClick={() => onSelectShot(shot)}
              >
                <span className={s.listShotName}>{shot.name}</span>
                <span onClick={e => e.stopPropagation()}>
                  <select
                    className={`${s.chip} ${statusChip[shot.status]}`}
                    value={shot.status}
                    onChange={e => onStatusChange(shot, e.target.value as ShotStatus)}
                  >
                    {STATUSES.map(st => <option key={st} value={st}>{statusLabel[st]}</option>)}
                  </select>
                </span>
                <span className={s.listDue}>
                  {shot.dueDate ? new Date(shot.dueDate).toLocaleDateString() : '—'}
                </span>
                <span onClick={e => e.stopPropagation()}>
                  <button
                    type="button"
                    className={s.rowDeleteBtn}
                    onClick={() => onDeleteShot(shot.id)}
                    title="Delete shot"
                  >
                    <FontAwesomeIcon icon={faTrash} />
                  </button>
                </span>
              </div>
            ))}
            <button type="button" className={s.listAddShot} onClick={() => onAddShot(seq.id)}>
              <FontAwesomeIcon icon={faPlus} /> Add shot
            </button>
          </div>
        );
      })}
    </div>
  );
}

// ── Shot card (board) ──────────────────────────────────────────────────────────

function ShotCard({ shot, selected, onSelect, onStatusChange, onDelete }: {
  shot: ProductionShot;
  selected: boolean;
  onSelect: (s: ProductionShot) => void;
  onStatusChange: (s: ProductionShot, status: ShotStatus) => void;
  onDelete: (id: string) => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div
      className={`${s.card} ${selected ? s.cardSelected : ''}`}
      onClick={() => onSelect(shot)}
    >
      <div className={s.cardTop}>
        <span className={s.cardName}>{shot.name}</span>
        <button
          type="button"
          className={s.cardMenuBtn}
          onClick={e => { e.stopPropagation(); setMenuOpen(v => !v); }}
        >
          <FontAwesomeIcon icon={faEllipsisVertical} />
        </button>
        {menuOpen && (
          <div className={s.cardMenu} onClick={e => e.stopPropagation()}>
            <button
              type="button"
              className={s.cardMenuDelete}
              onClick={() => { setMenuOpen(false); onDelete(shot.id); }}
            >
              <FontAwesomeIcon icon={faTrash} /> Delete shot
            </button>
          </div>
        )}
      </div>
      {shot.dueDate && (
        <span className={s.cardDue}>{new Date(shot.dueDate).toLocaleDateString()}</span>
      )}
      <div onClick={e => e.stopPropagation()}>
        <select
          className={`${s.chip} ${STATUS_CHIP[shot.status]}`}
          value={shot.status}
          onChange={e => { onStatusChange(shot, e.target.value as ShotStatus); }}
        >
          {STATUSES.map(st => <option key={st} value={st}>{STATUS_LABEL[st]}</option>)}
        </select>
      </div>
    </div>
  );
}
