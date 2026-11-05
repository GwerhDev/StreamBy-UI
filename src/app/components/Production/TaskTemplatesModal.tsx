import s from './TaskTemplatesModal.module.css';
import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faListCheck, faPen, faPlus, faTrash } from '@fortawesome/free-solid-svg-icons';
import { TaskTemplate } from '../../../interfaces';
import { createTaskTemplate, deleteTaskTemplate, TemplatePayload, updateTaskTemplate } from '../../../services/production';
import { ModalShell } from '../Modals/ModalShell';
import { ActionButton } from '../Buttons/ActionButton';
import { EmptyBackground } from '../Backgrounds/EmptyBackground';
import { EditTemplateModal } from './ProductionEditModals';

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

// A project's task templates, listed: each one made or changed in its own modal over it, and
// deleted; every change saved at once.
export function TaskTemplatesModal({ projectId, templates, canEdit, canDelete, onChange, onSaved, onError, onClose }: Props) {
  // The one being made ('new') or changed (its id), if any.
  const [editing, setEditing] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const current = templates.find(t => t.id === editing);

  const save = async (payload: TemplatePayload) => {
    setSaving(true);
    try {
      const saved = current ? await updateTaskTemplate(projectId, current.id, payload) : await createTaskTemplate(projectId, payload);
      onChange([...templates.filter(t => t.id !== saved.id), saved].sort((a, b) => a.name.localeCompare(b.name)));
      onSaved(current ? 'Template saved.' : 'Template created.');
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
      {templates.length === 0 ? (
        <div className={s.empty}>
          <EmptyBackground />
          {canEdit && <ActionButton icon={faPlus} text="New template" onClick={() => setEditing('new')} />}
        </div>
      ) : (
        <ul className={s.list}>
          {templates.map(t => (
            <li key={t.id}>
              <div>
                <span className={s.name}>{t.name}</span>
                <p className={s.tasks}>{t.tasks.map(task => task.name).join(' · ')}</p>
              </div>
              {(canEdit || canDelete) && (
                <div className={s.actions}>
                  {canEdit && (
                    <button type="button" className={s.iconBtn} onClick={() => setEditing(t.id)} aria-label={`Edit ${t.name}`} title="Edit">
                      <FontAwesomeIcon icon={faPen} />
                    </button>
                  )}
                  {canDelete && (
                    <button type="button" className={`${s.iconBtn} ${s.danger}`} onClick={() => remove(t)} aria-label={`Delete ${t.name}`} title="Delete">
                      <FontAwesomeIcon icon={faTrash} />
                    </button>
                  )}
                </div>
              )}
            </li>
          ))}
          {canEdit && (
            <li className={s.create} onClick={() => setEditing('new')} role="button" aria-label="New template">
              <FontAwesomeIcon icon={faPlus} />
              <h4>New template</h4>
            </li>
          )}
        </ul>
      )}
      {editing && (
        <EditTemplateModal template={current} saving={saving} onSave={save} onClose={() => setEditing(null)} />
      )}
    </ModalShell>
  );
}
