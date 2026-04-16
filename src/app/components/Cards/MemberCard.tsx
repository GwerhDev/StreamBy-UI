import s from './MemberCard.module.css';
import { Member } from '../../../interfaces';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash } from '@fortawesome/free-solid-svg-icons';

type MemberRole = 'viewer' | 'editor' | 'admin';

const ROLES: MemberRole[] = ['viewer', 'editor', 'admin'];

interface MemberCardProps {
  member: Member;
  isAdmin?: boolean;
  isSelf?: boolean;
  onRoleChange?: (role: string) => void;
  onRemove?: () => void;
}

export const MemberCard = ({ member, isAdmin, isSelf, onRoleChange, onRemove }: MemberCardProps) => {
  return (
    <div className={s.card}>
      <span className={s.avatar}>{member.username[0].toUpperCase()}</span>
      <div className={s.info}>
        <span className={s.username}>{member.username}</span>
        {isSelf && <span className={s.selfBadge}>you</span>}
      </div>

      {isAdmin && !isSelf ? (
        <div className={s.actions}>
          <select
            className={s.roleSelect}
            value={member.role}
            onChange={e => onRoleChange?.(e.target.value)}
          >
            {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
          <button className={s.removeBtn} onClick={onRemove} title="Remove member">
            <FontAwesomeIcon icon={faTrash} />
          </button>
        </div>
      ) : (
        <span className={s.roleBadge}>{member.role}</span>
      )}
    </div>
  );
};
