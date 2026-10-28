import s from './LicenseFields.module.css';
import { LICENSE_TYPES, LicenseMetadata, LicenseType } from '../../../interfaces';

// An asset's license metadata as a form: in its Rights tab, and when it's uploaded.

interface LicenseFieldsProps {
  values: LicenseMetadata;
  onChange: (values: LicenseMetadata) => void;
  disabled?: boolean;
  // Scopes the inputs' ids, for two forms on one page.
  idPrefix?: string;
}

export function LicenseFields({ values, onChange, disabled, idPrefix = 'license' }: LicenseFieldsProps) {
  const set = (key: keyof LicenseMetadata, value: string) => onChange({ ...values, [key]: value || null });
  const input = (key: 'sourceUrl' | 'creatorName' | 'creatorUrl', label: string, placeholder: string, type = 'text') => (
    <div className={s.field}>
      <label className={s.label} htmlFor={`${idPrefix}-${key}`}>{label}</label>
      <input
        id={`${idPrefix}-${key}`} data-testid={`${idPrefix}-${key}`} className={s.input} type={type} disabled={disabled}
        value={values[key] ?? ''} onChange={e => set(key, e.target.value)} placeholder={placeholder}
      />
    </div>
  );
  return (
    <div className={s.fields}>
      {input('sourceUrl', 'Source link', 'https://… where it was taken from', 'url')}
      {input('creatorName', 'Creator', 'Who made it')}
      {input('creatorUrl', 'Creator link', "https://… the creator's page", 'url')}
      <div className={s.field}>
        <label className={s.label} htmlFor={`${idPrefix}-licenseType`}>License</label>
        <select
          id={`${idPrefix}-licenseType`} data-testid={`${idPrefix}-licenseType`} className={s.select} disabled={disabled}
          value={values.licenseType ?? ''} onChange={e => set('licenseType', e.target.value as LicenseType)}
        >
          <option value="">—</option>
          {LICENSE_TYPES.map(type => <option key={type} value={type}>{type}</option>)}
        </select>
      </div>
      <div className={s.field}>
        <label className={s.label} htmlFor={`${idPrefix}-comments`}>Comments</label>
        <textarea
          id={`${idPrefix}-comments`} data-testid={`${idPrefix}-comments`} className={s.textarea} rows={2} disabled={disabled}
          value={values.comments ?? ''} onChange={e => set('comments', e.target.value)} placeholder="Retextured, cropped…"
        />
      </div>
    </div>
  );
}
