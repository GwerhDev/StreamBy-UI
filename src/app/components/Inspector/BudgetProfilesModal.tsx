import s from './BudgetProfilesModal.module.css';
import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFloppyDisk, faPlus, faScaleBalanced, faTrash, faXmark } from '@fortawesome/free-solid-svg-icons';
import { AssetBudgets, BudgetProfile, kindOfProfile, MeasuredKind } from '../../../services/assetMeasurements';
import { ModalShell } from '../Modals/ModalShell';
import { LabeledInput } from '../Inputs/LabeledInput';
import { CustomCheckbox } from '../Inputs/CustomCheckbox';
import { ActionButton } from '../Buttons/ActionButton';
import { SecondaryButton } from '../Buttons/SecondaryButton';

interface Props {
  budgets: AssetBudgets;
  saving: boolean;
  onSave: (budgets: AssetBudgets) => void;
  onClose: () => void;
}

type ModelLimit = 'maxTriangles' | 'maxMaterials' | 'maxTextures' | 'maxTextureSize' | 'maxAnimations';
type AudioLimit = 'targetLufs' | 'lufsTolerance' | 'maxTruePeak';
type Limit = ModelLimit | AudioLimit;

// Each kind's limits: a 3D one's are counts; an audio one's levels (negative, with decimals).
const LIMITS: Record<MeasuredKind, { key: Limit; label: string; placeholder?: string }[]> = {
  model: [
    { key: 'maxTriangles', label: 'Triangles' },
    { key: 'maxMaterials', label: 'Materials' },
    { key: 'maxTextures', label: 'Textures' },
    { key: 'maxTextureSize', label: 'Texture side (px)' },
    { key: 'maxAnimations', label: 'Animations' },
  ],
  audio: [
    { key: 'targetLufs', label: 'Target (LUFS)', placeholder: '-14' },
    { key: 'lufsTolerance', label: 'Tolerance (LU)', placeholder: '1' },
    { key: 'maxTruePeak', label: 'Max true peak (dBTP)', placeholder: '-1' },
  ],
};
const isValid = (kind: MeasuredKind, text: string) => (kind === 'model' ? /^\d+$/ : /^-?\d+(\.\d+)?$/).test(text);

// What's typed for a profile: its limits as text (an empty one sets none); its formats, and an
// audio one's sample rates, as lists.
interface Draft { id: string; kind: MeasuredKind; name: string; limits: Partial<Record<Limit, string>>; formats: string; rates: string }

const draftOf = (p: BudgetProfile): Draft => {
  const kind = kindOfProfile(p);
  return {
    id: p.id, kind, name: p.name,
    limits: Object.fromEntries(LIMITS[kind].map(({ key }) => [key, p[key] !== undefined ? String(p[key]) : ''])),
    formats: ((kind === 'audio' ? p.audioFormats : p.textureFormats) ?? []).join(', '),
    rates: (p.sampleRates ?? []).join(', '),
  };
};

const listOf = (text: string) => text.split(',').map(f => f.trim()).filter(Boolean);

const profileOf = (d: Draft): BudgetProfile => {
  const typed = Object.fromEntries(LIMITS[d.kind].filter(({ key }) => (d.limits[key] ?? '').trim() !== '').map(({ key }) => [key, Number(d.limits[key])]));
  if (d.kind === 'model') {
    return {
      id: d.id, name: d.name.trim(), ...typed,
      ...(d.formats.trim() ? { textureFormats: listOf(d.formats).map(f => (f.includes('/') ? f : `image/${f.toLowerCase()}`)) } : {}),
    };
  }
  return {
    id: d.id, kind: 'audio', name: d.name.trim(), ...typed,
    ...(d.formats.trim() ? { audioFormats: listOf(d.formats).map(f => (f.includes('/') ? f : `audio/${f.toLowerCase()}`)) } : {}),
    ...(d.rates.trim() ? { sampleRates: listOf(d.rates).map(Number) } : {}),
  };
};

const SECTIONS: { kind: MeasuredKind; title: string; hint: string; add: string; placeholder: string; formats: string }[] = [
  { kind: 'model', title: '3D', hint: 'One profile per kind of piece. Formats: e.g. ktx2, webp.', add: 'Add a 3D profile', placeholder: 'Character', formats: 'Texture formats' },
  { kind: 'audio', title: 'Audio', hint: 'One profile per kind of sound (music, SFX, dialogue, ambience). Formats: e.g. wav, ogg.', add: 'Add an audio profile', placeholder: 'Music', formats: 'Formats' },
];

