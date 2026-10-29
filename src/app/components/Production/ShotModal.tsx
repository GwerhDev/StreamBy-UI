import s from './ShotModal.module.css';
import { FormEvent, KeyboardEvent, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCheck, faClipboardList, faImage, faLink, faLinkSlash, faPen, faPlus, faSpinner, faTrash, faXmark,
} from '@fortawesome/free-solid-svg-icons';
import { AppDispatch } from '../../../store';
import { addApiResponse } from '../../../store/apiResponsesSlice';
import { createTask, deleteTask, getTasks, updateShot, updateTask } from '../../../services/production';
import { Member, ProductionSequence, ProductionShot, ProductionTask, ShotStatus, TaskPriority } from '../../../interfaces';
import { ModalShell } from '../Modals/ModalShell';
import { AssetPickerModal } from '../Modals/AssetPickerModal';
import { LabeledSelect } from '../Inputs/LabeledSelect';
import { CustomCheckbox } from '../Inputs/CustomCheckbox';
import { PrimaryButton } from '../Buttons/PrimaryButton';
import { DropdownInput } from '../Inputs/DropdownInput';
import { MemberAvatar } from '../Cards/MemberAvatar';
import { DeliverableItems } from '../Deliverables/DeliverableItems';
import { EditTaskModal } from './ProductionEditModals';
import { AssetThumbnail } from './AssetThumbnail';
import { PRIORITY_LABEL, STATUSES, STATUS_LABEL, summaryOf } from './shots';

type ShotChanges = Parameters<typeof updateShot>[2];

interface Props {
  shot: ProductionShot;
  sequence?: ProductionSequence;
  projectId: string;
  members: Member[];
  onClose: () => void;
  onUpdate: (shot: ProductionShot) => void;
  onDelete: (id: string) => void;
  // Off while a dialog over it (its delete's confirmation) takes Esc.
  closeOnEscape?: boolean;
}

const PRIORITY_OPTIONS = (Object.keys(PRIORITY_LABEL) as TaskPriority[]).map(p => ({ value: p, label: PRIORITY_LABEL[p] }));

const PRIORITY_TINT: Record<TaskPriority, string> = {
  low:    s.priorityLow,
  medium: s.priorityMedium,
  high:   s.priorityHigh,
};

const dateInput = (iso?: string | null) => (iso ? iso.slice(0, 10) : '');

