import s from './PipelineRuns.module.css';
import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { faPlay } from '@fortawesome/free-solid-svg-icons';
import { AppDispatch, RootState } from '../../../store';
import { addApiResponse } from '../../../store/apiResponsesSlice';
import { listShotPipelineRuns, startPipelineRun } from '../../../services/pipelines';
import { PipelineRef, PipelineRun } from '../../../interfaces';
import { ActionButton } from '../Buttons/ActionButton';
import { RunCard } from './RunCard';
import { usePipelineRunPeople } from './usePipelineRunPeople';

interface Props {
  projectId: string;
  shotId: string;
  // The pipeline it's linked to, if any.
  pipelineId: string | null;
  pipelines: PipelineRef[];
  canRun: boolean;
}

// Where a card is in its pipelines: its runs, read again on each change the websocket tells, and
// starting its run by hand (for whoever can run jobs) when it has none going.
export function ShotPipelineRuns({ projectId, shotId, pipelineId, pipelines, canRun }: Props) {
  const dispatch = useDispatch<AppDispatch>();
  const changes = useSelector((state: RootState) => state.pipelineRuns?.eventSeq ?? 0);
  const { members, teams } = usePipelineRunPeople(projectId);
  const [runs, setRuns] = useState<PipelineRun[]>([]);
  const [reads, setReads] = useState(0);
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    listShotPipelineRuns(projectId, shotId).then(list => { if (!cancelled) setRuns(list); }).catch(() => {});
    return () => { cancelled = true; };
  }, [projectId, shotId, changes, reads]);

  const going = runs.some(r => r.pipelineId === pipelineId && r.status === 'running');
  const nameOf = (id: string) => pipelines.find(p => p.id === id)?.name ?? 'A pipeline';

  const start = async () => {
    if (!pipelineId) return;
    setStarting(true);
    try {
      await startPipelineRun(projectId, pipelineId, shotId);
      dispatch(addApiResponse({ message: 'Run started.', type: 'success' }));
    } catch (err) {
      dispatch(addApiResponse({ message: err instanceof Error ? err.message : 'Failed to start its run.', type: 'error' }));
    } finally {
      setStarting(false);
      setReads(n => n + 1);
    }
  };

  if (!pipelineId && !runs.length) return null;
  return (
    <section className={s.section} aria-label="Pipeline runs">
      {pipelineId && canRun && !going && (
        <div className={s.sectionHead}>
          <span className={s.hint}>No run of {nameOf(pipelineId)} going.</span>
          <ActionButton icon={faPlay} text={starting ? 'Starting…' : 'Start run'} disabled={starting} onClick={start} />
        </div>
      )}
      {runs.length > 0 && (
        <ul className={s.list}>
          {runs.map(run => (
            <li key={run.id}><RunCard run={run} members={members} teams={teams} title={nameOf(run.pipelineId)} /></li>
          ))}
        </ul>
      )}
    </section>
  );
}
