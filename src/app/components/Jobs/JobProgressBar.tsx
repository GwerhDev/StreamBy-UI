import { useSelector } from 'react-redux';
import { RootState } from '../../../store';
import s from './JobProgressBar.module.css';

interface Props {
  jobId: string;
}

export function JobProgressBar({ jobId }: Props) {
  const job = useSelector((state: RootState) => state.currentJob.jobs[jobId]);
  if (!job) return null;
  return (
    <div className={s.container}>
      <div className={s.header}>
        <span className={s.stage}>{job.stage}</span>
        <span className={s.percent}>{job.progress}%</span>
      </div>
      <div className={s.track}>
        <div className={s.fill} style={{ width: `${job.progress}%` }} />
      </div>
      {job.error && <p className={s.error}>{job.error}</p>}
    </div>
  );
}
