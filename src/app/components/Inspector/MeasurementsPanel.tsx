import s from './MeasurementsPanel.module.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCircleCheck, faRulerCombined, faSpinner, faTriangleExclamation } from '@fortawesome/free-solid-svg-icons';
import { BudgetProfile, Exceeded, Measurements } from '../../../services/assetMeasurements';
import { DropdownInput } from '../Inputs/DropdownInput';

const DEFAULT = '__default__';

interface Props {
  // What the version measures; null while it's unmeasured.
  measurements: Measurements | null;
  measuring: boolean;
  profile: BudgetProfile | null;
  exceeded: Exceeded[];
  // The project's profiles, the one the asset chose (null: the default), and whether it may choose.
  profiles: BudgetProfile[];
  profileId: string | null;
  defaultProfileId: string | null;
  canChooseProfile: boolean;
  onChooseProfile: (profileId: string | null) => void;
  // Why it isn't measured yet (e.g. who can measure it).
  unmeasuredNote?: string;
}

const formatOf = (mime: string | null) => (mime ? mime.replace(/^image\//, '').toUpperCase() : '—');

// What a 3D asset's version measures, against its budget: each count with its limit, each
// texture with its size and format, its animations; what's over the budget, marked.
export function MeasurementsPanel({
  measurements, measuring, profile, exceeded, profiles, profileId, defaultProfileId, canChooseProfile, onChooseProfile, unmeasuredNote,
}: Props) {
  const over = (metric: Exceeded['metric'], texture?: string | null) =>
    exceeded.some(e => e.metric === metric && (texture === undefined || e.texture === texture));
  const defaultName = profiles.find(p => p.id === defaultProfileId)?.name;
  const options = [
    { value: DEFAULT, label: defaultName ? `Project default (${defaultName})` : 'Project default (none)' },
    ...profiles.map(p => ({ value: p.id, label: p.name })),
  ];
  const counts: { metric: Exceeded['metric']; label: string; value: number; limit?: number }[] = measurements ? [
    { metric: 'triangles', label: 'Triangles', value: measurements.triangles, limit: profile?.maxTriangles },
    { metric: 'materials', label: 'Materials', value: measurements.materials, limit: profile?.maxMaterials },
    { metric: 'textures', label: 'Textures', value: measurements.textures.length, limit: profile?.maxTextures },
    { metric: 'animations', label: 'Animations', value: measurements.animations.length, limit: profile?.maxAnimations },
  ] : [];

  return (
    <aside className={s.panel} data-testid="measurements">
      <section className={s.section}>
        <span className={s.label}>Budget</span>
        {canChooseProfile && profiles.length > 0 ? (
          <DropdownInput value={profileId ?? DEFAULT} options={options} onChange={v => onChooseProfile(v === DEFAULT ? null : v)} />
        ) : (
          <span className={s.value}>{profile?.name ?? 'None'}</span>
        )}
      </section>

      {!measurements ? (
        <p className={s.unmeasured} data-testid="unmeasured">
          <FontAwesomeIcon icon={measuring ? faSpinner : faRulerCombined} spin={measuring} />
          {measuring ? 'Measuring…' : unmeasuredNote ?? 'Unmeasured'}
        </p>
      ) : (
        <>
          <p className={`${s.verdict} ${exceeded.length ? s.verdictOver : s.verdictOk}`} data-testid="verdict">
            <FontAwesomeIcon icon={exceeded.length ? faTriangleExclamation : faCircleCheck} />
            {!profile ? 'No budget to check against' : exceeded.length ? `${exceeded.length} over its budget` : 'Within its budget'}
          </p>

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
      )}
    </aside>
  );
}
