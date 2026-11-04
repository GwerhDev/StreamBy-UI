import { API_BASE } from "../config/api";
import { Pipeline, PipelinePayload, PipelineRef, PipelineRun } from "../interfaces";

export async function listPipelines(projectId: string): Promise<Pipeline[]> {
  const res = await fetch(`${API_BASE}/streamby/projects/${projectId}/pipelines`, {
    method: 'GET',
    credentials: 'include',
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message || `HTTP ${res.status}`);
  }
  const { pipelines } = await res.json();
  return pipelines;
}

export async function getPipeline(projectId: string, pipelineId: string): Promise<Pipeline> {
  const res = await fetch(`${API_BASE}/streamby/projects/${projectId}/pipelines/${pipelineId}`, {
    method: 'GET',
    credentials: 'include',
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message || `HTTP ${res.status}`);
  }
  const { pipeline } = await res.json();
  return pipeline;
}

/** The pipeline made, and the project's pipelines (as references) as they are now. */
export async function createPipeline(projectId: string, payload: { name: string; description?: string }): Promise<{ pipeline: Pipeline; pipelines: PipelineRef[] }> {
  const res = await fetch(`${API_BASE}/streamby/projects/${projectId}/pipelines`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message || `HTTP ${res.status}`);
  }
  return res.json();
}

export async function updatePipeline(projectId: string, pipelineId: string, payload: Partial<PipelinePayload>): Promise<Pipeline> {
  const res = await fetch(`${API_BASE}/streamby/projects/${projectId}/pipelines/${pipelineId}`, {
    method: 'PATCH',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message || `HTTP ${res.status}`);
  }
  const { pipeline } = await res.json();
  return pipeline;
}

/** The project's pipelines (as references) as they are after it's gone. */
export async function deletePipeline(projectId: string, pipelineId: string): Promise<PipelineRef[]> {
  const res = await fetch(`${API_BASE}/streamby/projects/${projectId}/pipelines/${pipelineId}`, {
    method: 'DELETE',
    credentials: 'include',
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message || `HTTP ${res.status}`);
  }
  return (await res.json()).pipelines ?? [];
}

async function read<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message || `HTTP ${res.status}`);
  }
  return res.json();
}

/** A pipeline's runs, newest first (of one card if given). */
export async function listPipelineRuns(projectId: string, pipelineId: string, shotId?: string): Promise<PipelineRun[]> {
  const query = shotId ? `?${new URLSearchParams({ shotId })}` : '';
  const res = await fetch(`${API_BASE}/streamby/projects/${projectId}/pipelines/${pipelineId}/runs${query}`, { method: 'GET', credentials: 'include' });
  return (await read<{ runs: PipelineRun[] }>(res)).runs;
}

/** A card's runs, of every pipeline it went through, newest first. */
export async function listShotPipelineRuns(projectId: string, shotId: string): Promise<PipelineRun[]> {
  const res = await fetch(`${API_BASE}/streamby/projects/${projectId}/production/shots/${shotId}/pipeline-runs`, { method: 'GET', credentials: 'include' });
  return (await read<{ runs: PipelineRun[] }>(res)).runs;
}

/** A card's run of its pipeline, started by hand. */
export async function startPipelineRun(projectId: string, pipelineId: string, shotId: string): Promise<PipelineRun> {
  const res = await fetch(`${API_BASE}/streamby/projects/${projectId}/pipelines/${pipelineId}/runs`, {
    method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ shotId }),
  });
  return (await read<{ run: PipelineRun }>(res)).run;
}
