import s from './JobProfileFields.module.css';
import { useState } from 'react';
import { StorageCategory } from '../../../interfaces';
import { LabeledInput } from '../Inputs/LabeledInput';
import { LabeledSelect } from '../Inputs/LabeledSelect';

export interface SpeechIntegration { id: string; name: string }

interface Props {
  idPrefix: string;
  // StreamBy's own worker (its kinds' options), or another (options as JSON).
  local: boolean;
  kind: string;
  // The asset's (a pipeline step's isn't known: every option is offered).
  category?: StorageCategory;
  profile: Record<string, unknown>;
  speechIntegrations: SpeechIntegration[];
  onChange: (profile: Record<string, unknown>) => void;
}

const VIDEO_FORMATS = ['mp4', 'webm', 'mov'];
const AUDIO_FORMATS = ['mp3', 'ogg', 'wav', 'm4a', 'flac'];
const opts = (values: string[]) => values.map(v => ({ value: v, label: v }));
const text = (value: unknown) => (value === undefined || value === null ? '' : String(value));
const num = (value: string) => (value === '' ? undefined : Number(value));

// What a job asks of its worker (its profile): for StreamBy's own, each kind's options; for
// another worker, its options as JSON.
export function JobProfileFields({ idPrefix, local, kind, category, profile, speechIntegrations, onChange }: Props) {
  const set = (key: string, value: unknown) => onChange({ ...profile, [key]: value });
  const field = (key: string, label: string, placeholder = '', numeric = false) => (
    <LabeledInput
      key={key} label={label} id={`${idPrefix}-${key}`} htmlFor={`${idPrefix}-${key}`} name={key} type={numeric ? 'number' : 'text'}
      placeholder={placeholder} value={text(profile[key])} onChange={e => set(key, numeric ? num(e.target.value) : e.target.value)}
    />
  );
  const select = (key: string, label: string, options: { value: string; label: string }[]) => (
    <LabeledSelect key={key} label={label} id={`${idPrefix}-${key}`} htmlFor={`${idPrefix}-${key}`} value={text(profile[key])} options={options} onChange={e => set(key, e.target.value || undefined)} />
  );

  if (!local) return <JsonProfile idPrefix={idPrefix} profile={profile} onChange={onChange} />;

  switch (kind) {
    case 'thumbnail':
      return (
        <div className={s.fields}>
          {field('width', 'Width (px)', '640', true)}
          {select('format', 'Format', [{ value: '', label: 'jpg' }, ...opts(['png', 'webp'])])}
          {category !== 'images' && field('timecode', "Video's frame at", '00:00:01')}
        </div>
      );
    case 'transcode': {
      const formats = category === 'audios' ? AUDIO_FORMATS : [...VIDEO_FORMATS, ...AUDIO_FORMATS];
      const toVideo = VIDEO_FORMATS.includes(text(profile.format) || (category === 'audios' ? 'mp3' : 'mp4'));
      return (
        <div className={s.fields}>
          {select('format', 'Format', [{ value: '', label: category === 'audios' ? 'mp3' : 'mp4' }, ...opts(formats.filter(f => f !== (category === 'audios' ? 'mp3' : 'mp4')))])}
          {toVideo && field('width', 'Width (px)', 'as it is', true)}
          {toVideo && field('height', 'Height (px)', 'as it is', true)}
          {toVideo && field('videoBitrate', 'Video bitrate', '2M')}
          {field('audioBitrate', 'Audio bitrate', '128k')}
        </div>
      );
    }
    case 'lod':
      return (
        <div className={s.fields}>
          {field('ratio', 'Triangles kept (0 to 1)', '0.5', true)}
          {field('error', 'Error allowed (0 to 1)', '0.01', true)}
        </div>
      );
    case 'gltf-convert':
      return <div className={s.fields}>{select('to', 'To', [{ value: '', label: 'The other format' }, ...opts(['glb', 'gltf'])])}</div>;
    case 'transcribe':
      return speechIntegrations.length ? (
        <div className={s.fields}>
          {select('integrationId', 'Speech provider', [{ value: '', label: 'Choose one' }, ...speechIntegrations.map(i => ({ value: i.id, label: i.name }))])}
          {field('language', 'Language (optional)', 'es, en…')}
        </div>
      ) : (
        <p className={s.hint}>Connect a speech provider first, in your account's Integrations: its transcripts are made with your own key.</p>
      );
    default:
      return null;
  }
}

// Another worker's options, as JSON.
function JsonProfile({ idPrefix, profile, onChange }: { idPrefix: string; profile: Record<string, unknown>; onChange: (profile: Record<string, unknown>) => void }) {
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