// The project's budget profiles: for its 3D pieces (a character, a prop...) and its sounds
// (music, SFX...), their limits, and which one of each kind an asset that chose none is checked against.
export function BudgetProfilesModal({ budgets, saving, onSave, onClose }: Props) {
  const [drafts, setDrafts] = useState<Draft[]>(budgets.profiles.map(draftOf));
  const [defaults, setDefaults] = useState<Record<MeasuredKind, string | null>>({
    model: budgets.defaultProfileId, audio: budgets.defaultAudioProfileId ?? null,
  });
  const change = (id: string, patch: Partial<Draft>) => setDrafts(prev => prev.map(d => (d.id === id ? { ...d, ...patch } : d)));
  const add = (kind: MeasuredKind) => setDrafts(prev => [...prev, draftOf({ id: crypto.randomUUID(), name: '', ...(kind === 'audio' ? { kind } : {}) })]);
  const remove = (d: Draft) => {
    setDrafts(prev => prev.filter(x => x.id !== d.id));
    if (defaults[d.kind] === d.id) setDefaults(prev => ({ ...prev, [d.kind]: null }));
  };
  const invalid = drafts.some(d => !d.name.trim()
    || LIMITS[d.kind].some(({ key }) => (d.limits[key] ?? '').trim() !== '' && !isValid(d.kind, (d.limits[key] ?? '').trim()))
    || listOf(d.rates).some(r => !/^\d+$/.test(r)));

  return (
    <ModalShell
      title="Budgets"
      icon={faScaleBalanced}
      onClose={onClose}
      className={s.modal}
      footer={
        <>
          <SecondaryButton icon={faXmark} text="Cancel" onClick={onClose} disabled={saving} />
          <ActionButton icon={faFloppyDisk} text="Save" isLoading={saving} disabled={saving || invalid}
            onClick={() => onSave({ profiles: drafts.map(profileOf), defaultProfileId: defaults.model, defaultAudioProfileId: defaults.audio })} />
        </>
      }
    >
      {SECTIONS.map(section => (
        <section key={section.kind} className={s.section} data-testid={`budgets-${section.kind}`}>
          <h4 className={s.title}>{section.title}</h4>
          <p className={s.hint}>{section.hint} A limit left empty isn't checked.</p>
          <ul className={s.profiles}>
            {drafts.map((d, i) => d.kind !== section.kind ? null : (
              <li key={d.id} className={s.profile} data-testid="budget-profile">
                <div className={s.profileHead}>
                  <LabeledInput label="Name" name={`name-${i}`} id={`name-${i}`} htmlFor={`name-${i}`} type="text" placeholder={section.placeholder}
                    value={d.name} onChange={e => change(d.id, { name: e.target.value })} />
                  <button type="button" className={s.remove} title="Remove" aria-label={`Remove ${d.name || 'profile'}`} onClick={() => remove(d)}>
                    <FontAwesomeIcon icon={faTrash} />
                  </button>
                </div>
                <div className={s.limits}>
                  {LIMITS[d.kind].map(({ key, label, placeholder }) => (
                    <LabeledInput key={key} label={label} name={`${key}-${i}`} id={`${key}-${i}`} htmlFor={`${key}-${i}`} type="text" placeholder={placeholder ?? '—'}
                      value={d.limits[key] ?? ''} onChange={e => change(d.id, { limits: { ...d.limits, [key]: e.target.value } })} />
                  ))}
                  <LabeledInput label={section.formats} name={`formats-${i}`} id={`formats-${i}`} htmlFor={`formats-${i}`} type="text" placeholder="any"
                    value={d.formats} onChange={e => change(d.id, { formats: e.target.value })} />
                  {d.kind === 'audio' && (
                    <LabeledInput label="Sample rates (Hz)" name={`rates-${i}`} id={`rates-${i}`} htmlFor={`rates-${i}`} type="text" placeholder="any"
                      value={d.rates} onChange={e => change(d.id, { rates: e.target.value })} />
                  )}
                </div>
                <CustomCheckbox id={`default-${i}`} name={`default-${i}`} label="The project's default" checked={defaults[d.kind] === d.id}
                  onChange={e => setDefaults(prev => ({ ...prev, [d.kind]: e.target.checked ? d.id : null }))} />
              </li>
            ))}
          </ul>
          <SecondaryButton icon={faPlus} text={section.add} onClick={() => add(section.kind)} />
        </section>
      ))}
    </ModalShell>
  );
}
