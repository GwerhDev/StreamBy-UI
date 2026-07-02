import s from './PipelineRunLog.module.css';
import { useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTerminal, faXmark, faCircleCheck, faCircleXmark } from '@fortawesome/free-solid-svg-icons';
import { RootState } from '../../../store';
import { JobRecord } from '../../../interfaces';

interface Props {
  onClose: () => void;
}

function jobStatusClass(job: JobRecord): string {
  if (job.error) return s.lineError;
  if (job.progress >= 100) return s.lineDone;
  return s.lineActive;
}

function ProgressBar({ value }: { value: number }) {
  return (
    <div className={s.progressTrack}>
      <div className={s.progressFill} style={{ width: `${Math.min(100, value)}%` }} />
    </div>
  );
}

export function PipelineRunLog({ onClose }: Props) {
  const jobs = useSelector((state: RootState) => state.currentJob.jobs);
  const jobList = Object.values(jobs);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [jobList.length]);

  return (
    <div className={s.drawer}>
      <div className={s.drawerHeader}>
        <FontAwesomeIcon icon={faTerminal} className={s.drawerIcon} />
        <span className={s.drawerTitle}>Pipeline log</span>
        <span className={s.jobCount}>{jobList.length} job{jobList.length !== 1 ? 's' : ''}</span>
        <button type="button" className={s.closeBtn} onClick={onClose} title="Close log">
          <FontAwesomeIcon icon={faXmark} />
        </button>
      </div>

      <div className={s.logBody}>
        {!jobList.length && (
          <div className={s.empty}>No active jobs. Run the pipeline to see output here.</div>
        )}
        {jobList.map(job => (
          <div key={job.jobId} className={`${s.logLine} ${jobStatusClass(job)}`}>
            <span className={s.lineIcon}>
              {job.error
                ? <FontAwesomeIcon icon={faCircleXmark} />
                : job.progress >= 100
                  ? <FontAwesomeIcon icon={faCircleCheck} />
                  : <span className={s.spinner} />
              }
            </span>
            <span className={s.lineType}>{job.jobType}</span>
            <span className={s.lineStage}>{job.stage}</span>
            {job.message && <span className={s.lineMessage}>{job.message}</span>}
            {job.error && <span className={s.lineError}>{job.error}</span>}
            <ProgressBar value={job.progress} />
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
