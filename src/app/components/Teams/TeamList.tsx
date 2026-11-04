import s from './TeamList.module.css';
import skeleton from '../Loader/Skeleton.module.css';
import { FormEvent, useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFloppyDisk, faLock, faPen, faPlus, faTrash, faUsersRectangle, faXmark } from '@fortawesome/free-solid-svg-icons';
import { AppDispatch } from '../../../store';
import { addApiResponse } from '../../../store/apiResponsesSlice';
import { createTeam, deleteTeam, getTeams, updateTeam } from '../../../services/teams';
import { Member, Team } from '../../../interfaces';
import { ModalShell } from '../Modals/ModalShell';
import { ActionButton } from '../Buttons/ActionButton';
import { PrimaryButton } from '../Buttons/PrimaryButton';
import { SecondaryButton } from '../Buttons/SecondaryButton';
import { LabeledInput } from '../Inputs/LabeledInput';
import { CustomCheckbox } from '../Inputs/CustomCheckbox';
import { MemberAvatar } from '../Cards/MemberAvatar';
import { EmptyBackground } from '../Backgrounds/EmptyBackground';

interface Props {
  projectId: string;
  // The project's active members: only they can be in a team.
  members: Member[];
  // Who sees it may make, change and delete teams (an admin, or an editor if the project lets them).
  canManage: boolean;
  // An admin of the project: who is in a team that grants permissions is only theirs to change.
  isAdmin: boolean;
}

export const LOCKED_REASON = "Its members are managed by the project's admins because it grants permissions";

