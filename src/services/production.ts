import { API_BASE } from '../config/api';
import { ProductionSequence, ProductionShot, ProductionTask } from '../interfaces';

async function request<T>(url: string, options: RequestInit): Promise<T> {
  const res = await fetch(url, { credentials: 'include', ...options });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message || `HTTP ${res.status}`);
  }
  return res.json();
}

function json(method: string, body: object): RequestInit {
  return { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) };
}

const base = (projectId: string) => `${API_BASE}/streamby/projects/${projectId}/production`;

// ── Sequences ──────────────────────────────────────────────────────────────

export async function getSequences(projectId: string): Promise<ProductionSequence[]> {
  const { sequences } = await request<{ sequences: ProductionSequence[] }>(
    `${base(projectId)}/sequences`, { method: 'GET' },
  );
  return sequences;
}

export async function createSequence(
  projectId: string,
  payload: { name: string; description?: string; order?: number },
): Promise<ProductionSequence> {
  const { sequence } = await request<{ sequence: ProductionSequence }>(
    `${base(projectId)}/sequences`, json('POST', payload),
  );
  return sequence;
}

export async function updateSequence(
  projectId: string,
  seqId: string,
  payload: Partial<{ name: string; description: string; order: number }>,
): Promise<ProductionSequence> {
  const { sequence } = await request<{ sequence: ProductionSequence }>(
    `${base(projectId)}/sequences/${seqId}`, json('PATCH', payload),
  );
  return sequence;
}

export async function deleteSequence(projectId: string, seqId: string): Promise<void> {
  await request(`${base(projectId)}/sequences/${seqId}`, { method: 'DELETE' });
}

// ── Shots ──────────────────────────────────────────────────────────────────

export async function getShots(projectId: string, seqId: string): Promise<ProductionShot[]> {
  const { shots } = await request<{ shots: ProductionShot[] }>(
    `${base(projectId)}/sequences/${seqId}/shots`, { method: 'GET' },
  );
  return shots;
}

export async function createShot(
  projectId: string,
  seqId: string,
  payload: {
    name: string;
    description?: string;
    status?: string;
    assignedTo?: string[];
    assetId?: string;
    exportId?: string;
    dueDate?: string;
    order?: number;
  },
): Promise<ProductionShot> {
  const { shot } = await request<{ shot: ProductionShot }>(
    `${base(projectId)}/sequences/${seqId}/shots`, json('POST', payload),
  );
  return shot;
}

export async function updateShot(
  projectId: string,
  shotId: string,
  payload: Partial<{
    name: string;
    description: string;
    status: string;
    assignedTo: string[];
    assetId: string | null;
    exportId: string | null;
    dueDate: string | null;
    order: number;
  }>,
): Promise<ProductionShot> {
  const { shot } = await request<{ shot: ProductionShot }>(
    `${base(projectId)}/shots/${shotId}`, json('PATCH', payload),
  );
  return shot;
}

export async function deleteShot(projectId: string, shotId: string): Promise<void> {
  await request(`${base(projectId)}/shots/${shotId}`, { method: 'DELETE' });
}

// ── Tasks ──────────────────────────────────────────────────────────────────

export async function getTasks(projectId: string, shotId: string): Promise<ProductionTask[]> {
  const { tasks } = await request<{ tasks: ProductionTask[] }>(
    `${base(projectId)}/shots/${shotId}/tasks`, { method: 'GET' },
  );
  return tasks;
}

export async function createTask(
  projectId: string,
  shotId: string,
  payload: {
    name: string;
    status?: string;
    priority?: string;
    assignedTo?: string;
    dueDate?: string;
    notes?: string;
  },
): Promise<ProductionTask> {
  const { task } = await request<{ task: ProductionTask }>(
    `${base(projectId)}/shots/${shotId}/tasks`, json('POST', payload),
  );
  return task;
}

export async function updateTask(
  projectId: string,
  shotId: string,
  taskId: string,
  payload: Partial<{
    name: string;
    status: string;
    priority: string;
    assignedTo: string | null;
    dueDate: string | null;
    notes: string;
  }>,
): Promise<ProductionTask> {
  const { task } = await request<{ task: ProductionTask }>(
    `${base(projectId)}/shots/${shotId}/tasks/${taskId}`, json('PATCH', payload),
  );
  return task;
}

export async function deleteTask(projectId: string, shotId: string, taskId: string): Promise<void> {
  await request(`${base(projectId)}/shots/${shotId}/tasks/${taskId}`, { method: 'DELETE' });
}
