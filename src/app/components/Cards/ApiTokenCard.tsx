import s from './ApiTokenCard.module.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faKey, faTrash, faTriangleExclamation } from '@fortawesome/free-solid-svg-icons';
import { ApiToken } from '../../../interfaces';
import { LEVEL_LABEL, levelOf, PERMISSION_GROUPS, RISKY_PERMISSIONS } from '../ApiTokens/permissions';

const formatDate = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString() : null);

interface ApiTokenCardProps {
  token: ApiToken;
  // The names of the projects a user's token reaches.
  projectName?: (id: string) => string;
  onRevoke: () => void;
}

export const ApiTokenCard = ({ token, projectName = id => id, onRevoke }: ApiTokenCardProps) => {
  const level = levelOf(token.permissions, token.kind);
  const groups = PERMISSION_GROUPS
    .map(group => ({ group, actions: group.actions.filter(a => token.permissions.includes(a.permission)) }))
    .filter(({ actions }) => actions.length > 0);
  const creatorLeft = token.kind === 'project' && token.createdBy.isMember === false;

  const meta = [
    token.kind === 'user' && {
      label: 'Projects',
      value: token.projectIds === '*' ? 'All my projects' : token.projectIds.length ? token.projectIds.map(projectName).join(', ') : 'Only the ones it creates',
    },
    token.kind === 'project' && { label: 'Created by', value: token.createdBy.username ?? token.createdBy.userId },
    { label: 'Created', value: formatDate(token.createdAt) },
    { label: 'Last used', value: formatDate(token.lastUsedAt) ?? 'Never' },
    { label: 'Expires', value: formatDate(token.expiresAt) ?? 'Never', warn: !token.expiresAt },
  ].filter(Boolean) as { label: string; value: string; warn?: boolean }[];

  return (
    <div className={s.card}>
      <div className={s.header}>
        <span className={s.icon}><FontAwesomeIcon icon={faKey} /></span>
        <span className={s.title}>
          <h4>{token.name}</h4>
          <code>{token.prefix}…</code>
        </span>
        <span className={s.levelBadge}>{LEVEL_LABEL[level]}</span>
        <button
          type="button" className={s.revokeBtn} title="Revoke token"
          data-testid={`api-token-revoke-${token.id}`} onClick={onRevoke}
        >
          <FontAwesomeIcon icon={faTrash} />
        </button>
      </div>

      <dl className={s.meta}>
        {meta.map(({ label, value, warn }) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd className={warn ? s.warn : undefined}>{value}</dd>
          </div>
        ))}
      </dl>

      <ul className={s.permissions} aria-label="Permissions">
        {groups.map(({ group, actions }) => (
          <li
            key={group.resource}
            className={actions.some(a => RISKY_PERMISSIONS.includes(a.permission)) ? s.riskyChip : s.chip}
          >
            {group.account ? actions.map(a => a.label).join(', ') : `${group.label} · ${actions.map(a => a.label.toLowerCase()).join(', ')}`}
          </li>
        ))}
      </ul>

      {creatorLeft && (
        <p className={s.notice} data-testid={`api-token-creator-left-${token.id}`}>
          <FontAwesomeIcon icon={faTriangleExclamation} />
          Whoever made it left the project. It keeps working until it's revoked.
        </p>
      )}
    </div>
  );
};