// A shot's card opened: everything of it seen and changed in place, each change saved as it's
// made (and put back, told, if it fails).
export function ShotModal({ shot, sequence, projectId, members, onClose, onUpdate, onDelete, closeOnEscape = true }: Props) {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const [tasks, setTasks] = useState<ProductionTask[]>([]);
  const [loadingTasks, setLoadingTasks] = useState(true);
  const [newTaskName, setNewTaskName] = useState('');
  const [addingTask, setAddingTask] = useState(false);
  const [savingTask, setSavingTask] = useState(false);
  const [editTask, setEditTask] = useState<ProductionTask | null>(null);
  const [saving, setSaving] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [name, setName] = useState(shot.name);
  const [description, setDescription] = useState(shot.description ?? '');
  const [pickingAsset, setPickingAsset] = useState(false);
  const descriptionRef = useRef<HTMLTextAreaElement>(null);

  // The description as tall as what it says.
  useLayoutEffect(() => {
    const el = descriptionRef.current;
    if (!el) return;
    el.style.height = 'auto';
    // Its borders too: its height counts them, what it scrolls doesn't.
    el.style.height = `${el.scrollHeight + el.offsetHeight - el.clientHeight}px`;
  }, [description]);

  const failed = (err: unknown, fallback: string) =>
    dispatch(addApiResponse({ message: err instanceof Error && err.message ? err.message : fallback, type: 'error' }));

  useEffect(() => { setName(shot.name); setDescription(shot.description ?? ''); }, [shot.name, shot.description]);

  useEffect(() => {
    let cancelled = false;
    setLoadingTasks(true);
    getTasks(projectId, shot.id)
      .then(t => { if (!cancelled) setTasks(t); })
      .catch(err => { if (!cancelled) failed(err, 'Failed to load the tasks.'); })
      .finally(() => { if (!cancelled) setLoadingTasks(false); });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, shot.id]);

  // Esc closes it, unless something open in it takes it first (a field being edited, a list, a
  // dialog over it).
  const escapes = closeOnEscape && !editTask && !pickingAsset;
  useEffect(() => {
    if (!escapes) return;
    const onKey = (e: globalThis.KeyboardEvent) => { if (e.key === 'Escape' && !e.defaultPrevented) onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [escapes, onClose]);

  // Its tasks as they are now, summed up on its card.
  const withTasks = (next: ProductionTask[]) => {
    setTasks(next);
    onUpdate({ ...shot, taskSummary: summaryOf(next) });
  };

  const save = async (changes: ShotChanges, fallback: string) => {
    try {
      onUpdate({ ...(await updateShot(projectId, shot.id, changes)), taskSummary: shot.taskSummary });
      return true;
    } catch (err) {
      failed(err, fallback);
      return false;
    }
  };

  const saveName = async () => {
    setEditingName(false);
    const trimmed = name.trim();
    if (!trimmed || trimmed === shot.name) { setName(shot.name); return; }
    if (!(await save({ name: trimmed }, 'Failed to rename the shot.'))) setName(shot.name);
  };

  const saveDescription = async () => {
    if (description === (shot.description ?? '')) return;
    if (!(await save({ description }, 'Failed to save the description.'))) setDescription(shot.description ?? '');
  };

  // Who it's assigned to, as ticked: shown at once, each tick from the one before (not from what
  // the server has answered so far), saved in order, put back to what was saved last if it fails.
  const [assignedTo, setAssignedTo] = useState(shot.assignedTo);
  const ticked = useRef(shot.assignedTo);
  const savedAssignees = useRef(shot.assignedTo);
  const assigning = useRef<Promise<unknown>>(Promise.resolve());
  const toggleAssignee = (userId: string, on: boolean) => {
    const next = on ? [...ticked.current.filter(id => id !== userId), userId] : ticked.current.filter(id => id !== userId);
    ticked.current = next;
    setAssignedTo(next);
    assigning.current = assigning.current.then(async () => {
      if (await save({ assignedTo: next }, 'Failed to change who the shot is assigned to.')) {
        savedAssignees.current = next;
      } else {
        ticked.current = savedAssignees.current;
        setAssignedTo(savedAssignees.current);
      }
    });
  };

  // An edited field takes Esc (put back as it was), not the modal.
  const editKeys = (e: KeyboardEvent, cancel: () => void) => {
    if (e.key !== 'Escape') return;
    e.preventDefault();
    cancel();
  };

  const handleAddTask = async (e: FormEvent) => {
    e.preventDefault();
    if (!newTaskName.trim()) return;
    setSavingTask(true);
    try {
      const task = await createTask(projectId, shot.id, { name: newTaskName.trim() });
      withTasks([...tasks, task]);
      setNewTaskName('');
    } catch (err) {
      failed(err, 'Failed to add the task.');
    } finally { setSavingTask(false); }
  };

  const changeTask = async (task: ProductionTask, changes: Partial<Pick<ProductionTask, 'status' | 'priority'>>) => {
    const before = tasks;
    withTasks(tasks.map(t => (t.id === task.id ? { ...t, ...changes } : t)));
    try {
      await updateTask(projectId, shot.id, task.id, changes);
    } catch (err) {
      withTasks(before);
      failed(err, 'Failed to update the task.');
    }
  };

  const handleDeleteTask = async (task: ProductionTask) => {
    const before = tasks;
    withTasks(tasks.filter(t => t.id !== task.id));
    try {
      await deleteTask(projectId, shot.id, task.id);
    } catch (err) {
      withTasks(before);
      failed(err, 'Failed to delete the task.');
    }
  };

  const handleSaveTask = async (changes: Partial<ProductionTask>) => {
    if (!editTask) return;
    setSaving(true);
    try {
      const updated = await updateTask(projectId, shot.id, editTask.id, changes as Parameters<typeof updateTask>[3]);
      withTasks(tasks.map(t => (t.id === updated.id ? updated : t)));
      setEditTask(null);
    } catch (err) {
      failed(err, 'Failed to save the task.');
    } finally { setSaving(false); }
  };

  const doneCount = tasks.filter(t => t.status === 'done').length;
  const assignees = members.filter(m => assignedTo.includes(m.userId));

  return (
    <ModalShell title={sequence?.name ?? 'Shot'} icon={faClipboardList} onClose={onClose} className={s.modal}>
      <div className={s.layout} data-testid="shot-modal">
        <div className={s.main}>
          {editingName ? (
            <input
              autoFocus
              aria-label="Shot name"
              className={s.nameInput}
              value={name}
              onChange={e => setName(e.target.value)}
              onBlur={saveName}
              onKeyDown={e => { if (e.key === 'Enter') saveName(); else editKeys(e, () => { setName(shot.name); setEditingName(false); }); }}
            />
          ) : (
            <button type="button" className={s.name} onClick={() => setEditingName(true)} title="Rename">
              {shot.name}
              <FontAwesomeIcon icon={faPen} className={s.nameEdit} />
            </button>
          )}

          <label className={s.sectionLabel} htmlFor="shot-description">Description</label>
          <textarea
            ref={descriptionRef}
            id="shot-description"
            className={s.description}
            rows={2}
            placeholder="Add a description…"
            value={description}
            onChange={e => setDescription(e.target.value)}
            onBlur={saveDescription}
            onKeyDown={e => editKeys(e, () => setDescription(shot.description ?? ''))}
          />

          <div className={s.taskSection}>
            <div className={s.taskHeader}>
              <span className={s.sectionLabel}>
                Tasks
                {tasks.length > 0 && <span className={s.taskCount}>{doneCount}/{tasks.length}</span>}
              </span>
              <button type="button" className={s.addTaskBtn} onClick={() => setAddingTask(true)}>
                <FontAwesomeIcon icon={faPlus} /> Add
              </button>
            </div>

            {tasks.length > 0 && (
              <div className={s.progressBar}>
                <div className={s.progressFill} style={{ width: `${(doneCount / tasks.length) * 100}%` }} />
              </div>
            )}

            {loadingTasks ? (
              <div className={s.taskLoading}><FontAwesomeIcon icon={faSpinner} spin /></div>
            ) : (
              <div className={s.taskList}>
                {tasks.map(task => (
                  <div key={task.id} className={`${s.taskRow} ${task.status === 'done' ? s.taskRowDone : ''}`}>
                    <div className={s.taskCheck}>
                      <CustomCheckbox
                        id={`task-${task.id}`} name="task-done" label={task.name} checked={task.status === 'done'}
                        onChange={e => changeTask(task, { status: e.target.checked ? 'done' : 'todo' })}
                      />
                    </div>
                    <div className={`${s.taskPriority} ${PRIORITY_TINT[task.priority]}`} aria-label={`Priority of ${task.name}`}>
                      <DropdownInput
                        value={task.priority} options={PRIORITY_OPTIONS}
                        onChange={v => changeTask(task, { priority: v as TaskPriority })}
                      />
                    </div>
                    <button type="button" className={s.taskDeleteBtn} onClick={() => setEditTask(task)} aria-label={`Edit task ${task.name}`}>
                      <FontAwesomeIcon icon={faPen} />
                    </button>
                    <button type="button" className={s.taskDeleteBtn} onClick={() => handleDeleteTask(task)} aria-label={`Delete task ${task.name}`}>
                      <FontAwesomeIcon icon={faXmark} />
                    </button>
                  </div>
                ))}

                {addingTask ? (
                  <form onSubmit={handleAddTask} className={s.addTaskForm}>
                    <input
                      autoFocus
                      aria-label="New task"
                      className={s.addTaskInput}
                      value={newTaskName}
                      onChange={e => setNewTaskName(e.target.value)}
                      placeholder="Task name…"
                      onKeyDown={e => editKeys(e, () => { setNewTaskName(''); setAddingTask(false); })}
                    />
                    <button type="submit" className={s.addTaskOk} disabled={savingTask || !newTaskName.trim()} aria-label="Add task">
                      <FontAwesomeIcon icon={savingTask ? faSpinner : faCheck} spin={savingTask} />
                    </button>
                    <button type="button" className={s.addTaskCancel} onClick={() => setAddingTask(false)} aria-label="Cancel">
                      <FontAwesomeIcon icon={faXmark} />
                    </button>
                  </form>
                ) : tasks.length === 0 ? (
                  <button type="button" className={s.emptyTaskBtn} onClick={() => setAddingTask(true)}>
                    <FontAwesomeIcon icon={faPlus} /> Add a task
                  </button>
                ) : null}
              </div>
            )}
          </div>

          <DeliverableItems projectId={projectId} of={{ shotId: shot.id }} />
        </div>

        <aside className={s.side}>
          <LabeledSelect
            label="Status" htmlFor="shot-status" id="shot-status" value={shot.status}
            onChange={e => save({ status: e.target.value as ShotStatus }, "Failed to change the shot's status.")}
            options={STATUSES.map(st => ({ value: st, label: STATUS_LABEL[st] }))}
          />

          <fieldset className={s.assignees}>
            <legend className={s.sectionLabel}>Assigned to</legend>
            {assignees.length > 0 && (
              <div className={s.avatars} data-testid="shot-assignees">
                {assignees.map(m => <MemberAvatar key={m.userId} username={m.username} profilePic={m.profilePic} size="small" />)}
              </div>
            )}
            {members.length === 0 && <p className={s.hint}>No members to assign.</p>}
            {members.map(m => (
              <CustomCheckbox
                key={m.userId} id={`shot-assignee-${m.userId}`} name="shot-assignee" value={m.userId}
                label={m.username} checked={assignedTo.includes(m.userId)} onChange={e => toggleAssignee(m.userId, e.target.checked)}
              />
            ))}
          </fieldset>

          <div className={s.sideField}>
            <label className={s.sectionLabel} htmlFor="shot-due">Due date</label>
            <input
              id="shot-due" type="date" className={s.dateInput} value={dateInput(shot.dueDate)}
              onChange={e => save({ dueDate: e.target.value || null }, 'Failed to change the due date.')}
            />
          </div>

          <div className={s.sideField}>
            <span className={s.sectionLabel}>Asset</span>
            {shot.assetId ? (
              <>
                <AssetThumbnail projectId={projectId} assetId={shot.assetId} className={s.assetThumb} />
                <div className={s.assetActions}>
                  <button type="button" className={s.linkBtn} onClick={() => setPickingAsset(true)}>
                    <FontAwesomeIcon icon={faImage} /> Change
                  </button>
                  <button type="button" className={s.linkBtn} onClick={() => save({ assetId: null }, 'Failed to unlink the asset.')}>
                    <FontAwesomeIcon icon={faLinkSlash} /> Unlink
                  </button>
                </div>
              </>
            ) : (
              <button type="button" className={s.linkBtn} onClick={() => setPickingAsset(true)}>
                <FontAwesomeIcon icon={faLink} /> Link an asset
              </button>
            )}
          </div>

          {shot.exportId && (
            <div className={s.sideField}>
              <span className={s.sectionLabel}>Export</span>
              <button type="button" className={s.linkBtn} onClick={() => navigate(`/project/${projectId}/workflow/exports/${shot.exportId}`)}>
                <FontAwesomeIcon icon={faLink} /> View export
              </button>
            </div>
          )}

          <div className={s.sideFooter}>
            <PrimaryButton icon={faTrash} text="Delete shot" onClick={() => onDelete(shot.id)} />
          </div>
        </aside>
      </div>

      {editTask && (
        <EditTaskModal task={editTask} members={members} saving={saving} onSave={handleSaveTask} onClose={() => setEditTask(null)} />
      )}
      {pickingAsset && (
        <AssetPickerModal
          projectId={projectId}
          onClose={() => setPickingAsset(false)}
          onInsert={files => {
            setPickingAsset(false);
            if (files[0]) save({ assetId: files[0].id }, 'Failed to link the asset.');
          }}
        />
      )}
    </ModalShell>
  );
}
