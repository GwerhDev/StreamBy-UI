import s from './ShotPanel.module.css';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faXmark, faPlus, faCheck, faLink, faSpinner, faTrash, faPen,
} from '@fortawesome/free-solid-svg-icons';
import { AppDispatch } from '../../../store';
import { addApiResponse } from '../../../store/apiResponsesSlice';
import { useProjectMembers } from '../../../hooks/useProjectMembers';
import {
  getTasks, createTask, updateTask, deleteTask, updateShot,
} from '../../../services/production';
import {
  ProductionShot, ProductionTask, ShotStatus, TaskPriority,
} from '../../../interfaces';
import { ShotDeliverables } from './ShotDeliverables';
import { formatDueDate } from './dueDate';
import { EditShotModal, EditTaskModal } from './ProductionEditModals';

interface Props {
  shot: ProductionShot;
  projectId: string;
  onClose: () => void;
  onUpdate: (shot: ProductionShot) => void;
  onDelete: (id: string) => void;
}

const STATUSES: ShotStatus[] = ['todo', 'in_progress', 'review', 'done'];
const STATUS_LABEL: Record<ShotStatus, string> = {
  todo: 'To Do',
  in_progress: 'In Progress',
  review: 'Review',
  done: 'Done',
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

export function ShotPanel({ shot, projectId, onClose, onUpdate, onDelete }: Props) {
  const navigate = useNavigate();
  const [tasks, setTasks]               = useState<ProductionTask[]>([]);
  const [loadingTasks, setLoadingTasks] = useState(true);
  const [newTaskName, setNewTaskName]   = useState('');
  const [addingTask, setAddingTask]     = useState(false);
  const [savingTask, setSavingTask]     = useState(false);
  const [editingShot, setEditingShot]   = useState(false);
  const [editTask, setEditTask]         = useState<ProductionTask | null>(null);
  const [saving, setSaving]             = useState(false);
  const { members, nameOf } = useProjectMembers(projectId);

  const dispatch = useDispatch<AppDispatch>();
  // A failed change says so, instead of failing silently.
  const failed = (err: unknown, fallback: string) =>
    dispatch(addApiResponse({ message: err instanceof Error && err.message ? err.message : fallback, type: 'error' }));

  useEffect(() => {
    let cancelled = false;
    setLoadingTasks(true);
    setTasks([]);
    getTasks(projectId, shot.id)
      .then(t => { if (!cancelled) setTasks(t); })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoadingTasks(false); });
    return () => { cancelled = true; };
  }, [projectId, shot.id]);

  const handleStatusChange = async (status: ShotStatus) => {
    try {
      const updated = await updateShot(projectId, shot.id, { status });
      onUpdate(updated);
    } catch (err) {
      failed(err, "Failed to change the shot's status.");
    }
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskName.trim()) return;
    setSavingTask(true);
    try {
      const task = await createTask(projectId, shot.id, { name: newTaskName.trim() });
      setTasks(prev => [...prev, task]);
      setNewTaskName('');
      setAddingTask(false);
    } catch (err) {
      failed(err, 'Failed to add the task.');
    } finally { setSavingTask(false); }
  };

  const handleTaskDone = async (task: ProductionTask) => {
    const next: ShotStatus = task.status === 'done' ? 'todo' : 'done';
    setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: next } : t));
    try {
      await updateTask(projectId, shot.id, task.id, { status: next });
    } catch (err) {
      setTasks(prev => prev.map(t => t.id === task.id ? task : t));
      failed(err, 'Failed to update the task.');
    }
  };

  const handleTaskPriority = async (task: ProductionTask, priority: TaskPriority) => {
    setTasks(prev => prev.map(t => t.id === task.id ? { ...t, priority } : t));
    try {
      await updateTask(projectId, shot.id, task.id, { priority });
    } catch (err) {
      setTasks(prev => prev.map(t => t.id === task.id ? task : t));
      failed(err, 'Failed to update the task.');
    }
  };

  const handleDeleteTask = async (task: ProductionTask) => {
    setTasks(prev => prev.filter(t => t.id !== task.id));
    try {
      await deleteTask(projectId, shot.id, task.id);
    } catch (err) {
      setTasks(prev => [...prev, task]);
      failed(err, 'Failed to delete the task.');
    }
  };

  const handleSaveShot = async (changes: Partial<ProductionShot>) => {
    setSaving(true);
    try {
      onUpdate(await updateShot(projectId, shot.id, changes as Parameters<typeof updateShot>[2]));
      setEditingShot(false);
    } catch (err) {
      failed(err, 'Failed to save the shot.');
    } finally { setSaving(false); }
  };

  const handleSaveTask = async (changes: Partial<ProductionTask>) => {
    if (!editTask) return;
    setSaving(true);
    try {
      const updated = await updateTask(projectId, shot.id, editTask.id, changes as Parameters<typeof updateTask>[3]);
      setTasks(prev => prev.map(t => (t.id === updated.id ? updated : t)));
      setEditTask(null);
    } catch (err) {
      failed(err, 'Failed to save the task.');
    } finally { setSaving(false); }
  };

  const doneCount = tasks.filter(t => t.status === 'done').length;
  const totalCount = tasks.length;

  return (
    <div className={s.panel}>
      {/* Header */}
      <div className={s.header}>
        <span className={s.title}>{shot.name}</span>
        <div className={s.headerActions}>
          <button type="button" className={s.closeBtn} onClick={() => setEditingShot(true)} title="Edit shot">
            <FontAwesomeIcon icon={faPen} />
          </button>
          <button type="button" className={s.deleteBtn} onClick={() => onDelete(shot.id)} title="Delete shot">
            <FontAwesomeIcon icon={faTrash} />
          </button>
          <button type="button" className={s.closeBtn} onClick={onClose} title="Close">
            <FontAwesomeIcon icon={faXmark} />
          </button>
        </div>
      </div>

      <div className={s.body}>
        {/* Status */}
        <div className={s.field}>
          <span className={s.fieldLabel}>Status</span>
          <div className={s.fieldValue}>
            <select
              className={`${s.chip} ${STATUS_CHIP[shot.status]}`}
              value={shot.status}
              onChange={e => handleStatusChange(e.target.value as ShotStatus)}
            >
              {STATUSES.map(st => <option key={st} value={st}>{STATUS_LABEL[st]}</option>)}
            </select>
          </div>
        </div>

        {/* Description */}
        {shot.description && <p className={s.description}>{shot.description}</p>}

        {/* Assignees */}
        <div className={s.field}>
          <span className={s.fieldLabel}>Assigned</span>
          <span className={s.fieldText} data-testid="shot-assignees">
            {shot.assignedTo?.length ? shot.assignedTo.map(nameOf).join(', ') : 'Nobody'}
          </span>
        </div>

        {/* Due date */}
        {shot.dueDate && (
          <div className={s.field}>
            <span className={s.fieldLabel}>Due</span>
            <span className={s.fieldText}>{formatDueDate(shot.dueDate)}</span>
          </div>
        )}

        {/* Linked asset */}
        {shot.assetId && (
          <div className={s.field}>
            <span className={s.fieldLabel}>Asset</span>
            <button
              type="button"
              className={s.linkBtn}
              onClick={() => navigate(`/project/${projectId}/storage`)}
            >
              <FontAwesomeIcon icon={faLink} /> View in Storage
            </button>
          </div>
        )}

        {/* Linked export */}
        {shot.exportId && (
          <div className={s.field}>
            <span className={s.fieldLabel}>Export</span>
            <button
              type="button"
              className={s.linkBtn}
              onClick={() => navigate(`/project/${projectId}/workflow/exports/${shot.exportId}`)}
            >
              <FontAwesomeIcon icon={faLink} /> View Export
            </button>
          </div>
        )}

        <ShotDeliverables projectId={projectId} shotId={shot.id} />

        <div className={s.divider} />

        {/* Tasks */}
        <div className={s.taskSection}>
          <div className={s.taskHeader}>
            <span className={s.fieldLabel}>
              Tasks
              {totalCount > 0 && (
                <span className={s.taskCount}>{doneCount}/{totalCount}</span>
              )}
            </span>
            <button type="button" className={s.addTaskBtn} onClick={() => setAddingTask(true)}>
              <FontAwesomeIcon icon={faPlus} /> Add
            </button>
          </div>

          {totalCount > 0 && (
            <div className={s.progressBar}>
              <div
                className={s.progressFill}
                style={{ width: `${totalCount ? (doneCount / totalCount) * 100 : 0}%` }}
              />
            </div>
          )}

          {loadingTasks ? (
            <div className={s.taskLoading}>
              <FontAwesomeIcon icon={faSpinner} spin />
            </div>
          ) : (
            <div className={s.taskList}>
              {tasks.map(task => (
                <div key={task.id} className={`${s.taskRow} ${task.status === 'done' ? s.taskRowDone : ''}`}>
                  <button
                    type="button"
                    className={`${s.checkbox} ${task.status === 'done' ? s.checkboxDone : ''}`}
                    onClick={() => handleTaskDone(task)}
                    aria-label="Toggle done"
                  >
                    {task.status === 'done' && <FontAwesomeIcon icon={faCheck} />}
                  </button>
                  <span className={s.taskName}>
                    {task.name}
                    {(task.assignedTo || task.dueDate) && (
                      <small className={s.taskMeta}>
                        {[task.assignedTo && nameOf(task.assignedTo), task.dueDate && formatDueDate(task.dueDate)].filter(Boolean).join(' · ')}
                      </small>
                    )}
                  </span>
                  <select
                    className={`${s.priorityChip} ${PRIORITY_CHIP[task.priority]}`}
                    value={task.priority}
                    onChange={e => handleTaskPriority(task, e.target.value as TaskPriority)}
                    onClick={e => e.stopPropagation()}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Med</option>
                    <option value="high">High</option>
                  </select>
                  <button
                    type="button"
                    className={s.taskDeleteBtn}
                    onClick={() => setEditTask(task)}
                    aria-label={`Edit task ${task.name}`}
                  >
                    <FontAwesomeIcon icon={faPen} />
                  </button>
                  <button
                    type="button"
                    className={s.taskDeleteBtn}
                    onClick={() => handleDeleteTask(task)}
                    aria-label="Delete task"
                  >
                    <FontAwesomeIcon icon={faXmark} />
                  </button>
                </div>
              ))}

              {addingTask ? (
                <form onSubmit={handleAddTask} className={s.addTaskForm}>
                  <input
                    autoFocus
                    className={s.addTaskInput}
                    value={newTaskName}
                    onChange={e => setNewTaskName(e.target.value)}
                    placeholder="Task name…"
                    onKeyDown={e => e.key === 'Escape' && setAddingTask(false)}
                  />
                  <button type="submit" className={s.addTaskOk} disabled={savingTask || !newTaskName.trim()}>
                    {savingTask ? <FontAwesomeIcon icon={faSpinner} spin /> : <FontAwesomeIcon icon={faCheck} />}
                  </button>
                  <button type="button" className={s.addTaskCancel} onClick={() => setAddingTask(false)}>
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
      </div>

      {editingShot && (
        <EditShotModal shot={shot} members={members} saving={saving} onSave={handleSaveShot} onClose={() => setEditingShot(false)} />
      )}
      {editTask && (
        <EditTaskModal task={editTask} members={members} saving={saving} onSave={handleSaveTask} onClose={() => setEditTask(null)} />
      )}
    </div>
  );
}
