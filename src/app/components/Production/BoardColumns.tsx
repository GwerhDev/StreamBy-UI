import s from './BoardColumns.module.css';
import { FormEvent, useEffect, useRef, useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faArrowRight, faEllipsisVertical, faPlus, faTableColumns, faTrash, faXmark } from '@fortawesome/free-solid-svg-icons';
import { BoardColumn, ShotStatus } from '../../../interfaces';
import { ModalShell } from '../Modals/ModalShell';
import { ActionButton } from '../Buttons/ActionButton';
import { PrimaryButton } from '../Buttons/PrimaryButton';
import { SecondaryButton } from '../Buttons/SecondaryButton';
import { LabeledInput } from '../Inputs/LabeledInput';
import { LabeledSelect } from '../Inputs/LabeledSelect';
import { STATUSES, STATUS_LABEL, columnLabel } from './shots';

interface HeadProps {
  column: BoardColumn;
  count: number;
  dotClassName: string;
  canMoveLeft: boolean;
  canMoveRight: boolean;
  // A change to the columns on its way: another made now would be made on the columns before it.
  busy: boolean;
  onRename: (name: string) => void;
  onMove: (by: -1 | 1) => void;
  onDelete: () => void;
}

// A column's head: its status's dot, its name (renamed in place), how many cards it has, and a
// menu to move it or delete it. The head is dragged to put the column elsewhere (see BoardView).
export function ColumnHead({ column, count, dotClassName, canMoveLeft, canMoveRight, busy, onRename, onMove, onDelete }: HeadProps) {
  const { attributes, listeners, setNodeRef, isDragging, isOver } = useSortable({ id: column.id, disabled: busy });
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(column.name);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setName(column.name); }, [column.name]);
  useEffect(() => {
    if (!menuOpen) return;
    const close = (e: MouseEvent) => { if (!menuRef.current?.contains(e.target as Node)) setMenuOpen(false); };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [menuOpen]);

  const save = () => {
    setEditing(false);
    const trimmed = name.trim();
    if (trimmed && trimmed !== column.name) onRename(trimmed);
    else setName(column.name);
  };

  return (
    <div
      ref={setNodeRef}
      className={`${s.head} ${isDragging ? s.headDragging : ''} ${isOver && !isDragging ? s.headOver : ''}`}
      {...attributes}
      {...listeners}
      aria-roledescription="sortable column"
      aria-label={`Column ${column.name}`}
    >
      <span className={`${s.dot} ${dotClassName}`} title={STATUS_LABEL[column.status]} />
      {editing ? (
        <input
          autoFocus
          aria-label="Column name"
          className={s.nameInput}
          value={name}
          onChange={e => setName(e.target.value)}
          onBlur={save}
          onKeyDown={e => {
            if (e.key === 'Enter') save();
            if (e.key === 'Escape') { e.preventDefault(); setName(column.name); setEditing(false); }
          }}
        />
      ) : (
        <button type="button" className={s.name} onClick={() => setEditing(true)} title="Rename">
          {column.name}
        </button>
      )}
      <span className={s.count}>{count}</span>
      <div className={s.menuWrap} ref={menuRef}>
        <button type="button" className={s.menuBtn} onClick={() => setMenuOpen(v => !v)} aria-label={`${column.name} column actions`}>
          <FontAwesomeIcon icon={faEllipsisVertical} />
        </button>
        {menuOpen && (
          <div className={s.menu} role="menu">
            <button type="button" role="menuitem" className={s.menuItem} disabled={busy || !canMoveLeft} onClick={() => { setMenuOpen(false); onMove(-1); }}>
              <FontAwesomeIcon icon={faArrowLeft} /> Move left
            </button>
            <button type="button" role="menuitem" className={s.menuItem} disabled={busy || !canMoveRight} onClick={() => { setMenuOpen(false); onMove(1); }}>
              <FontAwesomeIcon icon={faArrowRight} /> Move right
            </button>
            <button type="button" role="menuitem" className={`${s.menuItem} ${s.menuDanger}`} disabled={busy} onClick={() => { setMenuOpen(false); onDelete(); }}>
              <FontAwesomeIcon icon={faTrash} /> Delete column
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// A column's head as it's dragged (in the board's drag overlay).
export function ColumnHeadGhost({ column, dotClassName }: { column: BoardColumn; dotClassName: string }) {
  return (
    <div className={`${s.head} ${s.headGhost}`}>
      <span className={`${s.dot} ${dotClassName}`} />
      <span className={s.ghostName}>{column.name}</span>
    </div>
  );
}

// A new column: its name and the status its cards take.
export function AddColumnModal({ saving, onSave, onClose }: { saving: boolean; onSave: (name: string, status: ShotStatus) => void; onClose: () => void }) {
  const [name, setName] = useState('');
  const [status, setStatus] = useState<ShotStatus>('in_progress');
  const submit = (e: FormEvent) => { e.preventDefault(); if (name.trim() && !saving) onSave(name.trim(), status); };
  return (
    <ModalShell title="New column" icon={faTableColumns} onClose={onClose}>
      <form onSubmit={submit} className={s.form}>
        <LabeledInput label="Name" name="column-name" id="column-name" htmlFor="column-name" type="text" placeholder="e.g. QA" value={name} onChange={e => setName(e.target.value)} />
        <LabeledSelect
          label="Status" id="column-status" htmlFor="column-status" value={status}
          onChange={e => setStatus(e.target.value as ShotStatus)}
          options={STATUSES.map(st => ({ value: st, label: STATUS_LABEL[st] }))}
        />
        <p className={s.hint}>A card in this column has this status.</p>
        <div className={s.actions}>
          <ActionButton type="submit" icon={faPlus} text={saving ? 'Adding…' : 'Add column'} disabled={saving || !name.trim()} />
          <SecondaryButton icon={faXmark} text="Cancel" onClick={onClose} />
        </div>
      </form>
    </ModalShell>
  );
}

// A column deleted: where its cards go, if it has any. The last column of a status can't be.
export function DeleteColumnModal({ column, columns, count, saving, onDelete, onClose }: {
  column: BoardColumn;
  columns: BoardColumn[];
  count: number;
  saving: boolean;
  onDelete: (moveTo?: string) => void;
  onClose: () => void;
}) {
  const others = columns.filter(c => c.id !== column.id);
  const lastOfStatus = !others.some(c => c.status === column.status);
  const [moveTo, setMoveTo] = useState(others.find(c => c.status === column.status)?.id ?? others[0]?.id ?? '');
  return (
    <ModalShell title="Delete column" icon={faTrash} onClose={onClose}>
      <div className={s.form}>
        {lastOfStatus ? (
          <p className={s.text}>
            <strong>{column.name}</strong> is the only column with the status {STATUS_LABEL[column.status]}: each status keeps at least one.
          </p>
        ) : (
          <>
            <p className={s.text}>
              Delete <strong>{column.name}</strong>?{count > 0 && ` Its ${count === 1 ? 'card' : `${count} cards`} will move to another column, and take its status.`}
            </p>
            {count > 0 && (
              <LabeledSelect
                label="Move its cards to" id="column-move-to" htmlFor="column-move-to" value={moveTo}
                onChange={e => setMoveTo(e.target.value)}
                options={others.map(c => ({ value: c.id, label: columnLabel(c) }))}
              />
            )}
          </>
        )}
        <div className={s.actions}>
          <PrimaryButton
            icon={faTrash} text={saving ? 'Deleting…' : 'Delete column'}
            disabled={saving || lastOfStatus || (count > 0 && !moveTo)}
            onClick={() => onDelete(count > 0 ? moveTo : undefined)}
          />
          <SecondaryButton icon={faXmark} text="Cancel" onClick={onClose} />
        </div>
      </div>
    </ModalShell>
  );
}
