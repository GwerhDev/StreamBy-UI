import s from './AssigneePicker.module.css';
import { Member, Team } from '../../../interfaces';
import { CustomCheckbox } from '../Inputs/CustomCheckbox';
import { MemberAvatar } from '../Cards/MemberAvatar';

interface Props {
  // What the ids are made unique by (a shot's or a task's).
  idPrefix: string;
  members: Member[];
  teams: Team[];
  assignedTo: string[];
  teamIds: string[];
  onTogglePerson: (userId: string, on: boolean) => void;
  onToggleTeam: (teamId: string, on: boolean) => void;
}

// Who something is assigned to: people of the project, and its teams.
export function AssigneePicker({ idPrefix, members, teams, assignedTo, teamIds, onTogglePerson, onToggleTeam }: Props) {
  const people = members.filter(m => assignedTo.includes(m.userId));
  const assignedTeams = teams.filter(t => teamIds.includes(t.id));
  return (
    <div className={s.picker}>
      {(people.length > 0 || assignedTeams.length > 0) && (
        <div className={s.assigned} data-testid={`${idPrefix}-assignees`}>
          {people.map(m => <MemberAvatar key={m.userId} username={m.username} profilePic={m.profilePic} size="small" />)}
          {assignedTeams.map(t => <span key={t.id} className={s.teamChip}>{t.name}</span>)}
        </div>
      )}
      <fieldset className={s.group}>
        <legend className={s.legend}>People</legend>
        {members.length === 0 && <p className={s.hint}>No members to assign.</p>}
        {members.map(m => (
          <CustomCheckbox
            key={m.userId} id={`${idPrefix}-person-${m.userId}`} name={`${idPrefix}-person`} value={m.userId}
            label={m.username} checked={assignedTo.includes(m.userId)} onChange={e => onTogglePerson(m.userId, e.target.checked)}
          />
        ))}
      </fieldset>
      <fieldset className={s.group}>
        <legend className={s.legend}>Teams</legend>
        {teams.length === 0 && <p className={s.hint}>No teams yet: make them in Members, Teams.</p>}
        {teams.map(t => (
          <CustomCheckbox
            key={t.id} id={`${idPrefix}-team-${t.id}`} name={`${idPrefix}-team`} value={t.id}
            label={t.name} checked={teamIds.includes(t.id)} onChange={e => onToggleTeam(t.id, e.target.checked)}
          />
        ))}
      </fieldset>
    </div>
  );
}
