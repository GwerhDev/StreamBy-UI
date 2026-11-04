import { DeliverableAppliesTo, DeliverableNodeState } from '../../../interfaces';

// What a Deliverable node applies to, as its panel picks it: one value for its appliesTo and
// exportId (an export's own is `export:<id>`).

export const targetOf = (data: { appliesTo?: unknown; exportId?: unknown }): string => {
  if (data.appliesTo === 'shots') return 'shots';
  if (data.appliesTo === 'exports') return typeof data.exportId === 'string' && data.exportId ? `export:${data.exportId}` : 'exports';
  return 'all';
};

export const fromTarget = (target: string): { appliesTo: DeliverableAppliesTo; exportId: string } => {
  if (target === 'shots') return { appliesTo: 'shots', exportId: '' };
  if (target === 'exports') return { appliesTo: 'exports', exportId: '' };
  if (target.startsWith('export:')) return { appliesTo: 'exports', exportId: target.slice('export:'.length) };
  return { appliesTo: 'all', exportId: '' };
};

export const targetOptions = (exports: { id: string; name: string }[]) => [
  { value: 'all', label: 'Every deliverable' },
  { value: 'shots', label: "Shots' deliverables" },
  { value: 'exports', label: "Exports' deliverables" },
  ...exports.map(e => ({ value: `export:${e.id}`, label: `${e.name}'s deliverables` })),
];

export const targetLabel = (target: string, exports: { id: string; name: string }[]) =>
  targetOptions(exports).find(o => o.value === target)?.label ?? "An export's deliverables";

// What a Deliverable node says of itself: ready, or what holds it.
export const gateSummary = (state: DeliverableNodeState | undefined) => {
  if (!state) return 'Known once the workflow is saved';
  if (!state.gated) return 'Ready: no gates before it';
  if (state.status === 'ready') return 'Ready';
  return `Blocked: ${state.blockedBy.map(b => `${b.label} (${b.reason})`).join('; ')}`;
};

// The same, short, on the node: its first blocker, and how many more.
export const gateSubtitle = (state: DeliverableNodeState | undefined) => {
  if (!state?.gated) return null;
  if (state.status === 'ready') return 'Ready';
  const [first, ...rest] = state.blockedBy;
  return `Blocked · ${first.label}${rest.length ? ` +${rest.length}` : ''}`;
};
