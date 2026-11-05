import s from './ProductionEditModals.module.css';
import { FormEvent, ReactNode, useState } from 'react';
import { createPortal } from 'react-dom';
import { faFloppyDisk, faListCheck, faPen, faXmark } from '@fortawesome/free-solid-svg-icons';
import { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import { ModalShell } from '../Modals/ModalShell';
import { ActionButton } from '../Buttons/ActionButton';
import { SecondaryButton } from '../Buttons/SecondaryButton';
import { Member, ProductionSequence, ProductionTask, TaskTemplate, Team } from '../../../interfaces';
import { TemplatePayload } from '../../../services/production';
import { AssigneePicker } from './AssigneePicker';

// The date part of an ISO date, for a date input ('' when there's none).
const dateInput = (iso?: string | null) => (iso ? iso.slice(0, 10) : '');

interface EditModalProps {
  title: string;
  saving: boolean;
  canSave: boolean;
  onSubmit: () => void;
  onClose: () => void;
  children: ReactNode;
  icon?: IconDefinition;
  // What its button says and shows (Save, by default), and what it says while it's on its way.
  submitText?: string;
  submitIcon?: IconDefinition;
  savingText?: string;
  // Wider, for what needs the room (a table).
  wide?: boolean;
}

/** A form in a modal, over the page (and the modal it's opened from): its fields, and Save or Cancel. */
export function EditModal({ title, saving, canSave, onSubmit, onClose, children, icon = faPen, submitText = 'Save', submitIcon = faFloppyDisk, savingText = 'Saving…', wide }: EditModalProps) {
  const submit = (e: FormEvent) => { e.preventDefault(); if (canSave && !saving) onSubmit(); };
  // In the page's body, over the shot's modal it's opened from.
  return createPortal(
    <ModalShell title={title} icon={icon} onClose={onClose} className={wide ? s.wide : undefined}>
      <form onSubmit={submit} className={s.form}>
        {children}
        <div className={s.formActions}>
          <ActionButton type="submit" icon={submitIcon} text={saving ? savingText : submitText} disabled={saving || !canSave} />
          <SecondaryButton icon={faXmark} text="Cancel" onClick={onClose} />
        </div>
      </form>
    </ModalShell>,
    document.body,
  );
}

export function Field({ id, label, children }: { id: string; label: string; children: ReactNode }) {
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

export function EditTaskModal({ task, members, teams, saving, onSave, onClose }: SaveProps<ProductionTask> & { task: ProductionTask; members: Member[]; teams: Team[] }) {
  const [name, setName] = useState(task.name);
  const [notes, setNotes] = useState(task.notes ?? '');
  const [dueDate, setDueDate] = useState(dateInput(task.dueDate));
  const [assignedTo, setAssignedTo] = useState<string[]>(task.assignedTo ?? []);
  const [teamIds, setTeamIds] = useState<string[]>(task.teamIds ?? []);
  const toggle = (set: typeof setAssignedTo) => (id: string, on: boolean) =>
    set(list => (on ? [...list.filter(x => x !== id), id] : list.filter(x => x !== id)));

  return (
    <EditModal
      title="Edit task" saving={saving} canSave={!!name.trim()} onClose={onClose}
      onSubmit={() => onSave({ name: name.trim(), notes, dueDate: dueDate || null, assignedTo, teamIds })}
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
      <div className={s.field}>
        <span className={s.formLabel}>Assigned to</span>
        <AssigneePicker
          idPrefix={`task-${task.id}`} members={members} teams={teams} assignedTo={assignedTo} teamIds={teamIds}
          onTogglePerson={toggle(setAssignedTo)} onToggleTeam={toggle(setTeamIds)}
        />
      </div>
    </EditModal>
  );
}

// What a template's tasks are written as: one per line.
const linesOf = (text: string) => text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);

/** A task template made, or changed: its name and its tasks, one per line (a task kept keeps its priority and notes). */
export function EditTemplateModal({ template, saving, onSave, onClose }: { template?: TaskTemplate; saving: boolean; onSave: (payload: TemplatePayload) => void; onClose: () => void }) {
  const [name, setName] = useState(template?.name ?? '');
  const [tasks, setTasks] = useState(template?.tasks.map(t => t.name).join('\n') ?? '');
  return (
    <EditModal
      title={template ? 'Edit template' : 'New template'} icon={faListCheck} saving={saving}
      canSave={!!name.trim() && linesOf(tasks).length > 0} onClose={onClose}
      onSubmit={() => onSave({ name: name.trim(), tasks: linesOf(tasks).map(line => template?.tasks.find(t => t.name === line) ?? line) })}
    >
      <Field id="template-name" label="Name">
        <input id="template-name" autoFocus className={s.formInput} value={name} placeholder="e.g. Character" onChange={e => setName(e.target.value)} />
      </Field>
      <Field id="template-tasks" label="Tasks, one per line">
        <textarea id="template-tasks" className={s.formTextarea} rows={5} value={tasks} placeholder={'Modeling\nRig and animations\nExport and upload'} onChange={e => setTasks(e.target.value)} />
      </Field>
    </EditModal>
  );
}
