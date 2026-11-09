import s from './RunnerCard.module.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faDesktop, faShareNodes, faTrash, faXmark } from '@fortawesome/free-solid-svg-icons';
import { WorkerRunner, WorkerRunnerShare } from '../../../interfaces';
import { RunnerConnectSteps } from './RunnerConnectSteps';

const formatDate = (iso: string | null) => (iso ? new Date(iso).toLocaleString() : null);

interface RunnerCardProps {
  runner: WorkerRunner;
  onShare: () => void;
  onUnshare: (share: WorkerRunnerShare) => void;
  onRevoke: () => void;
}

export const stateOf = (runner: Pick<WorkerRunner, 'online' | 'lastSeenAt'>) =>
  runner.online ? 'Online' : runner.lastSeenAt ? `Offline · last seen ${formatDate(runner.lastSeenAt)}` : 'Never connected';

const shareLabel = (share: WorkerRunnerShare) =>
  `${share.projectName ?? share.projectId}${share.teamId ? ` · ${share.teamName ?? 'a team'}` : ''}`;

// One of the user's runners: whether it's online, what it said it does, and where it's shared.
export const RunnerCard = ({ runner, onShare, onUnshare, onRevoke }: RunnerCardProps) => (
  <div className={s.card} data-testid={`runner-${runner.id}`}>
    <div className={s.header}>
      <span className={s.icon}><FontAwesomeIcon icon={faDesktop} /></span>
      <span className={s.title}>
        <h4>{runner.name}</h4>
        <code>{runner.prefix}…</code>
      </span>
      <span className={`${s.state} ${runner.online ? s.online : ''}`} data-testid={`runner-state-${runner.id}`}>
        <span className={s.dot} />
        {stateOf(runner)}
      </span>
      <button type="button" className={s.revokeButton} title="Revoke runner" aria-label={`Revoke ${runner.name}`} onClick={onRevoke}>
        <FontAwesomeIcon icon={faTrash} />
      </button>
    </div>

    <dl className={s.meta}>
      <dt>Does</dt>
      <dd>{runner.kinds.length ? runner.kinds.join(', ') : 'Not said yet: it says so when it connects'}</dd>
      {runner.categories.length > 0 && (
        <>
          <dt>Takes</dt>
          <dd>{runner.categories.join(', ')}</dd>
        </>
      )}
      <dt>Shared with</dt>
      <dd>
        <ul className={s.shares} aria-label="Shared with">
          {runner.shares.map(share => (
            <li key={share.id} className={s.chip}>
              {shareLabel(share)}
              <button type="button" title="Stop sharing" aria-label={`Stop sharing with ${shareLabel(share)}`} onClick={() => onUnshare(share)}>
                <FontAwesomeIcon icon={faXmark} />
              </button>
            </li>
          ))}
          <li>
            <button type="button" className={s.shareButton} onClick={onShare}>
              <FontAwesomeIcon icon={faShareNodes} />
              {runner.shares.length ? 'Share with another' : 'Share with a project'}
            </button>
          </li>
        </ul>
      </dd>
    </dl>

    <details className={s.connect}>
      <summary>How to connect it</summary>
      <RunnerConnectSteps />
    </details>
  </div>
);
