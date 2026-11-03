import { BoardColumn, ProductionShot, ProductionTask, ShotStatus, TaskPriority, TaskSummary } from '../../../interfaces';

export const STATUSES: ShotStatus[] = ['todo', 'in_progress', 'review', 'done'];

export const STATUS_LABEL: Record<ShotStatus, string> = {
  todo: 'To Do',
  in_progress: 'In Progress',
  review: 'Review',
  done: 'Done',
};

export const PRIORITY_LABEL: Record<TaskPriority, string> = { low: 'Low', medium: 'Medium', high: 'High' };

const PRIORITY_RANK: Record<TaskPriority, number> = { low: 1, medium: 2, high: 3 };

// How a shot's tasks go, as the server sums them up: done of total, the highest priority among
// those still open, and who they're assigned to (people and teams, each once), which a board
// finds the shot by.
export function summaryOf(tasks: Pick<ProductionTask, 'status' | 'priority' | 'assignedTo' | 'teamIds'>[]): TaskSummary {
  const open = tasks.filter(t => t.status !== 'done');
  const priority = open.reduce<TaskPriority | null>(
    (top, t) => (!top || PRIORITY_RANK[t.priority] > PRIORITY_RANK[top] ? t.priority : top), null);
  return {
    done: tasks.length - open.length, total: tasks.length, priority,
    assignedTo: [...new Set(tasks.flatMap(t => t.assignedTo ?? []))],
    teamIds: [...new Set(tasks.flatMap(t => t.teamIds ?? []))],
  };
}

/** The column a card is in: its own, or (answered without one) the first of its status. */
export const columnOfShot = (columns: BoardColumn[], shot: Pick<ProductionShot, 'columnId' | 'status'>): BoardColumn | undefined =>
  columns.find(c => c.id === shot.columnId) ?? columns.find(c => c.status === shot.status);
