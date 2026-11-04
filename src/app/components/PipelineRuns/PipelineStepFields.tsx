import s from './PipelineStepPanel.module.css';
import { DocumentSummary, Export, Member, ReviewSession, Team, Worker } from '../../../interfaces';
import { AssigneePicker } from '../Production/AssigneePicker';
import { LabeledSelect } from '../Inputs/LabeledSelect';
import { StepPanelKind, workerValue } from './pipelineSteps';

export interface StepData {
  assignedTo?: string[];
  teamIds?: string[];
  documentId?: string;
  reviewId?: string;
  worker?: { source: string; id: string; name?: string } | null;
  kind?: string;
  resultMode?: 'derived' | 'version';
  exportId?: string;
}

interface Props {
  nodeId: string;
  type: string;
  panel: StepPanelKind;
  data: StepData;
  editMode: boolean;
  members: Member[];
  teams: Team[];
  documents: DocumentSummary[];
  reviews: ReviewSession[];
  workers: Worker[];
  exports: Pick<Export, 'id' | 'name'>[];
  // Who completes it, as it's read (shown when it can't be changed).
  summary: string;
  onChange: (patch: StepData) => void;
}

const toggled = (list: string[] | undefined, id: string, on: boolean) =>
  (on ? [...new Set([...(list ?? []), id])] : (list ?? []).filter(x => x !== id));

// What a pipeline's step takes: who completes it (its people and teams), what it's linked to (a
// Meeting's document, a Review Gate's session), its worker, or where its deliverable goes.
export function PipelineStepFields({ nodeId, type, panel, data, editMode, members, teams, documents, reviews, workers, exports, summary, onChange }: Props) {
  if (!editMode) {
    return (
      <div className={s.panel} data-testid="pipeline-step-panel">
        <span className={s.label}>{panel === 'deliverable' ? 'Delivered for' : 'Completed by'}</span>
        <span className={s.value}>{summary}</span>
      </div>
    );
  }
  const worker = workers.find(w => workerValue(w) === workerValue(data.worker));
  return (
    <div className={s.panel} data-testid="pipeline-step-panel">
      {type === 'meetingNode' && (
        <LabeledSelect
          label="Its notes" htmlFor={`${nodeId}-document`} value={data.documentId ?? ''}
          options={[{ value: '', label: 'None linked' }, ...documents.filter(d => d.kind === 'document').map(d => ({ value: d.id, label: d.title }))]}
          onChange={e => onChange({ documentId: e.target.value })}
        />
      )}
      {type === 'reviewGateNode' && (
        <LabeledSelect
          label="Review session" htmlFor={`${nodeId}-review`} value={data.reviewId ?? ''}
          options={[{ value: '', label: "Its card's asset's latest" }, ...reviews.map(r => ({ value: r.id, label: `${r.assetId.slice(-8)} · ${r.status}` }))]}
          onChange={e => onChange({ reviewId: e.target.value })}
        />
      )}
      {panel === 'people' && (
        <>
          <span className={s.label}>Completed by</span>
          <AssigneePicker
            idPrefix={`step-${nodeId}`} members={members} teams={teams}
            assignedTo={data.assignedTo ?? []} teamIds={data.teamIds ?? []}
            onTogglePerson={(id, on) => onChange({ assignedTo: toggled(data.assignedTo, id, on) })}
            onToggleTeam={(id, on) => onChange({ teamIds: toggled(data.teamIds, id, on) })}
          />
        </>
      )}
      {panel === 'worker' && (
        <>
          <LabeledSelect
            label="Worker" htmlFor={`${nodeId}-worker`} value={workerValue(data.worker)}
            options={[{ value: '', label: 'None: it passes' }, ...workers.map(w => ({ value: workerValue(w), label: w.name }))]}
            onChange={e => {
              const next = workers.find(w => workerValue(w) === e.target.value);
              onChange(next
                ? { worker: { source: next.source, id: next.id, name: next.name }, kind: next.kinds.includes(data.kind ?? '') ? data.kind : next.kinds[0] }
                : { worker: null, kind: '' });
            }}
          />
          {worker && (
            <>
              <LabeledSelect
                label="What it does" htmlFor={`${nodeId}-kind`} value={data.kind ?? ''}
                options={worker.kinds.map(k => ({ value: k, label: k }))}
                onChange={e => onChange({ kind: e.target.value })}
              />
              <LabeledSelect
                label="Its result" htmlFor={`${nodeId}-result`} value={data.resultMode ?? 'derived'}
                options={[{ value: 'derived', label: 'A new asset' }, { value: 'version', label: "The asset's new version" }]}
                onChange={e => onChange({ resultMode: e.target.value as 'derived' | 'version' })}
              />
            </>
          )}
        </>
      )}
      {panel === 'deliverable' && (
        <LabeledSelect
          label="Delivered for" htmlFor={`${nodeId}-export`} value={data.exportId ?? ''}
          options={[{ value: '', label: 'Its card' }, ...exports.map(e => ({ value: String(e.id), label: e.name }))]}
          onChange={e => onChange({ exportId: e.target.value })}
        />
      )}
    </div>
  );
}
