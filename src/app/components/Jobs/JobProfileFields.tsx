import s from './JobProfileFields.module.css';
import { useState } from 'react';

interface Props {
  idPrefix: string;
  profile: Record<string, unknown>;
  onChange: (profile: Record<string, unknown>) => void;
}

// What a job asks of its worker (its profile): the worker's own options, as JSON. Each worker
// takes its own, so StreamBy offers no form for them.
export function JobProfileFields({ idPrefix, profile, onChange }: Props) {
  const [draft, setDraft] = useState(Object.keys(profile).length ? JSON.stringify(profile, null, 2) : '');
  const [error, setError] = useState<string | null>(null);
  const change = (value: string) => {
    setDraft(value);
    if (!value.trim()) { setError(null); onChange({}); return; }
    try {
      const parsed = JSON.parse(value);
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error();
      setError(null);
      onChange(parsed);
    } catch {
      setError('Options must be a JSON object');
    }
  };
  return (
    <div className={s.json}>
      <label htmlFor={`${idPrefix}-profile`}>Options (JSON, optional)</label>
      <textarea id={`${idPrefix}-profile`} value={draft} placeholder={'{ "textureFormat": "ktx2" }'} onChange={e => change(e.target.value)} />
      {error && <p className={s.error}>{error}</p>}
    </div>
  );
}
