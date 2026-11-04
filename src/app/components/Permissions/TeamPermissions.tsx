import s from './TeamPermissions.module.css';
import { ActionRole, Team } from '../../../interfaces';
import { CustomCheckbox } from '../Inputs/CustomCheckbox';
import { PermissionList, PermissionRow } from './PermissionList';
import { ACTIONS } from './permissionLabels';

interface Props {
  teams: Team[];
  actions: string[];
  // Who may do each action by role: what's editors' already needs no team.
  roles: Record<string, ActionRole>;
  // What each team (by id) adds for its editors.
  grants: Record<string, string[]>;
  editable: boolean;
  onToggle: (teamId: string, action: string, on: boolean) => void;
}

// What each team adds for the editors in it, over what editors can do: the admins' only actions
// (and any it was given that editors can do now, to take it off).
export function TeamPermissions({ teams, actions, roles, grants, editable, onToggle }: Props) {
  if (!teams.length) return <p className={s.empty}>No teams yet: make them in Members, Teams.</p>;
  const addable = (teamId: string) =>
    actions.filter(a => ACTIONS[a] && (roles[a] === 'admin' || (grants[teamId] ?? []).includes(a)));
  if (teams.every(team => !addable(team.id).length)) {
    return <p className={s.empty}>Editors can already do everything: set an action as Admins only in Roles to let a team's editors do it.</p>;
  }
  return (
    <div className={s.teams}>
      {teams.map(team => (
        <div key={team.id} className={s.team}>
          <span className={s.teamName}>{team.name}</span>
          <PermissionList label={`What ${team.name} adds`}>
            {addable(team.id).map(action => (
              <PermissionRow
                key={action}
                area={ACTIONS[action].area}
                label={ACTIONS[action].label}
                hint={roles[action] === 'editor' ? 'Editors can already' : undefined}
                controlId={`team-${team.id}-${action}`}
                control={(
                  <CustomCheckbox
                    id={`team-${team.id}-${action}`} name={`team-${team.id}`} value={action}
                    checked={(grants[team.id] ?? []).includes(action)} disabled={!editable}
                    onChange={e => onToggle(team.id, action, e.target.checked)}
                  />
                )}
              />
            ))}
          </PermissionList>
        </div>
      ))}
    </div>
  );
}
