import s from './ShotModal.module.css';
import { FormEvent, KeyboardEvent, MutableRefObject, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCheck, faClipboardList, faImage, faLink, faLinkSlash, faPen, faPlus, faSpinner, faTrash, faXmark,
} from '@fortawesome/free-solid-svg-icons';
import { AppDispatch } from '../../../store';
import { addApiResponse } from '../../../store/apiResponsesSlice';
import { createTask, deleteTask, getTasks, updateShot, updateTask } from '../../../services/production';
import { BoardColumn, Member, ProductionLabels, ProductionSequence, ProductionShot, ProductionTask, TaskPriority, Team } from '../../../interfaces';
import { useSelector } from 'react-redux';
import { RootState } from '../../../store';
import { useRoleCan } from '../../../hooks/useRoleCan';
import { ShotPipelineRuns } from '../PipelineRuns/ShotPipelineRuns';
import { DEFAULT_LABELS, lower } from './productionLabels';
import { usePipelineTaskSteps } from './usePipelineTaskSteps';
import { ModalShell } from '../Modals/ModalShell';
import { AssetPickerModal } from '../Modals/AssetPickerModal';
import { LabeledSelect } from '../Inputs/LabeledSelect';
import { CustomCheckbox } from '../Inputs/CustomCheckbox';
import { AssigneePicker } from './AssigneePicker';
import { PriorityIcon } from './PriorityIcon';
import { formatDueDate } from './dueDate';
import { PrimaryButton } from '../Buttons/PrimaryButton';
import { DropdownInput } from '../Inputs/DropdownInput';
import { DeliverableItems } from '../Deliverables/DeliverableItems';
import { EditTaskModal } from './ProductionEditModals';
import { AssetThumbnail } from './AssetThumbnail';
import { PRIORITY_LABEL, columnLabel, columnOfShot, summaryOf } from './shots';

type ShotChanges = Parameters<typeof updateShot>[2];

interface Props {
  shot: ProductionShot;
  sequence?: ProductionSequence;
  projectId: string;
  members: Member[];
  teams: Team[];
  // The board's columns: the shot is in one, and has its status.
  columns: BoardColumn[];
  onClose: () => void;
  onUpdate: (shot: ProductionShot) => void;
  onDelete: (id: string) => void;
  // Off while a dialog over it (its delete's confirmation) takes Esc.
  closeOnEscape?: boolean;
  // What the project calls its shots.
  labels?: ProductionLabels;
}

const PRIORITY_OPTIONS = (Object.keys(PRIORITY_LABEL) as TaskPriority[]).map(p => ({ value: p, label: PRIORITY_LABEL[p] }));

const PRIORITY_TINT: Record<TaskPriority, string> = {
  low:    s.priorityLow,
  medium: s.priorityMedium,
  high:   s.priorityHigh,
};

const dateInput = (iso?: string | null) => (iso ? iso.slice(0, 10) : '');
const NO_PIPELINES: { id: string; name: string; order: number }[] = [];

