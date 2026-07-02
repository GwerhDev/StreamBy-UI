import s from './ProductionBoard.module.css';
import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faClipboardList, faPlus, faSpinner, faTableColumns, faList,
  faChevronRight, faChevronDown,
} from '@fortawesome/free-solid-svg-icons';
import { SectionHeader } from '../SectionHeader/SectionHeader';
import { EmptyBackground } from '../Backgrounds/EmptyBackground';
import { ModalShell } from '../Modals/ModalShell';
import {
  getSequences, createSequence, getShots, createShot, updateShot,
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

const STATUS_CLASS: Record<ShotStatus, string> = {
  todo: s.statusTodo,
  in_progress: s.statusInProgress,
  review: s.statusReview,
  done: s.statusDone,
};

export function ProductionBoard() {
  const { id: projectId = '' } = useParams<{ id: string }>();
  const [viewMode, setViewMode] = useState<ViewMode>('board');
  const [sequences, setSequences] = useState<ProductionSequence[]>([]);
  const [shots, setShots] = useState<ProductionShot[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedShot, setSelectedShot] = useState<ProductionShot | null>(null);
  const [collapsedSeqs, setCollapsedSeqs] = useState<Set<string>>(new Set());

  // Create sequence modal
  const [showCreateSeq, setShowCreateSeq] = useState(false);
  const [newSeqName, setNewSeqName] = useState('');
  const [seqSaving, setSeqSaving] = useState(false);

  // Create shot modal
  const [showCreateShot, setShowCreateShot] = useState<string | null>(null); // seqId
  const [newShotName, setNewShotName] = useState('');
  const [shotSaving, setShotSaving] = useState(false);

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

  const handleCreateSequence = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSeqName.trim()) return;
    setSeqSaving(true);
    try {
      const seq = await createSequence(projectId, { name: newSeqName.trim(), order: sequences.length });
      setSequences(prev => [...prev, seq]);
      setNewSeqName('');
      setShowCreateSeq(false);
    } finally {
      setSeqSaving(false);
    }
  };

  const handleCreateShot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newShotName.trim() || !showCreateShot) return;
    setShotSaving(true);
    try {
      const seqShots = shots.filter(sh => sh.sequenceId === showCreateShot);
      const shot = await createShot(projectId, showCreateShot, {
        name: newShotName.trim(),
        order: seqShots.length,
      });
      setShots(prev => [...prev, shot]);
      setNewShotName('');
      setShowCreateShot(null);
    } finally {
      setShotSaving(false);
    }
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

  const toggleSeq = (seqId: string) => {
    setCollapsedSeqs(prev => {
      const next = new Set(prev);
      if (next.has(seqId)) next.delete(seqId);
      else next.add(seqId);
      return next;
    });
  };

  if (loading) {
    return (
      <div className={s.center}>
        <FontAwesomeIcon icon={faSpinner} spin className={s.spinner} />
      </div>
    );
  }

  return (
    <div className={s.container}>
      <div className={s.header}>
        <SectionHeader
          icon={faClipboardList}
          title="Production Board"
          subtitle="Sequences, shots and tasks for this project."
          action={
            <div className={s.headerActions}>
              <button
                type="button"
                className={`${s.viewBtn} ${viewMode === 'board' ? s.viewBtnActive : ''}`}
                onClick={() => setViewMode('board')}
              >
                <FontAwesomeIcon icon={faTableColumns} /> Board
              </button>
              <button
                type="button"
                className={`${s.viewBtn} ${viewMode === 'list' ? s.viewBtnActive : ''}`}
                onClick={() => setViewMode('list')}
              >
                <FontAwesomeIcon icon={faList} /> List
              </button>
              <button type="button" className={s.addSeqBtn} onClick={() => setShowCreateSeq(true)}>
                <FontAwesomeIcon icon={faPlus} /> New sequence
              </button>
            </div>
          }
        />
      </div>

      {sequences.length === 0 ? (
        <div className={s.emptyWrap}><EmptyBackground /></div>
      ) : viewMode === 'board' ? (
        <BoardView
          sequences={sequences}
          shots={shots}
          collapsedSeqs={collapsedSeqs}
          onToggleSeq={toggleSeq}
          onSelectShot={setSelectedShot}
          onStatusChange={handleStatusChange}
          onAddShot={seqId => { setShowCreateShot(seqId); setNewShotName(''); }}
        />
      ) : (
        <ListView
          sequences={sequences}
          shots={shots}
          onSelectShot={setSelectedShot}
          onStatusChange={handleStatusChange}
          onAddShot={seqId => { setShowCreateShot(seqId); setNewShotName(''); }}
        />
      )}

      {/* Shot detail panel */}
      <div className={`${s.shotPanelSlot} ${selectedShot ? s.shotPanelOpen : ''}`}>
        {selectedShot && (
          <ShotPanel
            shot={selectedShot}
            projectId={projectId}
            onClose={() => setSelectedShot(null)}
            onUpdate={handleShotUpdate}
          />
        )}
      </div>

      {/* Create sequence modal */}
      {showCreateSeq && (
        <ModalShell title="New Sequence" icon={faClipboardList} onClose={() => setShowCreateSeq(false)}>
          <form onSubmit={handleCreateSequence} className={s.modalForm}>
            <input
              autoFocus
              className={s.modalInput}
              value={newSeqName}
              onChange={e => setNewSeqName(e.target.value)}
              placeholder="Sequence name"
            />
            <div className={s.modalActions}>
              <button type="submit" className={s.modalSubmit} disabled={seqSaving || !newSeqName.trim()}>
                {seqSaving ? 'Creating…' : 'Create'}
              </button>
              <button type="button" className={s.modalCancel} onClick={() => setShowCreateSeq(false)}>
                Cancel
              </button>
            </div>
          </form>
        </ModalShell>
      )}

      {/* Create shot modal */}
      {showCreateShot && (
        <ModalShell title="New Shot" icon={faClipboardList} onClose={() => setShowCreateShot(null)}>
          <form onSubmit={handleCreateShot} className={s.modalForm}>
            <input
              autoFocus
              className={s.modalInput}
              value={newShotName}
              onChange={e => setNewShotName(e.target.value)}
              placeholder="Shot name"
            />
            <div className={s.modalActions}>
              <button type="submit" className={s.modalSubmit} disabled={shotSaving || !newShotName.trim()}>
                {shotSaving ? 'Creating…' : 'Create'}
              </button>
              <button type="button" className={s.modalCancel} onClick={() => setShowCreateShot(null)}>
                Cancel
              </button>
            </div>
          </form>
        </ModalShell>
      )}
    </div>
  );
}

