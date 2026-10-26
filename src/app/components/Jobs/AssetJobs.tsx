import s from './AssetJobs.module.css';
import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowsRotate, faBolt, faGears, faXmark } from '@fortawesome/free-solid-svg-icons';
import { AppDispatch, RootState } from '../../../store';
import { upsertJob, upsertJobs } from '../../../store/currentJobSlice';
import { addApiResponse } from '../../../store/apiResponsesSlice';
import { getJobs, getWorkers, processAsset, retryJob } from '../../../services/workers';
import { JobRecord, StorageCategory, Worker, WorkerResultMode } from '../../../interfaces';
import { LabeledSelect } from '../Inputs/LabeledSelect';
import { ActionButton } from '../Buttons/ActionButton';
import { SecondaryButton } from '../Buttons/SecondaryButton';

const RESULT_MODES: { value: WorkerResultMode; label: string }[] = [
  { value: 'derived', label: 'As a new asset (this one stays as it is)' },
  { value: 'version', label: "As this asset's new version (its URL serves it)" },
];

const STATUS_LABEL: Record<string, string> = { pending: 'Queued', processing: 'Processing', completed: 'Done', failed: 'Failed' };

const failed = (job: JobRecord) => job.status === 'failed' || (!job.status && !!job.error);
const done = (job: JobRecord) => job.status === 'completed' || (!job.status && job.progress >= 100);
const show = (value: unknown) => (typeof value === 'object' && value !== null ? JSON.stringify(value) : String(value));

interface Props {
  projectId: string;
  assetId: string;
  category: StorageCategory;
}

// An asset's jobs, kept by StreamBy (and kept up to date by their events), and asking a
// worker to process it.
export function AssetJobs({ projectId, assetId, category }: Props) {
  const dispatch = useDispatch<AppDispatch>();
  const all = useSelector((state: RootState) => state.currentJob.jobs);
  const jobs = useMemo(
    () => Object.values(all).filter(j => j.assetId === assetId)
      .sort((a, b) => new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime()),
    [all, assetId],
  );

  const [workers, setWorkers] = useState<Worker[]>([]);
  const [workerKey, setWorkerKey] = useState('');
  const [kind, setKind] = useState('');
  const [resultMode, setResultMode] = useState<WorkerResultMode>('derived');
  const [busy, setBusy] = useState(false);
  const [asking, setAsking] = useState(false);

  const error = (err: unknown, fallback: string) =>
    dispatch(addApiResponse({ message: err instanceof Error && err.message ? err.message : fallback, type: 'error' }));

  useEffect(() => {
    getJobs(projectId, assetId).then(list => dispatch(upsertJobs(list))).catch(() => {});
    getWorkers(projectId)
      .then(list => setWorkers(list.filter(w => w.categories.includes(category))))
      .catch(() => setWorkers([]));
  }, [dispatch, projectId, assetId, category]);

  const keyOf = (w: Worker) => `${w.source}:${w.id}`;
  const worker = workers.find(w => keyOf(w) === workerKey) ?? workers[0];
  const kinds = worker?.kinds ?? [];
  const chosenKind = kinds.includes(kind) ? kind : kinds[0] ?? '';

  const handleProcess = async () => {
    if (!worker || !chosenKind) return;
    setBusy(true);
    try {
      const job = await processAsset(projectId, { assetId, worker: { source: worker.source, id: worker.id }, kind: chosenKind, resultMode });
      dispatch(upsertJob(job));
      setAsking(false);
    } catch (err) {
      error(err, 'Failed to start the job.');
    } finally {
      setBusy(false);
    }
  };

  const handleRetry = async (job: JobRecord) => {
    try {
      dispatch(upsertJob(await retryJob(projectId, job.jobId)));
    } catch (err) {
      error(err, 'Failed to retry the job.');
    }
  };

  return (
    <div className={s.container} data-testid="asset-jobs">
      {workers.length && !asking ? (
        <button type="button" className={s.ask} onClick={() => setAsking(true)}>
          <FontAwesomeIcon icon={faGears} /> Process with a worker
        </button>
      ) : workers.length ? (
        <div className={s.process}>
          <LabeledSelect
            id="job-worker" htmlFor="job-worker" label="Worker" value={worker ? keyOf(worker) : ''}
            options={workers.map(w => ({ value: keyOf(w), label: `${w.name}${w.source === 'builtin' ? ' (host)' : ''}` }))}
            onChange={e => setWorkerKey(e.target.value)}
          />
          <LabeledSelect
            id="job-kind" htmlFor="job-kind" label="What to do" value={chosenKind}
            options={kinds.map(k => ({ value: k, label: k }))} onChange={e => setKind(e.target.value)}
          />
          <LabeledSelect
            id="job-result" htmlFor="job-result" label="Keep the result" value={resultMode}
            options={RESULT_MODES} onChange={e => setResultMode(e.target.value as WorkerResultMode)}
          />
          <div className={s.processActions}>
            <ActionButton icon={faGears} text="Process" onClick={handleProcess} disabled={busy || !chosenKind} isLoading={busy} />
            <SecondaryButton icon={faXmark} text="Cancel" onClick={() => setAsking(false)} disabled={busy} />
          </div>
        </div>
      ) : (
        <p className={s.hint}>No worker takes this kind of asset. Connect one in the project's Settings → Workers.</p>
      )}

      {jobs.length === 0 ? (
        <div className={s.empty}>
          <FontAwesomeIcon icon={faBolt} className={s.emptyIcon} />
          <p>No jobs for this file.</p>
        </div>
      ) : jobs.map(job => (
        <div key={job.jobId} className={s.job} data-testid={`job-${job.jobId}`}>
          <div className={s.jobHead}>
            <span className={s.jobKind}>{job.kind ?? job.jobType}</span>
            {job.worker && <span className={s.jobWorker}>{job.worker.name}</span>}
            <span className={`${s.status} ${failed(job) ? s.statusFailed : done(job) ? s.statusDone : s.statusActive}`}>
              {STATUS_LABEL[job.status ?? ''] ?? job.stage}
            </span>
          </div>
          {!done(job) && !failed(job) && (
            <div className={s.progress}>
              <div className={s.track}><div className={s.fill} style={{ width: `${Math.min(100, job.progress)}%` }} /></div>
              <span className={s.stage}>{job.stage} · {job.progress}%</span>
            </div>
          )}
          {failed(job) && job.error && <p className={s.error}>{job.error}</p>}
          {failed(job) && job.worker && (
            <button type="button" className={s.retry} onClick={() => handleRetry(job)}>
              <FontAwesomeIcon icon={faArrowsRotate} /> Retry
            </button>
          )}
          {job.result && (
            <p className={s.result}>
              {job.result.mode === 'version' ? "Saved as this asset's new version." : 'Saved as a new asset, derived from this one.'}
            </p>
          )}
          {job.report && Object.keys(job.report).length > 0 && (
            <dl className={s.report}>
              {Object.entries(job.report).map(([key, value]) => (
                <div key={key}><dt>{key}</dt><dd>{show(value)}</dd></div>
              ))}
            </dl>
          )}
        </div>
      ))}
    </div>
  );
}
