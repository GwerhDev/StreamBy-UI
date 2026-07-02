import s from './JobMonitor.module.css';
import { useSelector } from 'react-redux';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faBolt, faCircleCheck, faCircleXmark, faSpinner,
} from '@fortawesome/free-solid-svg-icons';
import { RootState } from '../../../store';
import { JobRecord } from '../../../interfaces';
import { SectionHeader } from '../SectionHeader/SectionHeader';

function statusIcon(job: JobRecord) {
  if (job.error) return faCircleXmark;
  if (job.progress >= 100) return faCircleCheck;
  return faSpinner;
}

function statusClass(job: JobRecord, s: Record<string, string>): string {
  if (job.error) return s.rowError;
  if (job.progress >= 100) return s.rowDone;
  return s.rowActive;
}

export function JobMonitor() {
  const jobs = useSelector((state: RootState) => state.currentJob.jobs);
  const jobList = Object.values(jobs);

  return (
    <div className={s.container}>
      <div className={s.header}>
        <SectionHeader icon={faBolt} title="Job Monitor" subtitle="Real-time pipeline jobs for this project" />
      </div>

      {!jobList.length ? (
        <div className={s.empty}>
          <FontAwesomeIcon icon={faBolt} className={s.emptyIcon} />
          <p>No active jobs. Run a pipeline to see jobs here.</p>
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
                <FontAwesomeIcon
                  icon={statusIcon(job)}
                  spin={!job.error && job.progress < 100}
                />
              </span>
              <span className={s.colType}>{job.jobType}</span>
              <span className={s.colStage}>{job.stage}</span>
              <span className={s.colMessage}>{job.error ?? job.message ?? '—'}</span>
              <span className={s.colProgress}>
                <span className={s.progressTrack}>
                  <span
                    className={`${s.progressFill} ${job.error ? s.progressError : job.progress >= 100 ? s.progressDone : ''}`}
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
