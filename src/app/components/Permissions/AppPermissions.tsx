import { CustomCheckbox } from '../Inputs/CustomCheckbox';
import { PermissionList, PermissionRow } from './PermissionList';
import { APP_LABEL } from './permissionLabels';

interface Props {
  appPermissions: string[];
  granted: string[];
  editable: boolean;
  onToggle: (permission: string, on: boolean) => void;
}

// What the apps the project's members connect may also do in it.
export function AppPermissions({ appPermissions, granted, editable, onToggle }: Props) {
  return (
    <PermissionList label="Connected apps">
      {appPermissions.filter(p => APP_LABEL[p]).map(permission => (
        <PermissionRow
          key={permission}
          label={APP_LABEL[permission]}
          controlId={`app-${permission}`}
          control={(
            <CustomCheckbox
              id={`app-${permission}`} name="app-permission" value={permission}
              checked={granted.includes(permission)} disabled={!editable}
              onChange={e => onToggle(permission, e.target.checked)}
            />
          )}
        />
      ))}
    </PermissionList>
  );
}
