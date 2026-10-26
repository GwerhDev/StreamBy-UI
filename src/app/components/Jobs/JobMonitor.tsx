import s from './JobMonitor.module.css';
import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faArrowsRotate, faBolt, faCircleCheck, faCircleXmark, faClock, faSpinner,
} from '@fortawesome/free-solid-svg-icons';
import { AppDispatch, RootState } from '../../../store';
import { upsertJob, upsertJobs } from '../../../store/currentJobSlice';
import { addApiResponse } from '../../../store/apiResponsesSlice';
import { getJobs, retryJob } from '../../../services/workers';
import { JobRecord } from '../../../interfaces';
import { SectionHeader } from '../SectionHeader/SectionHeader';

const isFailed = (job: JobRecord) => job.status === 'failed' || (!job.status && !!job.error);
const isDone = (job: JobRecord) => job.status === 'completed' || (!job.status && job.progress >= 100);

function statusIcon(job: JobRecord) {
  if (isFailed(job)) return faCircleXmark;
  if (isDone(job)) return faCircleCheck;
  if (job.status === 'pending') return faClock;
  return faSpinner;
}

function statusClass(job: JobRecord, s: Record<string, string>): string {
  if (isFailed(job)) return s.rowError;
  if (isDone(job)) return s.rowDone;
  return s.rowActive;
}

export function JobMonitor() {
  const dispatch = useDispatch<AppDispatch>();
  const { id: projectId = '' } = useParams<{ id: string }>();
  const jobs = useSelector((state: RootState) => state.currentJob.jobs);
  // This project's jobs (they're kept by StreamBy: a reload doesn't lose them), newest first.
  const jobList = Object.values(jobs)
    .filter(job => !job.projectId || job.projectId === projectId)
    .sort((a, b) => new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime());

  useEffect(() => {
    if (projectId) getJobs(projectId).then(list => dispatch(upsertJobs(list))).catch(() => {});
  }, [dispatch, projectId]);

  const handleRetry = async (job: JobRecord) => {
    try {
      dispatch(upsertJob(await retryJob(projectId, job.jobId)));
    } catch (err) {
      dispatch(addApiResponse({ message: err instanceof Error ? err.message : 'Failed to retry the job.', type: 'error' }));
    }
  };

  return (
    <div className={s.container}>
      <div className={s.header}>
        <SectionHeader icon={faBolt} title="Job Monitor" subtitle="This project's jobs: its pipelines' and its workers'." />
      </div>

      {!jobList.length ? (
        <div className={s.empty}>
          <FontAwesomeIcon icon={faBolt} className={s.emptyIcon} />
          <p>No jobs yet. Run a pipeline, or process an asset with a worker, to see them here.</p>
        </div>
      ) : (
        <div className={s.table}>
          <div className={s.tableHeader}>
            <span className={s.colStatus} />
            <span className={s.colType}>Type</span>
            <span className={s.colStage}>Stage</span>
            <span className={s.colMessage}>Message</span>
            <span className={s.colProgress}>Progress</span>
          </div>
          {jobList.map(job => (
            <div key={job.jobId} className={`${s.row} ${statusClass(job, s)}`}>
              <span className={s.colStatus}>
                <FontAwesomeIcon icon={statusIcon(job)} spin={job.status === 'processing' || (!job.status && !isFailed(job) && !isDone(job))} />
              </span>
              <span className={s.colType}>{job.kind ?? job.jobType}{job.worker ? ` · ${job.worker.name}` : ''}</span>
              <span className={s.colStage}>{job.stage}</span>
              <span className={s.colMessage}>
                {job.error ?? job.message ?? '—'}
                {isFailed(job) && job.worker && (
                  <button type="button" className={s.retry} onClick={() => handleRetry(job)} aria-label={`Retry ${job.kind ?? job.jobType}`}>
                    <FontAwesomeIcon icon={faArrowsRotate} /> Retry
                  </button>
                )}
              </span>
              <span className={s.colProgress}>
                <span className={s.progressTrack}>
                  <span
                    className={`${s.progressFill} ${isFailed(job) ? s.progressError : isDone(job) ? s.progressDone : ''}`}
                    style={{ width: `${Math.min(100, job.progress)}%` }}
                  />
                </span>
                <span className={s.progressLabel}>{job.progress}%</span>
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
