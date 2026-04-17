import s from './MemberList.module.css';
import skeleton from '../Loader/Skeleton.module.css';
import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../../../store';
import { fetchProjectMembers } from '../../../services/projects';
import { inviteMember, removeMember, updateMemberRole } from '../../../services/members';
import { searchUsers, UserSearchResult } from '../../../services/users';
import { Member } from '../../../interfaces';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUserPlus, faMagnifyingGlass, faXmark, faUserGroup } from '@fortawesome/free-solid-svg-icons';
import { MemberCard } from '../Cards/MemberCard';
import { ActionButton } from '../Buttons/ActionButton';
import { SectionHeader } from '../SectionHeader/SectionHeader';
import { DropdownInput } from '../Inputs/DropdownInput';

type MemberRole = 'viewer' | 'editor' | 'admin';

const ROLES: MemberRole[] = ['viewer', 'editor', 'admin'];

export function MemberList() {
  const { id: projectId } = useParams<{ id: string }>();
  const session = useSelector((state: RootState) => state.session);
  const currentProject = useSelector((state: RootState) => state.currentProject.data);

  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Invite state
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<UserSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserSearchResult | null>(null);
  const [inviteRole, setInviteRole] = useState<MemberRole>('viewer');
  const [inviting, setInviting] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isAdmin = currentProject?.members?.find(m => m.userId === session.userId)?.role === 'admin';

  const loadMembers = useCallback(async () => {
    if (!projectId) return;
    try {
      const data = await fetchProjectMembers(projectId);
      setMembers(data);
    } catch (err: { message?: string } | unknown) {
      setError((err as { message?: string }).message || 'Failed to fetch members.');
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => { loadMembers(); }, [loadMembers]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query.trim() || selectedUser) { setResults([]); setShowDropdown(false); return; }
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      const data = await searchUsers(query.trim());
      setResults(data.filter(u => !members.some(m => m.userId === u.id)));
      setShowDropdown(true);
      setSearching(false);
    }, 350);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query, selectedUser, members]);

  const handleSelectUser = (user: UserSearchResult) => {
    setSelectedUser(user);
    setQuery(user.username);
    setShowDropdown(false);
    setResults([]);
  };

  const handleClearSelection = () => {
    setSelectedUser(null);
    setQuery('');
    setResults([]);
  };

  const handleInvite = async () => {
    if (!selectedUser || !projectId) return;
    setInviting(true);
    try {
      await inviteMember(projectId, selectedUser.id, inviteRole);
      handleClearSelection();
      await loadMembers();
    } catch {
      // error handled in service
    } finally {
      setInviting(false);
    }
  };

  const handleRoleChange = async (userId: string, role: MemberRole) => {
    if (!projectId) return;
    try {
      await updateMemberRole(projectId, userId, role);
      setMembers(prev => prev.map(m => m.userId === userId ? { ...m, role } : m));
    } catch {
      // error handled in service
    }
  };

  const handleRemove = async (userId: string) => {
    if (!projectId) return;
    try {
      await removeMember(projectId, userId);
      setMembers(prev => prev.filter(m => m.userId !== userId));
    } catch {
      // error handled in service
    }
  };

  return (
    <div className={s.container}>
      <SectionHeader icon={faUserGroup} title="Project Members" subtitle="Manage your project's team" />

      {isAdmin && (
        <div className={s.inviteSection}>
          <div className={s.inviteRow}>
            <div className={s.searchWrap} ref={searchRef}>
              <div className={s.searchInput}>
                <FontAwesomeIcon icon={faMagnifyingGlass} className={s.searchIcon} />
                <input
                  type="text"
                  placeholder="Search by username..."
                  value={query}
                  onChange={e => { setQuery(e.target.value); setSelectedUser(null); }}
                  onFocus={() => results.length > 0 && setShowDropdown(true)}
                  autoComplete="off"
                />
                {query && (
                  <button type="button" className={s.clearBtn} onClick={handleClearSelection}>
                    <FontAwesomeIcon icon={faXmark} />
                  </button>
                )}
              </div>

              {showDropdown && (
                <ul className={s.dropdown}>
                  {searching && <li className={s.dropdownInfo}>Searching...</li>}
                  {!searching && results.length === 0 && (
                    <li className={s.dropdownInfo}>No users found</li>
                  )}
                  {results.map(user => (
                    <li key={user.id} className={s.dropdownItem} onMouseDown={() => handleSelectUser(user)}>
                      <span className={s.avatar}>{user.username[0].toUpperCase()}</span>
                      <span className={s.dropdownUsername}>{user.username}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <DropdownInput
              value={inviteRole}
              onChange={v => setInviteRole(v as MemberRole)}
              options={ROLES.map(r => ({ value: r, label: r }))}
            />

            <ActionButton
              icon={faUserPlus}
              text="Invite"
              disabled={!selectedUser || inviting}
              onClick={handleInvite}
            />
          </div>
        </div>
      )}

      {loading ? (
        <ul className={s.memberGrid}>
          {Array.from({ length: 3 }).map((_, i) => (
            <li key={i} className={`${s.cardSkeleton} ${skeleton.skeleton}`} />
          ))}
        </ul>
      ) : error ? (
        <p className={s.errorMsg}>{error}</p>
      ) : members.length === 0 ? (
        <p className={s.emptyMsg}>No members in this project.</p>
      ) : (
        <ul className={s.memberGrid}>
          {members.map(member => (
            <li key={member.userId} className={s.memberListItem}>
              <MemberCard
                member={member}
                isAdmin={isAdmin}
                isSelf={member.userId === session.userId}
                onRoleChange={role => handleRoleChange(member.userId, role as MemberRole)}
                onRemove={() => handleRemove(member.userId)}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