// A shot's card opened: everything of it seen and changed in place, each change saved as it's
// made (and put back, told, if it fails).
export function ShotModal({ shot, sequence, projectId, members, teams, columns, onClose, onUpdate, onDelete, closeOnEscape = true, labels = DEFAULT_LABELS }: Props) {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  // The pipeline it goes through, and the Tasks steps of it its tasks may be part of; starting
  // its run is for whoever may run jobs.
  const pipelines = useSelector((state: RootState) => state.currentProject?.data?.pipelines ?? NO_PIPELINES);
  const userId = useSelector((state: RootState) => state.session?.userId);
  const myRole = useSelector((state: RootState) => state.currentProject?.data?.members?.find(m => m.userId === userId)?.role);
  const canRun = useRoleCan(projectId, myRole, 'jobs:run');
  const steps = usePipelineTaskSteps(projectId, shot.pipelineId ?? null);
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

  // Who it's assigned to, people and teams, saved one change after the other.
  const assigning = useRef<Promise<unknown>>(Promise.resolve());
  const [assignedTo, togglePerson] = useTickedList(shot.assignedTo, assigning,
    next => save({ assignedTo: next }, 'Failed to change who the shot is assigned to.'));
  const [teamIds, toggleTeam] = useTickedList(shot.teamIds ?? [], assigning,
    next => save({ teamIds: next }, 'Failed to change the teams the shot is assigned to.'));

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

  const changeTask = async (task: ProductionTask, changes: Partial<Pick<ProductionTask, 'status' | 'priority' | 'stepId'>>) => {
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
  const topPriority = summaryOf(tasks).priority;
  // Its place, as a path: its sequence, then its key.
  const path = [sequence?.name, shot.key].filter(Boolean).join(' / ') || labels.shot;

  // Another pipeline: its tasks are in no step of it (as the API leaves them).
  const changePipeline = async (pipelineId: string | null) => {
    if (await save({ pipelineId }, 'Failed to change its pipeline.')) setTasks(prev => prev.map(t => ({ ...t, stepId: null })));
  };

  return (
    <ModalShell title={path} icon={faClipboardList} onClose={onClose} className={s.modal}>
      <div className={s.layout} data-testid="shot-modal">
        <div className={s.main}>
          {editingName ? (
            <input
              autoFocus
              aria-label={`${labels.shot} name`}
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
                      {(task.assignedTo.length > 0 || (task.teamIds ?? []).length > 0) && (
                        <small className={s.taskMeta} data-testid={`task-${task.id}-assignees`}>
                          {[
                            ...members.filter(m => task.assignedTo.includes(m.userId)).map(m => m.username),
                            ...teams.filter(t => (task.teamIds ?? []).includes(t.id)).map(t => t.name),
                          ].join(', ')}
                        </small>
                      )}
                    </div>
                    {steps.length > 0 && (
                      <div className={s.taskStep} aria-label={`Step of ${task.name}`}>
                        <DropdownInput
                          value={task.stepId ?? ''} options={[{ value: '', label: 'No step' }, ...steps.map(st => ({ value: st.id, label: st.label }))]}
                          onChange={v => changeTask(task, { stepId: v || null })}
                        />
                      </div>
                    )}
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

          <ShotPipelineRuns projectId={projectId} shotId={shot.id} pipelineId={shot.pipelineId ?? null} pipelines={pipelines} canRun={canRun} />

          <DeliverableItems projectId={projectId} of={{ shotId: shot.id }} />
        </div>

        <aside className={s.side}>
          <LabeledSelect
            label="Status" htmlFor="shot-column" id="shot-column" value={columnOfShot(columns, shot)?.id ?? ''}
            onChange={e => save({ columnId: e.target.value }, 'Failed to move the shot.')}
            options={columns.map(c => ({ value: c.id, label: columnLabel(c) }))}
          />

          <LabeledSelect
            label="Pipeline" htmlFor="shot-pipeline" id="shot-pipeline" value={shot.pipelineId ?? ''}
            onChange={e => changePipeline(e.target.value || null)}
            options={[{ value: '', label: 'None' }, ...pipelines.map(p => ({ value: p.id, label: p.name }))]}
          />

          <div className={s.sideField}>
            <span className={s.sectionLabel}>Assigned to</span>
            <AssigneePicker
              idPrefix="shot" members={members} teams={teams} assignedTo={assignedTo} teamIds={teamIds}
              onTogglePerson={togglePerson} onToggleTeam={toggleTeam}
            />
          </div>

          <div className={s.sideField}>
            <span className={s.sectionLabel}>Priority</span>
            {topPriority ? (
              <span className={s.priorityValue} data-testid="shot-priority">
                <PriorityIcon priority={topPriority} /> {PRIORITY_LABEL[topPriority]}
                <small className={s.hint}>its open tasks' top</small>
              </span>
            ) : (
              <span className={s.hint}>No open tasks</span>
            )}
          </div>

          <div className={s.sideField}>
            <label className={s.sectionLabel} htmlFor="shot-due">Due date</label>
            <input
              id="shot-due" type="date" className={s.dateInput} value={dateInput(shot.dueDate)}
              onChange={e => save({ dueDate: e.target.value || null }, 'Failed to change the due date.')}
            />
            {shot.createdAt && (
              <dl className={s.dates}>
                <dt>Created</dt><dd>{formatDueDate(shot.createdAt)}</dd>
                {shot.updatedAt && <><dt>Updated</dt><dd>{formatDueDate(shot.updatedAt)}</dd></>}
              </dl>
            )}
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
            <PrimaryButton icon={faTrash} text={`Delete ${lower(labels.shot)}`} onClick={() => onDelete(shot.id)} />
          </div>
        </aside>
      </div>

      {editTask && (
        <EditTaskModal task={editTask} members={members} teams={teams} saving={saving} onSave={handleSaveTask} onClose={() => setEditTask(null)} />
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

/**
 * A list (who something is assigned to, or its teams) as it's ticked: shown at once, each tick
 * made on the one before (not on what the server has answered so far), saved after the saves
 * already in `queue`, and put back to what was saved last if it fails.
 */
function useTickedList(initial: string[], queue: MutableRefObject<Promise<unknown>>, persist: (next: string[]) => Promise<boolean>) {
  const [list, setList] = useState(initial);
  const ticked = useRef(initial);
  const saved = useRef(initial);
  const persistRef = useRef(persist);
  persistRef.current = persist;
  const toggle = (id: string, on: boolean) => {
    const next = on ? [...ticked.current.filter(x => x !== id), id] : ticked.current.filter(x => x !== id);
    ticked.current = next;
    setList(next);
    queue.current = queue.current.then(async () => {
      if (await persistRef.current(next)) {
        saved.current = next;
      } else {
        ticked.current = saved.current;
        setList(saved.current);
      }
    });
  };
  return [list, toggle] as const;
}
