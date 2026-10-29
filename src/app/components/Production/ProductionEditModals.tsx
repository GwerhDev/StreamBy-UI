import s from './ProductionEditModals.module.css';
import { FormEvent, ReactNode, useState } from 'react';
import { createPortal } from 'react-dom';
import { faFloppyDisk, faPen, faXmark } from '@fortawesome/free-solid-svg-icons';
import { ModalShell } from '../Modals/ModalShell';
import { ActionButton } from '../Buttons/ActionButton';
import { SecondaryButton } from '../Buttons/SecondaryButton';
import { Member, ProductionSequence, ProductionTask } from '../../../interfaces';

// The date part of an ISO date, for a date input ('' when there's none).
const dateInput = (iso?: string | null) => (iso ? iso.slice(0, 10) : '');

interface EditModalProps {
  title: string;
  saving: boolean;
  canSave: boolean;
  onSubmit: () => void;
  onClose: () => void;
  children: ReactNode;
}

function EditModal({ title, saving, canSave, onSubmit, onClose, children }: EditModalProps) {
  const submit = (e: FormEvent) => { e.preventDefault(); if (canSave && !saving) onSubmit(); };
  // In the page's body, over the shot's modal it's opened from.
  return createPortal(
    <ModalShell title={title} icon={faPen} onClose={onClose}>
      <form onSubmit={submit} className={s.form}>
        {children}
        <div className={s.formActions}>
          <ActionButton type="submit" icon={faFloppyDisk} text={saving ? 'Saving…' : 'Save'} disabled={saving || !canSave} />
          <SecondaryButton icon={faXmark} text="Cancel" onClick={onClose} />
        </div>
      </form>
    </ModalShell>,
    document.body,
  );
}

function Field({ id, label, children }: { id: string; label: string; children: ReactNode }) {
  return (
    <div className={s.field}>
      <label htmlFor={id} className={s.formLabel}>{label}</label>
      {children}
    </div>
  );
}

interface SaveProps<T> {
  saving: boolean;
  onSave: (changes: Partial<T>) => void;
  onClose: () => void;
}

export function EditSequenceModal({ sequence, saving, onSave, onClose }: SaveProps<ProductionSequence> & { sequence: ProductionSequence }) {
  const [name, setName] = useState(sequence.name);
  const [description, setDescription] = useState(sequence.description ?? '');
  return (
    <EditModal
      title="Edit sequence" saving={saving} canSave={!!name.trim()} onClose={onClose}
      onSubmit={() => onSave({ name: name.trim(), description })}
    >
      <Field id="sequence-name" label="Name">
        <input id="sequence-name" autoFocus className={s.formInput} value={name} onChange={e => setName(e.target.value)} />
      </Field>
      <Field id="sequence-description" label="Description">
        <textarea id="sequence-description" className={s.formTextarea} rows={3} value={description} onChange={e => setDescription(e.target.value)} />
      </Field>
    </EditModal>
  );
}

export function EditTaskModal({ task, members, saving, onSave, onClose }: SaveProps<ProductionTask> & { task: ProductionTask; members: Member[] }) {
  const [name, setName] = useState(task.name);
  const [notes, setNotes] = useState(task.notes ?? '');
  const [dueDate, setDueDate] = useState(dateInput(task.dueDate));
  const [assignee, setAssignee] = useState(task.assignedTo ?? '');

  return (
    <EditModal
      title="Edit task" saving={saving} canSave={!!name.trim()} onClose={onClose}
      onSubmit={() => onSave({ name: name.trim(), notes, dueDate: dueDate || null, assignedTo: assignee || null })}
    >
      <Field id="task-name" label="Name">
        <input id="task-name" autoFocus className={s.formInput} value={name} onChange={e => setName(e.target.value)} />
      </Field>
      <Field id="task-notes" label="Notes">
        <textarea id="task-notes" className={s.formTextarea} rows={3} value={notes} onChange={e => setNotes(e.target.value)} />
      </Field>
      <Field id="task-due" label="Due date">
        <input id="task-due" type="date" className={s.formInput} value={dueDate} onChange={e => setDueDate(e.target.value)} />
      </Field>
      <Field id="task-assignee" label="Assigned to">
        <select id="task-assignee" className={s.formInput} value={assignee} onChange={e => setAssignee(e.target.value)}>
          <option value="">Nobody</option>
          {members.map(m => <option key={m.userId} value={m.userId}>{m.username}</option>)}
        </select>
      </Field>
    </EditModal>
  );
}
