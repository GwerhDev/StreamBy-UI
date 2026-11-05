import s from './BulkCards.module.css';
import { FormEvent, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFloppyDisk, faListCheck, faPen, faPlus, faTrash, faXmark } from '@fortawesome/free-solid-svg-icons';
import { TaskTemplate } from '../../../interfaces';
import { createTaskTemplate, deleteTaskTemplate, updateTaskTemplate } from '../../../services/production';
import { ModalShell } from '../Modals/ModalShell';
import { ActionButton } from '../Buttons/ActionButton';
import { SecondaryButton } from '../Buttons/SecondaryButton';

interface Props {
  projectId: string;
  templates: TaskTemplate[];
  // Whoever may change them (production:write), and delete them (production:delete).
  canEdit: boolean;
  canDelete: boolean;
  onChange: (templates: TaskTemplate[]) => void;
  onSaved: (message: string) => void;
  onError: (err: unknown) => void;
  onClose: () => void;
}

// What a template's tasks are written as: one per line.
const linesOf = (text: string) => text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);

// A project's task templates: listed, made, changed and deleted. Each change is saved at once.
export function TaskTemplatesModal({ projectId, templates, canEdit, canDelete, onChange, onSaved, onError, onClose }: Props) {
  // The one being edited: 'new', a template's id, or none.
  const [editing, setEditing] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [tasks, setTasks] = useState('');
  const [saving, setSaving] = useState(false);

  const edit = (template?: TaskTemplate) => {
    setEditing(template?.id ?? 'new');
    setName(template?.name ?? '');
    // A task keeps its priority and notes when its line is kept.
    setTasks(template?.tasks.map(t => t.name).join('\n') ?? '');
  };

  const save = async (e: FormEvent) => {
    e.preventDefault();
    if (!editing || !name.trim() || !linesOf(tasks).length) return;
    setSaving(true);
    try {
      const before = templates.find(t => t.id === editing);
      const payload = { name: name.trim(), tasks: linesOf(tasks).map(line => before?.tasks.find(t => t.name === line) ?? line) };
      const saved = editing === 'new' ? await createTaskTemplate(projectId, payload) : await updateTaskTemplate(projectId, editing, payload);
      onChange([...templates.filter(t => t.id !== saved.id), saved].sort((a, b) => a.name.localeCompare(b.name)));
      onSaved(editing === 'new' ? 'Template created.' : 'Template saved.');
      setEditing(null);
    } catch (err) {
      onError(err);
    } finally {
      setSaving(false);
    }
  };

  const remove = async (template: TaskTemplate) => {
    try {
      await deleteTaskTemplate(projectId, template.id);
      onChange(templates.filter(t => t.id !== template.id));
      onSaved('Template deleted.');
    } catch (err) {
      onError(err);
    }
  };

  return (
    <ModalShell title="Task templates" icon={faListCheck} onClose={onClose}>
      <div className={s.form}>
        {editing ? (
          <form onSubmit={save} className={s.form} aria-label={editing === 'new' ? 'New template' : 'Edit template'}>
            <label className={s.label} htmlFor="template-name">Name</label>
            <input id="template-name" className={s.input} value={name} onChange={e => setName(e.target.value)} autoFocus placeholder="e.g. Character" />
            <label className={s.label} htmlFor="template-tasks">Tasks, one per line</label>
            <textarea id="template-tasks" className={s.textarea} value={tasks} onChange={e => setTasks(e.target.value)} placeholder={'Modeling\nRig and animations\nExport and upload'} />
            <div className={s.actions}>
              <ActionButton type="submit" icon={faFloppyDisk} text={saving ? 'Saving…' : 'Save'} disabled={saving || !name.trim() || !linesOf(tasks).length} />
              <SecondaryButton icon={faXmark} text="Cancel" onClick={() => setEditing(null)} />
            </div>
          </form>
        ) : (
          <>
            {templates.length === 0 ? (
              <p className={s.hint}>No templates yet: a template's tasks are given at once to the cards it's applied to.</p>
            ) : (
              <ul className={s.list}>
                {templates.map(t => (
                  <li key={t.id} className={s.item}>
                    <div>
                      <span className={s.itemName}>{t.name}</span>
                      <p className={s.itemTasks}>{t.tasks.map(task => task.name).join(' · ')}</p>
                    </div>
                    {(canEdit || canDelete) && (
                      <div className={s.itemActions}>
                        {canEdit && (
                          <button type="button" className={s.iconBtn} onClick={() => edit(t)} aria-label={`Edit ${t.name}`}>
                            <FontAwesomeIcon icon={faPen} />
                          </button>
                        )}
                        {canDelete && (
                          <button type="button" className={s.iconBtn} onClick={() => remove(t)} aria-label={`Delete ${t.name}`}>
                            <FontAwesomeIcon icon={faTrash} />
                          </button>
                        )}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
            {canEdit && (
              <div className={s.actions}>
                <ActionButton icon={faPlus} text="New template" onClick={() => edit()} />
              </div>
            )}
          </>
        )}
      </div>
    </ModalShell>
  );
}
