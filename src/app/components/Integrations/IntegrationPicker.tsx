import s from './IntegrationPicker.module.css';
import { CustomCheckbox } from '../Inputs/CustomCheckbox';
import { LockedIntegrationBadge } from './LockedIntegrationBadge';
import { IntegrationKind, IntegrationPoolEntry } from '../../../interfaces';
import streambyIcon from '../../../assets/streamby-icon.svg';

interface IntegrationPickerProps {
  pool: IntegrationPoolEntry[];
  kind?: IntegrationKind;
  selected: string[];
  onChange: (ids: string[]) => void;
  single?: boolean;
  disabled?: boolean;
  // Integrations already connected elsewhere (e.g. as a real dbConnection/storageConnection
  // on the project) that shouldn't be offered again — distinct from `selected`, which drives
  // the checkbox state within this picker itself.
  excludeIds?: string[];
}

export const IntegrationPicker = ({ pool, kind, selected, onChange, single, disabled, excludeIds }: IntegrationPickerProps) => {
  const entries = pool
    .filter(entry => !kind || entry.kind === kind)
    .filter(entry => !excludeIds?.includes(entry.id));

  const toggle = (id: string, checked: boolean) => {
    if (single) {
      onChange(checked ? [id] : []);
      return;
    }
    onChange(checked ? [...selected, id] : selected.filter(sid => sid !== id));
  };

  if (!entries.length) {
    return <p className={s.empty}>No integrations available.</p>;
  }

  return (
    <div className={s.list}>
      {entries.map(entry => (
        <div key={entry.id} className={s.row}>
          <CustomCheckbox
            id={`integration-${entry.id}`}
            name={`integration-${entry.id}`}
            label={`${entry.name} (${entry.provider})`}
            checked={selected.includes(entry.id)}
            disabled={disabled || !entry.available}
            onChange={e => toggle(entry.id, e.target.checked)}
          />
          {entry.source === 'builtin' && <img src={streambyIcon} alt="Built-in" className={s.builtinIcon} title="Built-in" />}
          {!entry.available && <LockedIntegrationBadge requiredPlan={entry.requiredPlan} />}
        </div>
      ))}
    </div>
  );
};
