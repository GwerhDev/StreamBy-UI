import s from './ShotPanel.module.css';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faXmark, faPlus, faCheck, faCircle, faLink, faSpinner,
} from '@fortawesome/free-solid-svg-icons';
import {
  getTasks, createTask, updateTask, deleteTask, updateShot,
} from '../../../services/production';
import {
  ProductionShot, ProductionTask, ShotStatus, TaskPriority,
} from '../../../interfaces';

interface Props {
  shot: ProductionShot;
  projectId: string;
  onClose: () => void;
  onUpdate: (shot: ProductionShot) => void;
}

const STATUSES: ShotStatus[] = ['todo', 'in_progress', 'review', 'done'];
const STATUS_LABEL: Record<ShotStatus, string> = {
  todo: 'To Do',
  in_progress: 'In Progress',
  review: 'Review',
  done: 'Done',
};

const PRIORITY_CLASS: Record<TaskPriority, string> = {
  low: s.priorityLow,
  medium: s.priorityMedium,
  high: s.priorityHigh,
};

export function ShotPanel({ shot, projectId, onClose, onUpdate }: Props) {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<ProductionTask[]>([]);
  const [loadingTasks, setLoadingTasks] = useState(true);
  const [newTaskName, setNewTaskName] = useState('');
  const [addingTask, setAddingTask] = useState(false);
  const [savingTask, setSavingTask] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoadingTasks(true);
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
    } catch {}
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
    } finally {
      setSavingTask(false);
    }
  };

  const handleTaskStatus = async (task: ProductionTask) => {
    const next: ShotStatus = task.status === 'done' ? 'todo' : 'done';
    setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: next } : t));
    try {
      await updateTask(projectId, shot.id, task.id, { status: next });
    } catch {
      setTasks(prev => prev.map(t => t.id === task.id ? task : t));
    }
  };

  const handleTaskPriority = async (task: ProductionTask, priority: TaskPriority) => {
    setTasks(prev => prev.map(t => t.id === task.id ? { ...t, priority } : t));
    try {
      await updateTask(projectId, shot.id, task.id, { priority });
    } catch {
      setTasks(prev => prev.map(t => t.id === task.id ? task : t));
    }
  };

  const handleDeleteTask = async (task: ProductionTask) => {
    setTasks(prev => prev.filter(t => t.id !== task.id));
    try {
      await deleteTask(projectId, shot.id, task.id);
    } catch {
      setTasks(prev => [...prev, task]);
    }
  };

  return (
    <div className={s.panel}>
      <div className={s.header}>
        <span className={s.title}>{shot.name}</span>
        <button type="button" className={s.closeBtn} onClick={onClose}>
          <FontAwesomeIcon icon={faXmark} />
        </button>
      </div>

      <div className={s.body}>
        {/* Status */}
        <div className={s.section}>
          <span className={s.sectionLabel}>Status</span>
          <select
            className={s.statusSelect}
            value={shot.status}
            onChange={e => handleStatusChange(e.target.value as ShotStatus)}
          >
            {STATUSES.map(st => <option key={st} value={st}>{STATUS_LABEL[st]}</option>)}
          </select>
        </div>

        {/* Due date */}
        {shot.dueDate && (
          <div className={s.section}>
            <span className={s.sectionLabel}>Due</span>
            <span className={s.sectionValue}>{new Date(shot.dueDate).toLocaleDateString()}</span>
          </div>
        )}

        {/* Linked asset */}
        {shot.assetId && (
          <div className={s.section}>
            <span className={s.sectionLabel}>Asset</span>
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
          <div className={s.section}>
            <span className={s.sectionLabel}>Export</span>
            <button
              type="button"
              className={s.linkBtn}
              onClick={() => navigate(`/project/${projectId}/dashboard/exports/${shot.exportId}`)}
            >
              <FontAwesomeIcon icon={faLink} /> View Export
            </button>
          </div>
        )}

        {/* Tasks */}
        <div className={s.section}>
          <div className={s.taskHeader}>
            <span className={s.sectionLabel}>Tasks</span>
            <button type="button" className={s.addTaskBtn} onClick={() => setAddingTask(true)}>
              <FontAwesomeIcon icon={faPlus} />
            </button>
          </div>

          {loadingTasks ? (
            <FontAwesomeIcon icon={faSpinner} spin className={s.taskSpinner} />
          ) : (
            <div className={s.taskList}>
              {tasks.map(task => (
                <div key={task.id} className={s.taskRow}>
                  <button
                    type="button"
                    className={`${s.taskCheck} ${task.status === 'done' ? s.taskCheckDone : ''}`}
                    onClick={() => handleTaskStatus(task)}
                  >
                    {task.status === 'done' && <FontAwesomeIcon icon={faCheck} />}
                    {task.status !== 'done' && <FontAwesomeIcon icon={faCircle} className={s.taskCircle} />}
                  </button>
                  <span className={`${s.taskName} ${task.status === 'done' ? s.taskNameDone : ''}`}>
                    {task.name}
                  </span>
                  <select
                    className={`${s.priorityBadge} ${PRIORITY_CLASS[task.priority]}`}
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
                    onClick={() => handleDeleteTask(task)}
                  >
                    <FontAwesomeIcon icon={faXmark} />
                  </button>
                </div>
              ))}

              {addingTask && (
                <form onSubmit={handleAddTask} className={s.addTaskForm}>
                  <input
                    autoFocus
                    className={s.addTaskInput}
                    value={newTaskName}
                    onChange={e => setNewTaskName(e.target.value)}
                    placeholder="Task name…"
                  />
                  <button type="submit" className={s.addTaskSubmit} disabled={savingTask}>
                    {savingTask ? <FontAwesomeIcon icon={faSpinner} spin /> : <FontAwesomeIcon icon={faCheck} />}
                  </button>
                  <button type="button" className={s.addTaskCancel} onClick={() => setAddingTask(false)}>
                    <FontAwesomeIcon icon={faXmark} />
                  </button>
                </form>
              )}

              {!addingTask && tasks.length === 0 && (
                <p className={s.taskEmpty}>No tasks. <button type="button" className={s.taskEmptyAdd} onClick={() => setAddingTask(true)}>Add one</button></p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
