import { API_BASE } from '../config/api';
import { PipelineSuggestion } from '../interfaces';

export async function fetchPipelineSuggestion(
  projectId: string,
  exportId: string,
  nodeSchema: { nodes: object[]; edges: object[] },
): Promise<PipelineSuggestion> {
  const res = await fetch(`${API_BASE}/streamby/projects/${projectId}/pipeline-suggest`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ exportId, nodeSchema }),
  });
  if (!res.ok) throw new Error('Pipeline suggestion request failed');
  const data = await res.json();
  return data.suggestion as PipelineSuggestion;
}
