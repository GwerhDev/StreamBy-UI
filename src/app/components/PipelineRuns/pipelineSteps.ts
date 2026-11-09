import { Member, PipelineTrigger, StepCompletedBy, Team } from '../../../interfaces';

// What a pipeline's node is as a step, as the API reads it: done by people (a Meeting, Tasks, a
// Review Gate), by a worker (a process node set to one), a Deliverable, or one that passes.

export const PEOPLE_STEP_TYPES = new Set(['meetingNode', 'tasksNode', 'reviewGateNode']);
export const WORKER_STEP_TYPES = new Set([
  'transcodeNode', 'thumbnailNode', 'formatConvertNode', 'lodNode',
  'colorGradeNode', 'audioMixNode', 'subtitleNode', 'vfxNode', 'transcriptionNode', 'upscaleNode',
]);

// Nodes that stand for nothing StreamBy does: kept only so the canvases saved with them show them.
export const RETIRED_TYPES = new Set(['captionNode', 'renderJobNode', 'assetDependencyNode', 'qcCheckNode', 'proceduralAssetNode', 'pipelineSuggestNode']);

export type StepPanelKind = 'people' | 'worker' | 'deliverable';

/** Which settings a node takes as a pipeline's step; none for one that passes. */
export function stepPanelKind(type: string | undefined): StepPanelKind | null {
  if (!type) return null;
  if (PEOPLE_STEP_TYPES.has(type)) return 'people';
  if (WORKER_STEP_TYPES.has(type)) return 'worker';
  if (type === 'deliverableNode') return 'deliverable';
  return null;
}

/** A worker as a select's value. */
export const workerValue = (worker: { source?: string; id?: string } | undefined | null) =>
  (worker?.source && worker?.id ? `${worker.source}:${worker.id}` : '');

export const TRIGGER_OPTIONS: { value: PipelineTrigger; label: string }[] = [
  { value: 'card_linked', label: 'A card is linked to it' },
  { value: 'card_done', label: 'A card is done' },
  { value: 'deliverable_marked', label: "An asset is marked as a card's deliverable" },
];

/** Who completes a step, as it's read: its people and teams by name, or its worker. */
export function completedByText(by: StepCompletedBy, members: Member[], teams: Team[]): string | null {
  if (!by) return null;
  if ('worker' in by) return `${by.worker} (${by.kind})`;
  const names = [
    ...by.userIds.map(id => members.find(m => m.userId === id)?.username ?? 'Someone'),
    ...by.teamIds.map(id => teams.find(t => t.id === id)?.name ?? 'A team'),
  ];
  return names.length ? names.join(', ') : 'Nobody assigned';
}
