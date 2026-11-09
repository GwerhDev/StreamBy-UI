import s from './AgentCard.module.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faDesktop, faShareNodes, faTrash, faXmark } from '@fortawesome/free-solid-svg-icons';
import { WorkerAgent, WorkerAgentShare } from '../../../interfaces';

const formatDate = (iso: string | null) => (iso ? new Date(iso).toLocaleString() : null);

interface AgentCardProps {
  agent: WorkerAgent;
  onShare: () => void;
  onUnshare: (share: WorkerAgentShare) => void;
  onRevoke: () => void;
}

export const stateOf = (agent: Pick<WorkerAgent, 'online' | 'lastSeenAt'>) =>
  agent.online ? 'Online' : agent.lastSeenAt ? `Offline · last seen ${formatDate(agent.lastSeenAt)}` : 'Never connected';

const shareLabel = (share: WorkerAgentShare) =>
  `${share.projectName ?? share.projectId}${share.teamId ? ` · ${share.teamName ?? 'a team'}` : ''}`;

// One of the user's agents: whether it's online, what it said it does, and where it's shared.
export const AgentCard = ({ agent, onShare, onUnshare, onRevoke }: AgentCardProps) => (
  <div className={s.card} data-testid={`agent-${agent.id}`}>
    <div className={s.header}>
      <span className={s.icon}><FontAwesomeIcon icon={faDesktop} /></span>
      <span className={s.title}>
        <h4>{agent.name}</h4>
        <code>{agent.prefix}…</code>
      </span>
      <span className={`${s.state} ${agent.online ? s.online : ''}`} data-testid={`agent-state-${agent.id}`}>
        <span className={s.dot} />
        {stateOf(agent)}
      </span>
      <button type="button" className={s.revokeButton} title="Revoke agent" aria-label={`Revoke ${agent.name}`} onClick={onRevoke}>
        <FontAwesomeIcon icon={faTrash} />
      </button>
    </div>

    <dl className={s.meta}>
      <dt>Does</dt>
      <dd>{agent.kinds.length ? agent.kinds.join(', ') : 'Not said yet: it says so when it connects'}</dd>
      {agent.categories.length > 0 && (
        <>
          <dt>Takes</dt>
          <dd>{agent.categories.join(', ')}</dd>
        </>
      )}
      <dt>Shared with</dt>
      <dd>
        <ul className={s.shares} aria-label="Shared with">
          {agent.shares.map(share => (
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
              {agent.shares.length ? 'Share with another' : 'Share with a project'}
            </button>
          </li>
        </ul>
      </dd>
    </dl>
  </div>
);
