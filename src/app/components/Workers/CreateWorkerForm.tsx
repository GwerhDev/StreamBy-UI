import s from './CreateWorkerForm.module.css';
import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import {
  faArrowLeft, faBolt, faFileLines, faFolder, faGears, faKey, faLink, faListCheck, faTag, faXmark,
} from '@fortawesome/free-solid-svg-icons';
import { AppDispatch } from '../../../store';
import { addApiResponse } from '../../../store/apiResponsesSlice';
import { createWorker } from '../../../services/workers';
import { addWorker } from '../../../store/workersSlice';
import { StorageCategory } from '../../../interfaces';
import { CustomForm } from '../Forms/CustomForm';
import { SectionHeader } from '../SectionHeader/SectionHeader';
import { LabeledInput } from '../Inputs/LabeledInput';
import { LabeledSelect } from '../Inputs/LabeledSelect';
import { CustomCheckbox } from '../Inputs/CustomCheckbox';
import { ActionButton } from '../Buttons/ActionButton';
import { SecondaryButton } from '../Buttons/SecondaryButton';

const CATEGORIES: { value: StorageCategory; label: string }[] = [
  { value: 'images', label: 'Images' },
  { value: 'audios', label: 'Audios' },
  { value: 'videos', label: 'Videos' },
  { value: '3d-models', label: '3D models' },
];

const kindsOf = (text: string) => [...new Set(text.split(',').map(k => k.trim()).filter(Boolean))];

// Connects the project's own worker: where it is, its credential, and what it does.
export const CreateWorkerForm = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { id: projectId = '' } = useParams<{ id: string }>();
  const listPath = `/project/${projectId}/workers`;

  const [name, setName] = useState('');
  const [endpoint, setEndpoint] = useState('');
  const [credential, setCredential] = useState('');
  const [kindsText, setKindsText] = useState('');
  const [categories, setCategories] = useState<StorageCategory[]>([]);
  const [autoKind, setAutoKind] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);

  const kinds = kindsOf(kindsText);
  const canSave = !!name.trim() && !!endpoint.trim() && kinds.length > 0 && categories.length > 0 && !saving;

  const toggleCategory = (category: StorageCategory, on: boolean) =>
    setCategories(list => (on ? [...list, category] : list.filter(c => c !== category)));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSave) return;
    setSaving(true);
    try {
      const created = await createWorker(projectId, {
        name: name.trim(), endpoint: endpoint.trim(), kinds, categories,
        autoKind: kinds.includes(autoKind) ? autoKind : null,
        ...(credential ? { credential } : {}),
        ...(description.trim() ? { description: description.trim() } : {}),
      });
      dispatch(addWorker(created));
      dispatch(addApiResponse({ message: 'Worker connected.', type: 'success' }));
      navigate(listPath);
    } catch (err) {
      dispatch(addApiResponse({ message: err instanceof Error ? err.message : 'Failed to connect the worker.', type: 'error' }));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={s.container}>
      <form onSubmit={handleSubmit} className={s.form} data-testid="worker-form">
        <CustomForm
          readOnly={false}
          isLoading={saving}
          header={
            <SectionHeader
              icon={faArrowLeft} title="Connect a worker" onIconClick={() => navigate(listPath)}
              subtitle="A service of yours that processes the project's assets. Jobs are sent to its endpoint; it uploads the result and calls back."
            />
          }
          fields={[
            {
              icon: faTag, label: 'Name', value: name || '—',
              editComponent: <LabeledInput id="worker-name" htmlFor="worker-name" name="worker-name" type="text" label="Name" placeholder="e.g. glTF optimizer" value={name} onChange={e => setName(e.target.value)} />,
            },
            {
              icon: faLink, label: 'Endpoint', value: endpoint || '—',
              editComponent: <LabeledInput id="worker-endpoint" htmlFor="worker-endpoint" name="worker-endpoint" type="url" label="Endpoint (https)" placeholder="https://worker.example.com/jobs" value={endpoint} onChange={e => setEndpoint(e.target.value)} />,
            },
            {
              icon: faKey, label: 'Credential', value: credential ? '••••••••' : '—',
              editComponent: <LabeledInput id="worker-credential" htmlFor="worker-credential" name="worker-credential" type="password" label="Credential (optional, sent as a Bearer token)" placeholder="" value={credential} onChange={e => setCredential(e.target.value)} />,
            },
            {
              icon: faListCheck, label: 'What it does', value: kindsText || '—',
              editComponent: <LabeledInput id="worker-kinds" htmlFor="worker-kinds" name="worker-kinds" type="text" label="What it does (comma separated)" placeholder="gltf-optimize, lod" value={kindsText} onChange={e => setKindsText(e.target.value)} />,
            },
            {
              icon: faFolder, label: 'Assets it takes', value: '',
              editComponent: (
                <fieldset className={s.categories}>
                  <legend>Assets it takes</legend>
                  {CATEGORIES.map(c => (
                    <CustomCheckbox key={c.value} id={`worker-category-${c.value}`} name="worker-category" value={c.value} label={c.label}
                      checked={categories.includes(c.value)} onChange={e => toggleCategory(c.value, e.target.checked)} />
                  ))}
                </fieldset>
              ),
            },
            {
              icon: faBolt, label: 'On deliverables', value: '',
              editComponent: (
                <LabeledSelect
                  id="worker-auto" htmlFor="worker-auto" label="When one of its assets is marked as a deliverable" value={kinds.includes(autoKind) ? autoKind : ''}
                  options={[{ value: '', label: 'Do nothing by itself' }, ...kinds.map(k => ({ value: k, label: `Run ${k}` }))]}
                  onChange={e => setAutoKind(e.target.value)}
                />
              ),
            },
            {
              icon: faFileLines, label: 'Description', value: description || '—',
              editComponent: <LabeledInput id="worker-description" htmlFor="worker-description" name="worker-description" type="text" label="Description (optional)" placeholder="" value={description} onChange={e => setDescription(e.target.value)} />,
            },
          ]}
          actions={
            <>
              <ActionButton type="submit" icon={faGears} text="Connect" disabled={!canSave} />
              <SecondaryButton icon={faXmark} text="Cancel" disabled={saving} onClick={() => navigate(listPath)} />
            </>
          }
        />
      </form>
    </div>
  );
};