// A project's teams: everyone in it sees them; its admins (and its editors, if the project lets
// them) make, change and delete them. A team that grants permissions, for someone who isn't an
// admin, can only be renamed.
export function TeamList({ projectId, members, canManage, isAdmin }: Props) {
  const locked = (team: Team) => !isAdmin && !!team.grantsPermissions;
  const dispatch = useDispatch<AppDispatch>();
  const [teams, setTeams] = useState<Team[] | null>(null);
  // The team being made (null) or changed, while its dialog is open.
  const [editing, setEditing] = useState<Team | null | undefined>(undefined);
  const [toDelete, setToDelete] = useState<Team | null>(null);
  const [busy, setBusy] = useState(false);

  const failed = (err: unknown, fallback: string) =>
    dispatch(addApiResponse({ message: err instanceof Error && err.message ? err.message : fallback, type: 'error' }));

  useEffect(() => {
    let cancelled = false;
    getTeams(projectId)
      .then(found => { if (!cancelled) setTeams(found); })
      .catch(err => { if (!cancelled) { setTeams([]); failed(err, 'Failed to load the teams.'); } });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  const save = async (payload: { name: string; memberIds?: string[] }) => {
    setBusy(true);
    try {
      setTeams(editing ? await updateTeam(projectId, editing.id, payload) : await createTeam(projectId, { name: payload.name, memberIds: payload.memberIds ?? [] }));
      dispatch(addApiResponse({ message: editing ? 'Team saved.' : 'Team created.', type: 'success' }));
      setEditing(undefined);
    } catch (err) {
      failed(err, 'Failed to save the team.');
    } finally { setBusy(false); }
  };

  const remove = async () => {
    if (!toDelete) return;
    setBusy(true);
    try {
      setTeams(await deleteTeam(projectId, toDelete.id));
      dispatch(addApiResponse({ message: 'Team deleted.', type: 'success' }));
      setToDelete(null);
    } catch (err) {
      failed(err, 'Failed to delete the team.');
    } finally { setBusy(false); }
  };

  return (
    <div className={s.container}>
      {canManage && (
        <div className={s.toolbar}>
          <ActionButton icon={faPlus} text="New team" onClick={() => setEditing(null)} />
        </div>
      )}

      {teams === null ? (
        <ul className={s.list}>
          {Array.from({ length: 2 }).map((_, i) => <li key={i} className={`${s.skeletonRow} ${skeleton.skeleton}`} />)}
        </ul>
      ) : teams.length === 0 ? (
        <div className={s.empty}><EmptyBackground /></div>
      ) : (
        <ul className={s.list} aria-label="Teams">
          {teams.map(team => (
            <li key={team.id} className={s.team} aria-label={team.name}>
              <span className={s.teamIcon}><FontAwesomeIcon icon={faUsersRectangle} /></span>
              <div className={s.teamInfo}>
                <span className={s.teamName}>
                  {team.name}
                  {locked(team) && (
                    <span className={s.locked} title={LOCKED_REASON} role="img" aria-label={LOCKED_REASON}>
                      <FontAwesomeIcon icon={faLock} />
                    </span>
                  )}
                </span>
                <span className={s.teamCount}>{team.members.length === 1 ? '1 member' : `${team.members.length} members`}</span>
              </div>
              <span className={s.avatars}>
                {team.members.slice(0, 5).map(m => <MemberAvatar key={m.userId} username={m.username} profilePic={m.profilePic ?? undefined} size="small" />)}
                {team.members.length > 5 && <span className={s.more}>+{team.members.length - 5}</span>}
              </span>
              {canManage && (
                <span className={s.actions}>
                  <button type="button" className={s.iconBtn} onClick={() => setEditing(team)} aria-label={`Edit ${team.name}`}>
                    <FontAwesomeIcon icon={faPen} />
                  </button>
                  {!locked(team) && (
                    <button type="button" className={`${s.iconBtn} ${s.deleteBtn}`} onClick={() => setToDelete(team)} aria-label={`Delete ${team.name}`}>
                      <FontAwesomeIcon icon={faTrash} />
                    </button>
                  )}
                </span>
              )}
            </li>
          ))}
        </ul>
      )}

      {editing !== undefined && (
        <TeamModal
          team={editing} members={members} saving={busy} membersLocked={!!editing && locked(editing)}
          onSave={save} onClose={() => setEditing(undefined)}
        />
      )}

      {toDelete && (
        <ModalShell title="Delete team" icon={faTrash} onClose={() => setToDelete(null)}>
          <p className={s.confirmText}>
            Delete <strong>{toDelete.name}</strong>? Its members stay in the project.
          </p>
          <div className={s.formActions}>
            <PrimaryButton icon={faTrash} text={busy ? 'Deleting…' : 'Delete team'} disabled={busy} onClick={remove} />
            <SecondaryButton icon={faXmark} text="Cancel" onClick={() => setToDelete(null)} />
          </div>
        </ModalShell>
      )}
    </div>
  );
}

// A team made or changed: its name, and which of the project's members are in it (unless its
// members are locked: then only its name is saved).
function TeamModal({ team, members, saving, membersLocked, onSave, onClose }: {
  team: Team | null;
  members: Member[];
  saving: boolean;
  membersLocked: boolean;
  onSave: (payload: { name: string; memberIds?: string[] }) => void;
  onClose: () => void;
}) {
  const [name, setName] = useState(team?.name ?? '');
  const [memberIds, setMemberIds] = useState<string[]>(team?.members.map(m => m.userId) ?? []);
  const toggle = (userId: string, on: boolean) =>
    setMemberIds(ids => (on ? [...ids, userId] : ids.filter(id => id !== userId)));
  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (name.trim() && !saving) onSave(membersLocked ? { name: name.trim() } : { name: name.trim(), memberIds });
  };

  return (
    <ModalShell title={team ? 'Edit team' : 'New team'} icon={faUsersRectangle} onClose={onClose}>
      <form onSubmit={submit} className={s.form}>
        <LabeledInput
          label="Name" name="team-name" id="team-name" htmlFor="team-name" type="text" placeholder="e.g. Animation"
          value={name} onChange={e => setName(e.target.value)}
        />
        <fieldset className={s.members}>
          <legend className={s.legend}>Members</legend>
          {membersLocked && (
            <p className={s.lockedNote}><FontAwesomeIcon icon={faLock} /> {LOCKED_REASON}.</p>
          )}
          {members.length === 0 && <p className={s.hint}>No members to add.</p>}
          {members.map(m => (
            <CustomCheckbox
              key={m.userId} id={`team-member-${m.userId}`} name="team-member" value={m.userId} disabled={membersLocked}
              label={m.username} checked={memberIds.includes(m.userId)} onChange={e => toggle(m.userId, e.target.checked)}
            />
          ))}
        </fieldset>
        <div className={s.formActions}>
          <ActionButton type="submit" icon={faFloppyDisk} text={saving ? 'Saving…' : team ? 'Save' : 'Create team'} disabled={saving || !name.trim()} />
          <SecondaryButton icon={faXmark} text="Cancel" onClick={onClose} />
        </div>
      </form>
    </ModalShell>
  );
}
