import s from './BudgetProfilesModal.module.css';
import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFloppyDisk, faPlus, faScaleBalanced, faTrash, faXmark } from '@fortawesome/free-solid-svg-icons';
import { AssetBudgets, BudgetProfile } from '../../../services/assetMeasurements';
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

type Limit = 'maxTriangles' | 'maxMaterials' | 'maxTextures' | 'maxTextureSize' | 'maxAnimations';
const LIMITS: { key: Limit; label: string }[] = [
  { key: 'maxTriangles', label: 'Triangles' },
  { key: 'maxMaterials', label: 'Materials' },
  { key: 'maxTextures', label: 'Textures' },
  { key: 'maxTextureSize', label: 'Texture side (px)' },
  { key: 'maxAnimations', label: 'Animations' },
];

// What's typed for a profile: its limits as text (an empty one sets none).
interface Draft { id: string; name: string; limits: Record<Limit, string>; formats: string }

const draftOf = (p: BudgetProfile): Draft => ({
  id: p.id, name: p.name,
  limits: Object.fromEntries(LIMITS.map(({ key }) => [key, p[key] !== undefined ? String(p[key]) : ''])) as Record<Limit, string>,
  formats: (p.textureFormats ?? []).join(', '),
});

const profileOf = (d: Draft): BudgetProfile => ({
  id: d.id, name: d.name.trim(),
  ...Object.fromEntries(LIMITS.filter(({ key }) => d.limits[key].trim() !== '').map(({ key }) => [key, Number(d.limits[key])])),
  ...(d.formats.trim() ? { textureFormats: d.formats.split(',').map(f => f.trim()).filter(Boolean).map(f => (f.includes('/') ? f : `image/${f.toLowerCase()}`)) } : {}),
});

// The project's budget profiles, one per kind of piece (a character, a prop...): their limits,
// and which one an asset that chose none is checked against.
export function BudgetProfilesModal({ budgets, saving, onSave, onClose }: Props) {
  const [drafts, setDrafts] = useState<Draft[]>(budgets.profiles.map(draftOf));
  const [defaultId, setDefaultId] = useState<string | null>(budgets.defaultProfileId);
  const change = (id: string, patch: Partial<Draft>) => setDrafts(prev => prev.map(d => (d.id === id ? { ...d, ...patch } : d)));
  const add = () => setDrafts(prev => [...prev, draftOf({ id: crypto.randomUUID(), name: '' })]);
  const remove = (id: string) => { setDrafts(prev => prev.filter(d => d.id !== id)); if (defaultId === id) setDefaultId(null); };
  const invalid = drafts.some(d => !d.name.trim() || LIMITS.some(({ key }) => d.limits[key].trim() !== '' && !/^\d+$/.test(d.limits[key].trim())));

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
            onClick={() => onSave({ profiles: drafts.map(profileOf), defaultProfileId: defaultId })} />
        </>
      }
    >
      <p className={s.hint}>One profile per kind of piece. A limit left empty isn't checked. Formats: e.g. ktx2, webp.</p>
      <ul className={s.profiles}>
        {drafts.map((d, i) => (
          <li key={d.id} className={s.profile} data-testid="budget-profile">
            <div className={s.profileHead}>
              <LabeledInput label="Name" name={`name-${i}`} id={`name-${i}`} htmlFor={`name-${i}`} type="text" placeholder="Character"
                value={d.name} onChange={e => change(d.id, { name: e.target.value })} />
              <button type="button" className={s.remove} title="Remove" aria-label={`Remove ${d.name || 'profile'}`} onClick={() => remove(d.id)}>
                <FontAwesomeIcon icon={faTrash} />
              </button>
            </div>
            <div className={s.limits}>
              {LIMITS.map(({ key, label }) => (
                <LabeledInput key={key} label={label} name={`${key}-${i}`} id={`${key}-${i}`} htmlFor={`${key}-${i}`} type="text" placeholder="—"
                  value={d.limits[key]} onChange={e => change(d.id, { limits: { ...d.limits, [key]: e.target.value } })} />
              ))}
              <LabeledInput label="Texture formats" name={`formats-${i}`} id={`formats-${i}`} htmlFor={`formats-${i}`} type="text" placeholder="any"
                value={d.formats} onChange={e => change(d.id, { formats: e.target.value })} />
            </div>
            <CustomCheckbox id={`default-${i}`} name={`default-${i}`} label="The project's default" checked={defaultId === d.id}
              onChange={e => setDefaultId(e.target.checked ? d.id : null)} />
          </li>
        ))}
      </ul>
      <SecondaryButton icon={faPlus} text="Add a profile" onClick={add} />
    </ModalShell>
  );
}
