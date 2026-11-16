import s from './MeasurementsPanel.module.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCircleCheck, faRulerCombined, faSpinner, faTriangleExclamation } from '@fortawesome/free-solid-svg-icons';
import { BudgetProfile, Exceeded, isAudio, Measurements } from '../../../services/assetMeasurements';
import { ModelMetrics } from './ModelMetrics';
import { AudioMetrics } from './AudioMetrics';
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

// What an asset's version measures, against its budget: the profile it's checked against (to
// choose, for whoever may), whether it's within it, and its metrics (a 3D model's or an audio
// file's).
export function MeasurementsPanel({
  measurements, measuring, profile, exceeded, profiles, profileId, defaultProfileId, canChooseProfile, onChooseProfile, unmeasuredNote,
}: Props) {
  const defaultName = profiles.find(p => p.id === defaultProfileId)?.name;
  const options = [
    { value: DEFAULT, label: defaultName ? `Project default (${defaultName})` : 'Project default (none)' },
    ...profiles.map(p => ({ value: p.id, label: p.name })),
  ];
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

          {isAudio(measurements)
            ? <AudioMetrics measurements={measurements} profile={profile} exceeded={exceeded} />
            : <ModelMetrics measurements={measurements} profile={profile} exceeded={exceeded} />}
        </>
      )}
    </aside>
  );
}
