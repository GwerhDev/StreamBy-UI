import s from './MemberAvatar.module.css';

interface MemberAvatarProps {
  username: string;
  profilePic?: string;
  size?: 'small' | 'medium';
}

// A member as a round avatar: their picture, or their name's initial.
export function MemberAvatar({ username, profilePic, size = 'medium' }: MemberAvatarProps) {
  const className = `${s.avatar} ${size === 'small' ? s.small : ''}`;
  return profilePic
    ? <img className={className} src={profilePic} alt={username} title={username} />
    : <span className={className} title={username} aria-label={username}>{username[0]?.toUpperCase()}</span>;
}