// ── Board view ─────────────────────────────────────────────────────────────────

interface BoardViewProps {
  sequences: ProductionSequence[];
  shots: ProductionShot[];
  collapsedSeqs: Set<string>;
  onToggleSeq: (id: string) => void;
  onSelectShot: (shot: ProductionShot) => void;
  onStatusChange: (shot: ProductionShot, status: ShotStatus) => void;
  onAddShot: (seqId: string) => void;
}

function BoardView({ sequences, shots, collapsedSeqs, onToggleSeq, onSelectShot, onStatusChange, onAddShot }: BoardViewProps) {
  return (
    <div className={s.board}>
      {STATUSES.map(status => (
        <div key={status} className={s.column}>
          <div className={s.columnHeader}>
            <span className={`${s.columnDot} ${STATUS_CLASS[status]}`} />
            <span className={s.columnLabel}>{STATUS_LABEL[status]}</span>
            <span className={s.columnCount}>{shots.filter(sh => sh.status === status).length}</span>
          </div>
          <div className={s.columnBody}>
            {sequences.map(seq => {
              const seqShots = shots.filter(sh => sh.sequenceId === seq.id && sh.status === status);
              if (seqShots.length === 0 && status !== 'todo') return null;
              const collapsed = collapsedSeqs.has(seq.id);
              return (
                <div key={seq.id} className={s.seqGroup}>
                  <button type="button" className={s.seqLabel} onClick={() => onToggleSeq(seq.id)}>
                    <FontAwesomeIcon icon={collapsed ? faChevronRight : faChevronDown} className={s.seqChevron} />
                    {seq.name}
                  </button>
                  {!collapsed && seqShots.map(shot => (
                    <ShotCard key={shot.id} shot={shot} onSelect={onSelectShot} onStatusChange={onStatusChange} />
                  ))}
                  {!collapsed && status === 'todo' && (
                    <button type="button" className={s.addShotBtn} onClick={() => onAddShot(seq.id)}>
                      <FontAwesomeIcon icon={faPlus} /> Add shot
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

interface ListViewProps {
  sequences: ProductionSequence[];
  shots: ProductionShot[];
  onSelectShot: (shot: ProductionShot) => void;
  onStatusChange: (shot: ProductionShot, status: ShotStatus) => void;
  onAddShot: (seqId: string) => void;
}

function ListView({ sequences, shots, onSelectShot, onStatusChange, onAddShot }: ListViewProps) {
  return (
    <div className={s.listView}>
      <div className={s.listHeader}>
        <span className={s.listColSeq}>Sequence</span>
        <span className={s.listColShot}>Shot</span>
        <span className={s.listColStatus}>Status</span>
        <span className={s.listColDue}>Due</span>
      </div>
      {sequences.map(seq => {
        const seqShots = shots.filter(sh => sh.sequenceId === seq.id);
        return (
          <div key={seq.id} className={s.listGroup}>
            <div className={s.listSeqHeader}>{seq.name}</div>
            {seqShots.map(shot => (
              <div key={shot.id} className={s.listRow} onClick={() => onSelectShot(shot)}>
                <span className={s.listColSeq} />
                <span className={s.listColShot}>{shot.name}</span>
                <span className={s.listColStatus} onClick={e => e.stopPropagation()}>
                  <select
                    className={`${s.statusSelect} ${STATUS_CLASS[shot.status]}`}
                    value={shot.status}
                    onChange={e => onStatusChange(shot, e.target.value as ShotStatus)}
                  >
                    {STATUSES.map(st => <option key={st} value={st}>{STATUS_LABEL[st]}</option>)}
                  </select>
                </span>
                <span className={s.listColDue}>
                  {shot.dueDate ? new Date(shot.dueDate).toLocaleDateString() : '—'}
                </span>
              </div>
            ))}
            <div className={s.listRow} onClick={() => onAddShot(seq.id)}>
              <span className={s.listColSeq} />
              <span className={`${s.listColShot} ${s.addShotRow}`}>
                <FontAwesomeIcon icon={faPlus} /> Add shot
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Shot card ──────────────────────────────────────────────────────────────────

function ShotCard({ shot, onSelect, onStatusChange }: {
  shot: ProductionShot;
  onSelect: (s: ProductionShot) => void;
  onStatusChange: (s: ProductionShot, status: ShotStatus) => void;
}) {
  return (
    <div className={s.shotCard} onClick={() => onSelect(shot)}>
      <span className={s.shotName}>{shot.name}</span>
      <span className={s.shotMeta}>
        {shot.dueDate && new Date(shot.dueDate).toLocaleDateString()}
      </span>
      <select
        className={`${s.statusSelect} ${STATUS_CLASS[shot.status]}`}
        value={shot.status}
        onClick={e => e.stopPropagation()}
        onChange={e => { e.stopPropagation(); onStatusChange(shot, e.target.value as ShotStatus); }}
      >
        {STATUSES.map(st => <option key={st} value={st}>{STATUS_LABEL[st]}</option>)}
      </select>
    </div>
  );
}
