import s from './PipelineRuns.module.css';
import { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../../store';
import { addApiResponse } from '../../../store/apiResponsesSlice';
import { setCurrentPipeline } from '../../../store/currentPipelineSlice';
import { listPipelineRuns, updatePipeline } from '../../../services/pipelines';
import { Pipeline, PipelineRun, PipelineTrigger } from '../../../interfaces';
import { Spinner } from '../Spinner';
import { EmptyBackground } from '../Backgrounds/EmptyBackground';
import { PipelineTriggers } from './PipelineTriggers';
import { RunCard } from './RunCard';
import { usePipelineRunPeople } from './usePipelineRunPeople';

interface Props {
  projectId: string;
  pipeline: Pipeline;
  canEdit: boolean;
}

// A pipeline's runs (each card going through it), read again on each change the websocket
// tells; and its triggers, each change saved by itself.
export function PipelineRunsView({ projectId, pipeline, canEdit }: Props) {
  const dispatch = useDispatch<AppDispatch>();
  const changes = useSelector((state: RootState) => state.pipelineRuns?.eventSeq ?? 0);
  const { members, teams } = usePipelineRunPeople(projectId);
  const [runs, setRuns] = useState<PipelineRun[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [triggers, setTriggers] = useState<PipelineTrigger[]>(pipeline.triggers ?? []);
  const saved = useRef<PipelineTrigger[]>(pipeline.triggers ?? []);

  useEffect(() => {
    let cancelled = false;
    listPipelineRuns(projectId, pipeline.id)
      .then(list => { if (!cancelled) { setRuns(list); setError(null); } })
      // A read again that fails keeps what was shown.
      .catch(err => { if (!cancelled) { setError(err instanceof Error ? err.message : 'Failed to read its runs.'); setRuns(prev => prev ?? []); } });
    return () => { cancelled = true; };
  }, [projectId, pipeline.id, changes]);

  const toggle = async (trigger: PipelineTrigger, on: boolean) => {
    const next = on ? [...triggers.filter(t => t !== trigger), trigger] : triggers.filter(t => t !== trigger);
    setTriggers(next);
    try {
      const updated = await updatePipeline(projectId, pipeline.id, { triggers: next });
      saved.current = updated.triggers ?? next;
      dispatch(setCurrentPipeline(updated));
      dispatch(addApiResponse({ message: 'Triggers saved.', type: 'success' }));
    } catch (err) {
      setTriggers(saved.current);
      dispatch(addApiResponse({ message: err instanceof Error ? err.message : 'Failed to save its triggers.', type: 'error' }));
    }
  };

  return (
    <div className={s.container}>
      <section className={s.section}>
        <PipelineTriggers triggers={triggers} disabled={!canEdit} onToggle={toggle} />
      </section>
      <section className={s.section} aria-label="Runs">
        {runs === null ? <Spinner bg={false} isLoading /> : runs.length === 0 ? (
          error ? <p className={s.hint}>{error}</p> : <EmptyBackground />
        ) : (
          <ul className={s.list}>
            {runs.map(run => (
              <li key={run.id}>
                <RunCard run={run} members={members} teams={teams} title={run.card ? `${run.card.key ? `${run.card.key} · ` : ''}${run.card.name}` : 'A card no longer here'} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
