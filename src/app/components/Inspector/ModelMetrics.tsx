import s from './MeasurementsPanel.module.css';
import { BudgetProfile, Exceeded, ModelMeasurements } from '../../../services/assetMeasurements';

interface Props {
  measurements: ModelMeasurements;
  profile: BudgetProfile | null;
  exceeded: Exceeded[];
}

const formatOf = (mime: string | null) => (mime ? mime.replace(/^image\//, '').toUpperCase() : '—');

// What a 3D asset's version measures: each count with its limit, each texture with its size and
// format, its animations; what's over the budget, marked.
export function ModelMetrics({ measurements, profile, exceeded }: Props) {
  const over = (metric: Exceeded['metric'], texture?: string | null) =>
    exceeded.some(e => e.metric === metric && (texture === undefined || e.texture === texture));
  const counts: { metric: Exceeded['metric']; label: string; value: number; limit?: number }[] = [
    { metric: 'triangles', label: 'Triangles', value: measurements.triangles, limit: profile?.maxTriangles },
    { metric: 'materials', label: 'Materials', value: measurements.materials, limit: profile?.maxMaterials },
    { metric: 'textures', label: 'Textures', value: measurements.textures.length, limit: profile?.maxTextures },
    { metric: 'animations', label: 'Animations', value: measurements.animations.length, limit: profile?.maxAnimations },
  ];

  return (
    <>
      <table className={s.table}>
        <tbody>
          {counts.map(c => (
            <tr key={c.metric} className={over(c.metric) ? s.over : ''} data-testid={`metric-${c.metric}`}>
              <th>{c.label}</th>
              <td>{c.value.toLocaleString('en-US')}</td>
              <td className={s.limit}>{c.limit !== undefined ? `/ ${c.limit.toLocaleString('en-US')}` : ''}</td>
            </tr>
          ))}
          <tr><th>Vertices</th><td>{measurements.vertices.toLocaleString('en-US')}</td><td /></tr>
          <tr><th>Meshes</th><td>{measurements.meshes}</td><td /></tr>
        </tbody>
      </table>

      {measurements.textures.length > 0 && (
        <section className={s.section}>
          <span className={s.label}>Textures</span>
          <ul className={s.list}>
            {measurements.textures.map((t, i) => {
              const big = over('textureSize', t.name);
              const format = over('textureFormat', t.name);
              return (
                <li key={`${t.name}-${i}`} className={big || format ? s.over : ''} data-testid="texture">
                  <span className={s.itemName}>{t.name ?? `Texture ${i + 1}`}</span>
                  <span className={big ? s.flag : ''}>{t.width}×{t.height}</span>
                  <span className={format ? s.flag : ''}>{formatOf(t.format)}</span>
                </li>
              );
            })}
          </ul>
          {profile?.maxTextureSize !== undefined && <small className={s.hint}>At most {profile.maxTextureSize}px a side{profile.textureFormats ? `, in ${profile.textureFormats.map(formatOf).join(', ')}` : ''}</small>}
        </section>
      )}

      {measurements.animations.length > 0 && (
        <section className={s.section}>
          <span className={s.label}>Animations</span>
          <ul className={s.list}>
            {measurements.animations.map((a, i) => (
              <li key={`${a.name}-${i}`}><span className={s.itemName}>{a.name ?? `Animation ${i + 1}`}</span><span>{a.duration.toFixed(2)}s</span></li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}
