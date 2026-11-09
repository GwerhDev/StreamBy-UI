import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../../store';
import { fetchDocuments } from '../../../store/documentsSlice';
import { getProjectReviews } from '../../../services/exports';
import { getWorkers } from '../../../services/workers';
import { Export, ReviewSession, Worker } from '../../../interfaces';
import { PipelineStepFields, StepData } from './PipelineStepFields';
import { completedByText, stepPanelKind } from './pipelineSteps';
import { usePipelineRunPeople } from './usePipelineRunPeople';

interface Props {
  projectId: string;
  node: { id: string; type?: string; data: Record<string, unknown> };
  editMode: boolean;
  // A change to the node's data (saved with the pipeline).
  onChange: (patch: Record<string, unknown>) => void;
}

const NO_EXPORTS: Pick<Export, 'id' | 'name'>[] = [];

// A pipeline's step, in the canvas's side panel: what it reads (the project's members, teams,
// documents, review sessions and workers), and its settings.
export function PipelineStepPanel({ projectId, node, editMode, onChange }: Props) {
  const dispatch = useDispatch<AppDispatch>();
  const panel = stepPanelKind(node.type);
  const { members, teams } = usePipelineRunPeople(projectId);
  const documents = useSelector((state: RootState) => (state.documents?.projectId === projectId ? state.documents.list : null));
  const exports = useSelector((state: RootState) => state.currentProject?.data?.exports ?? NO_EXPORTS) as Pick<Export, 'id' | 'name'>[];
  const [reviews, setReviews] = useState<ReviewSession[]>([]);
  const [workers, setWorkers] = useState<Worker[]>([]);

  useEffect(() => {
    if (node.type === 'meetingNode' && !documents) dispatch(fetchDocuments(projectId));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, node.type]);
  useEffect(() => {
    let cancelled = false;
    if (node.type === 'reviewGateNode' && editMode) getProjectReviews(projectId).then(list => { if (!cancelled) setReviews(list); }).catch(() => {});
    if (panel === 'worker') getWorkers(projectId).then(list => { if (!cancelled) setWorkers(list); }).catch(() => {});
    return () => { cancelled = true; };
  }, [projectId, node.type, panel, editMode]);

  if (!panel) return null;
  const data = node.data as StepData;
  const active = members.filter(m => m.status === 'active');
  const summary = panel === 'worker'
    ? (data.worker ? `${data.worker.name ?? data.worker.id} (${data.kind})` : 'Nobody: it passes')
    : panel === 'deliverable'
      ? (data.exportId ? exports.find(e => String(e.id) === data.exportId)?.name ?? 'An export' : 'Its card')
      : completedByText({ userIds: data.assignedTo ?? [], teamIds: data.teamIds ?? [] }, members, teams)!;

  // What the node shows under its name: who completes it.
  const change = (patch: StepData) => {
    const next = { ...data, ...patch };
    const subtitle = panel === 'worker'
      ? (next.worker ? `Worker: ${next.worker.name ?? next.worker.id}` : undefined)
      : panel === 'people' && (patch.assignedTo || patch.teamIds)
        ? completedByText({ userIds: next.assignedTo ?? [], teamIds: next.teamIds ?? [] }, members, teams) ?? undefined
        : undefined;
    onChange({ ...patch, ...(subtitle ? { subtitle } : {}) });
  };

  return (
    <PipelineStepFields
      nodeId={node.id} type={node.type ?? ''} panel={panel} data={data} editMode={editMode}
      members={active} teams={teams} documents={documents ?? []} reviews={reviews} workers={workers} exports={exports}
      summary={summary} onChange={change}
    />
  );
}
