import s from './PipelineRuns.module.css';
import { Member, PipelineRun, Team } from '../../../interfaces';
import { StepStatusBadge } from './StepStatusBadge';
import { RunSteps } from './RunSteps';

const TRIGGERS: Record<PipelineRun['trigger'], string> = {
  manual: 'Started by hand', card_linked: 'Started when linked', card_done: 'Started when done', deliverable_marked: 'Started when delivered',
};

interface Props {
  run: PipelineRun;
  members: Member[];
  teams: Team[];
  // Its title: its card (a pipeline's runs), or its pipeline (a card's runs).
  title: string;
}

// A run: what it's of, where it is now, and each of its steps.
export function RunCard({ run, members, teams, title }: Props) {
  const current = run.steps.filter(st => run.current.includes(st.nodeId)).map(st => st.label);
  return (
    <article className={s.run} data-testid={`run-${run.id}`}>
      <header className={s.runHead}>
        <span className={s.runTitle}>{title}</span>
        <StepStatusBadge status={run.status} />
      </header>
      <p className={s.runMeta}>
        {TRIGGERS[run.trigger]}
        {current.length > 0 && <> · Now: <strong>{current.join(', ')}</strong></>}
      </p>
      <RunSteps steps={run.steps} members={members} teams={teams} />
    </article>
  );
}
