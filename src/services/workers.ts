import { API_BASE } from '../config/api';
import { CreateWorkerPayload, JobRecord, Worker, WorkerResultMode } from '../interfaces';

const base = (projectId: string) => `${API_BASE}/streamby/projects/${encodeURIComponent(projectId)}`;

async function request<T>(url: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(url, {
    credentials: 'include',
    ...init,
    headers: init.body ? { 'Content-Type': 'application/json' } : undefined,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message || `HTTP ${res.status}`);
  }
  return res.json();
}

// The workers a project can use: the host's and its own.
export const getWorkers = async (projectId: string): Promise<Worker[]> =>
  (await request<{ data: Worker[] }>(`${base(projectId)}/workers`)).data;

export const createWorker = async (projectId: string, payload: CreateWorkerPayload): Promise<Worker> =>
  (await request<{ data: Worker }>(`${base(projectId)}/workers`, { method: 'POST', body: JSON.stringify(payload) })).data;

export const deleteWorker = (projectId: string, workerId: string): Promise<unknown> =>
  request(`${base(projectId)}/workers/${encodeURIComponent(workerId)}`, { method: 'DELETE' });

// A project's jobs (of one asset if given), newest first.
export const getJobs = async (projectId: string, assetId?: string): Promise<JobRecord[]> =>
  (await request<{ data: JobRecord[] }>(`${base(projectId)}/jobs${assetId ? `?${new URLSearchParams({ assetId })}` : ''}`)).data;

export interface ProcessAssetPayload {
  assetId: string;
  versionId?: string;
  worker: { source: Worker['source']; id: string };
  kind: string;
  profile?: Record<string, unknown>;
  resultMode: WorkerResultMode;
}

export const processAsset = async (projectId: string, payload: ProcessAssetPayload): Promise<JobRecord> =>
  (await request<{ job: JobRecord }>(`${base(projectId)}/jobs/process`, { method: 'POST', body: JSON.stringify(payload) })).job;

export const retryJob = async (projectId: string, jobId: string): Promise<JobRecord> =>
  (await request<{ job: JobRecord }>(`${base(projectId)}/jobs/${encodeURIComponent(jobId)}/retry`, { method: 'POST' })).job;
