import s from './BulkCards.module.css';
import { FormEvent, useMemo, useState } from 'react';
import { faPlus, faTableList, faXmark } from '@fortawesome/free-solid-svg-icons';
import { Member, ProductionSequence, ProductionShot, TaskTemplate, Team } from '../../../interfaces';
import { createShots } from '../../../services/production';
import { ModalShell } from '../Modals/ModalShell';
import { ActionButton } from '../Buttons/ActionButton';
import { SecondaryButton } from '../Buttons/SecondaryButton';
import { LabeledSelect } from '../Inputs/LabeledSelect';
import { BulkCardsPreview } from './BulkCardsPreview';
import { parseCards, resolveCards } from './bulkCards';

interface Props {
  projectId: string;
  sequence: ProductionSequence;
  members: Member[];
  teams: Team[];
  templates: TaskTemplate[];
  // What the project calls its shots (a game's may be assets).
  names: { shot: string; shots: string };
  onCreated: (shots: ProductionShot[], tasks: number) => void;
  onError: (err: unknown) => void;
  onClose: () => void;
}

// Cards made in a sequence at once, from a table pasted from a spreadsheet or a CSV: its rows
// shown first, with what's wrong with any; and, if one is picked, a task template's tasks for each.
export function BulkCardsModal({ projectId, sequence, members, teams, templates, names, onCreated, onError, onClose }: Props) {
  const [text, setText] = useState('');
  const [templateId, setTemplateId] = useState('');
  const [saving, setSaving] = useState(false);
  const rows = useMemo(() => parseCards(text), [text]);
  const { cards, problems } = useMemo(() => resolveCards(rows, members, teams), [rows, members, teams]);
  const canCreate = cards.length > 0 && !problems.length && !saving;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!canCreate) return;
    setSaving(true);
    try {
      const made = await createShots(projectId, sequence.id, cards, templateId || undefined);
      onCreated(made.shots, made.tasks);
    } catch (err) {
      onError(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalShell title={`Add ${names.shots.toLowerCase()} to ${sequence.name}`} icon={faTableList} onClose={onClose}>
      <form onSubmit={submit} className={s.form}>
        <label className={s.label} htmlFor="bulk-cards">Paste a table or a CSV</label>
        <p className={s.hint}>
          A row per {names.shot.toLowerCase()}: name, description, people, teams (several separated by commas). A first row of
          column names says which is which.
        </p>
        <textarea
          id="bulk-cards" className={s.textarea} value={text} onChange={e => setText(e.target.value)} autoFocus
          placeholder={'name\tdescription\tpeople\tteams\nAventurero\tThe hero\tada\tArtists'}
        />
        <BulkCardsPreview rows={rows} problems={problems} cardName={names.shots} />
        <LabeledSelect
          label="Task template" htmlFor="bulk-template" value={templateId}
          onChange={e => setTemplateId(e.target.value)}
          options={[{ value: '', label: 'None' }, ...templates.map(t => ({ value: t.id, label: `${t.name} (${t.tasks.length} tasks)` }))]}
        />
        <div className={s.actions}>
          <ActionButton
            type="submit" icon={faPlus} disabled={!canCreate}
            text={saving ? 'Creating…' : `Create ${cards.length || ''} ${(cards.length === 1 ? names.shot : names.shots).toLowerCase()}`.replace(/\s+/g, ' ')}
          />
          <SecondaryButton icon={faXmark} text="Cancel" onClick={onClose} />
        </div>
      </form>
    </ModalShell>
  );
}
