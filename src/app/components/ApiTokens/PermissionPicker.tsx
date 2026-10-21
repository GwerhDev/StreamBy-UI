import s from './PermissionPicker.module.css';
import { ApiTokenKind, ApiTokenPermission } from '../../../interfaces';
import { LabeledSelect } from '../Inputs/LabeledSelect';
import { CustomCheckbox } from '../Inputs/CustomCheckbox';
import { groupsFor, LEVEL_OPTIONS, levelOf, levelPermissions, PermissionLevel, RISKY_PERMISSIONS } from './permissions';

interface PermissionPickerProps {
  kind: ApiTokenKind;
  value: ApiTokenPermission[];
  onChange: (permissions: ApiTokenPermission[]) => void;
  disabled?: boolean;
}

// A level to start from, and each permission to fine-tune it: changing one makes it custom.
export const PermissionPicker = ({ kind, value, onChange, disabled }: PermissionPickerProps) => {
  const level = levelOf(value, kind);

  const chooseLevel = (next: PermissionLevel) => {
    if (next !== 'custom') onChange(levelPermissions(next, kind));
  };
  const toggle = (permission: ApiTokenPermission, on: boolean) =>
    onChange(on ? [...new Set([...value, permission])] : value.filter(p => p !== permission));

  return (
    <div className={s.container} data-testid="permission-picker">
      <LabeledSelect
        label="Level" htmlFor="api-token-level" value={level} disabled={disabled}
        options={LEVEL_OPTIONS} onChange={e => chooseLevel(e.target.value as PermissionLevel)}
      />
      <ul className={s.groups}>
        {groupsFor(kind).map(group => (
          <li key={group.resource} className={s.group}>
            <span className={s.groupInfo}>
              <span className={s.groupLabel}>{group.label}</span>
              <small>{group.description}</small>
            </span>
            <span className={s.actions}>
              {group.actions.map(action => (
                <span key={action.permission} className={RISKY_PERMISSIONS.includes(action.permission) ? s.risky : undefined}>
                  <CustomCheckbox
                    id={`permission-${action.permission}`} name="api-token-permission" value={action.permission}
                    label={action.label} checked={value.includes(action.permission)} disabled={disabled}
                    onChange={e => toggle(action.permission, e.target.checked)}
                  />
                </span>
              ))}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
};
