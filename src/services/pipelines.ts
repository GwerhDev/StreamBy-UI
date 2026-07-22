import { API_BASE } from "../config/api";
import { Pipeline, PipelinePayload } from "../interfaces";

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

export async function createPipeline(projectId: string, payload: { name: string; description?: string }): Promise<Pipeline> {
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
  const { pipeline } = await res.json();
  return pipeline;
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

export async function deletePipeline(projectId: string, pipelineId: string): Promise<void> {
  const res = await fetch(`${API_BASE}/streamby/projects/${projectId}/pipelines/${pipelineId}`, {
    method: 'DELETE',
    credentials: 'include',
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message || `HTTP ${res.status}`);
  }
}
