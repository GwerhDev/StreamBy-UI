import s from './MeasurementsPanel.module.css';
import { AudioMeasurements, BudgetProfile, Exceeded } from '../../../services/assetMeasurements';

interface Props {
  measurements: AudioMeasurements;
  profile: BudgetProfile | null;
  exceeded: Exceeded[];
}

const level = (value: number | null, unit: string) => (value === null ? '—' : `${value.toFixed(1)} ${unit}`);
const signed = (value: number) => (value > 0 ? `+${value}` : String(value));
const formatOf = (mime: string | null) => (mime ? mime.replace(/^audio\/(x-)?/, '').toUpperCase() : '—');
const rateOf = (hz: number) => `${(hz / 1000).toLocaleString('en-US', { maximumFractionDigits: 2 })} kHz`;
const channelsOf = (n: number) => (n === 1 ? 'Mono' : n === 2 ? 'Stereo' : `${n} channels`);
const durationOf = (seconds: number) => {
  const m = Math.floor(seconds / 60);
  const rest = seconds - m * 60;
  return `${m}:${rest.toFixed(1).padStart(4, '0')}`;
};

// What an audio file's version measures: its loudness and peaks against its profile's target
// and limits, and its format; what's over the budget, marked.
export function AudioMetrics({ measurements: m, profile, exceeded }: Props) {
  const over = (metric: Exceeded['metric']) => exceeded.some(e => e.metric === metric);
  const rows: { key: string; label: string; value: string; limit?: string; metric?: Exceeded['metric'] }[] = [
    {
      key: 'integrated', label: 'Integrated', value: level(m.integratedLufs, 'LUFS'), metric: 'loudness',
      limit: profile?.targetLufs !== undefined ? `${signed(profile.targetLufs)} ±${profile.lufsTolerance ?? 0}` : undefined,
    },
    { key: 'shortTerm', label: 'Short-term max', value: level(m.shortTermLufsMax, 'LUFS') },
    {
      key: 'truePeak', label: 'True peak', value: level(m.truePeak, 'dBTP'), metric: 'truePeak',
      limit: profile?.maxTruePeak !== undefined ? `≤ ${signed(profile.maxTruePeak)}` : undefined,
    },
    { key: 'rms', label: 'RMS', value: level(m.rms, 'dBFS') },
    { key: 'lra', label: 'Loudness range', value: level(m.lra, 'LU') },
  ];
  const format: { key: string; label: string; value: string; metric?: Exceeded['metric'] }[] = [
    { key: 'duration', label: 'Duration', value: durationOf(m.duration) },
    { key: 'sampleRate', label: 'Sample rate', value: rateOf(m.sampleRate), metric: 'sampleRate' },
    { key: 'channels', label: 'Channels', value: channelsOf(m.channels) },
    { key: 'bitDepth', label: 'Bit depth', value: m.bitDepth ? `${m.bitDepth}-bit` : '—' },
    { key: 'format', label: 'Format', value: formatOf(m.format), metric: 'audioFormat' },
  ];
  const allowed = [
    profile?.audioFormats ? profile.audioFormats.map(formatOf).join(', ') : null,
    profile?.sampleRates ? profile.sampleRates.map(rateOf).join(', ') : null,
  ].filter(Boolean);

  return (
    <>
      <section className={s.section}>
        <span className={s.label}>Loudness</span>
        <table className={s.table}>
          <tbody>
            {rows.map(r => (
              <tr key={r.key} className={r.metric && over(r.metric) ? s.over : ''} data-testid={`metric-${r.key}`}>
                <th>{r.label}</th>
                <td>{r.value}</td>
                <td className={s.limit}>{r.limit ?? ''}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
      <section className={s.section}>
        <span className={s.label}>Format</span>
        <table className={s.table}>
          <tbody>
            {format.map(r => (
              <tr key={r.key} className={r.metric && over(r.metric) ? s.over : ''} data-testid={`metric-${r.key}`}>
                <th>{r.label}</th>
                <td>{r.value}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {allowed.length > 0 && <small className={s.hint}>Allowed: {allowed.join(' · ')}</small>}
      </section>
    </>
  );
}
