import { useMemo, useState } from 'react';
import { faPlus, faTableList } from '@fortawesome/free-solid-svg-icons';
import { Member, ProductionSequence, ProductionShot, TaskTemplate, Team } from '../../../interfaces';
import { createShots } from '../../../services/production';
import { DropdownInput } from '../Inputs/DropdownInput';
import { EditModal, Field } from './ProductionEditModals';
import { BulkCardsPreview } from './BulkCardsPreview';
import { parseCards, resolveCards } from './bulkCards';
import f from './ProductionEditModals.module.css';

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

// Cards made in a sequence at once, from a table pasted from a spreadsheet or a CSV (a row each:
// name, description, people, teams; a first row of column names says which is which): its rows
// shown first, with what's wrong with any; and, if one is picked, a task template's tasks for each.
export function BulkCardsModal({ projectId, sequence, members, teams, templates, names, onCreated, onError, onClose }: Props) {
  const [text, setText] = useState('');
  const [templateId, setTemplateId] = useState('');
  const [saving, setSaving] = useState(false);
  const rows = useMemo(() => parseCards(text), [text]);
  const { cards, problems } = useMemo(() => resolveCards(rows, members, teams), [rows, members, teams]);
  const plural = (n: number) => (n === 1 ? names.shot : names.shots).toLowerCase();

  const create = async () => {
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
    <EditModal
      title={`Add ${names.shots.toLowerCase()} to ${sequence.name}`} icon={faTableList} wide
      saving={saving} canSave={cards.length > 0 && !problems.length} onSubmit={create} onClose={onClose}
      submitIcon={faPlus} submitText={cards.length ? `Create ${cards.length} ${plural(cards.length)}` : 'Create'} savingText="Creating…"
    >
      <Field id="bulk-cards" label="Paste a table or a CSV">
        <textarea
          id="bulk-cards" autoFocus className={f.formTextarea} rows={8} value={text} onChange={e => setText(e.target.value)}
          placeholder={'name\tdescription\tpeople\tteams\nAventurero\tThe hero\tada\tArtists'}
        />
      </Field>
      <BulkCardsPreview rows={rows} problems={problems} cardName={names.shots} />
      {templates.length > 0 && (
        <Field id="bulk-template" label="Task template">
          <DropdownInput
            value={templateId} onChange={setTemplateId}
            options={[{ value: '', label: 'None' }, ...templates.map(t => ({ value: t.id, label: `${t.name} (${t.tasks.length} tasks)` }))]}
          />
        </Field>
      )}
    </EditModal>
  );
}
