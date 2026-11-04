import { ActionRole } from '../../../interfaces';
import { DropdownInput } from '../Inputs/DropdownInput';
import { PermissionList, PermissionRow } from './PermissionList';
import { ACTIONS, WHO } from './permissionLabels';

interface Props {
  actions: string[];
  roles: Record<string, ActionRole>;
  // Its admins change who may do each action; others only see it.
  editable: boolean;
  onChange: (action: string, role: ActionRole) => void;
}

// Who may do each action: editors and admins, or admins only.
export function RolePermissions({ actions, roles, editable, onChange }: Props) {
  return (
    <PermissionList label="Roles">
      {actions.filter(a => ACTIONS[a]).map(action => (
        <PermissionRow
          key={action}
          area={ACTIONS[action].area}
          label={ACTIONS[action].label}
          hint={ACTIONS[action].note}
          control={editable ? (
            <span aria-label={`Who can: ${ACTIONS[action].label}`}>
              <DropdownInput value={roles[action]} onChange={v => onChange(action, v as ActionRole)} options={WHO} />
            </span>
          ) : (
            <span>{WHO.find(w => w.value === roles[action])?.label}</span>
          )}
        />
      ))}
    </PermissionList>
  );
}
