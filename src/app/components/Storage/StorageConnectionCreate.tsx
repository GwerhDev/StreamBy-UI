import s from '../Database/Database.module.css';
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { faCloud, faXmark, faTag, faLayerGroup, faKey, faFileLines } from '@fortawesome/free-solid-svg-icons';
import { RootState } from '../../../store';
import { setCurrentProject } from '../../../store/currentProjectSlice';
import { createStorageConnection, StorageConnectionPayload } from '../../../services/storageConnections';
import { StorageConnectionType } from '../../../interfaces';
import { LabeledInput } from '../Inputs/LabeledInput';
import { LabeledSelect } from '../Inputs/LabeledSelect';
import { ActionButton } from '../Buttons/ActionButton';
import { SecondaryButton } from '../Buttons/SecondaryButton';
import { Spinner } from '../Spinner';
import { CustomForm } from '../Forms/CustomForm';

const STORAGE_TYPES = [
  { value: 's3',    label: 'AWS S3' },
  { value: 'gcs',   label: 'Google Cloud Storage' },
  { value: 'r2',    label: 'Cloudflare R2' },
  { value: 'azure', label: 'Azure Blob Storage' },
];

export const StorageConnectionCreate = () => {
  const { id: projectId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const project = useSelector((state: RootState) => state.currentProject.data);

  const [name, setName] = useState('');
  const [type, setType] = useState<StorageConnectionType>('s3');
  const [credentialId, setCredentialId] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [disabled, setDisabled] = useState(true);

  const availableCredentials = [
    { value: '', label: 'Select a credential…' },
    ...(project?.credentials?.map(c => ({ value: c.id, label: c.key || c.id })) ?? []),
  ];

  useEffect(() => { setDisabled(!name || !credentialId || loading); }, [name, credentialId, loading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectId || !project) return;
    setLoading(true);
    try {
      const payload: StorageConnectionPayload = {
        name, type, credentialId,
        ...(description && { description }),
      };
      const result = await createStorageConnection(projectId, payload);
      if (result) {
        dispatch(setCurrentProject({
          ...project,
          storageConnections: [...(project.storageConnections ?? []), result],
        }));
        navigate(`/project/${projectId}/storage`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={s.container}>
      <Spinner bg isLoading={loading} />
      <form onSubmit={handleSubmit} className={s.formWrapper}>
        <CustomForm
          readOnly={false}
          header={{ icon: faCloud, title: 'New Storage Connection', subtitle: `Connect an external storage to ${project?.name}` }}
          fields={[
            {
              icon: faTag,
              label: 'Name',
              value: name || '—',
              editComponent: (
                <LabeledInput
                  label="Name" name="name" value={name} type="text"
                  placeholder="My S3 Bucket" id="storage-name" htmlFor="storage-name"
                  onChange={e => setName(e.target.value)} disabled={loading}
                />
              ),
            },
            {
              icon: faLayerGroup,
              label: 'Storage type',
              value: type,
              editComponent: (
                <LabeledSelect
                  label="Storage type" id="storage-type" name="storage-type" htmlFor="storage-type"
                  value={type} onChange={e => setType(e.target.value as StorageConnectionType)}
                  options={STORAGE_TYPES}
                />
              ),
            },
            {
              icon: faKey,
              label: 'Credential (JSON config)',
              value: credentialId || '—',
              editComponent: (
                <LabeledSelect
                  label="Credential (JSON config)" id="storage-credential" name="storage-credential" htmlFor="storage-credential"
                  value={credentialId} onChange={e => setCredentialId(e.target.value)}
                  options={availableCredentials}
                />
              ),
            },
            {
              icon: faFileLines,
              label: 'Description',
              value: description || '—',
              editComponent: (
                <LabeledInput
                  label="Description (optional)" name="description" value={description} type="text"
                  placeholder="" id="storage-description" htmlFor="storage-description"
                  onChange={e => setDescription(e.target.value)} disabled={loading}
                />
              ),
            },
          ]}
          actions={
            <>
              <ActionButton disabled={disabled} icon={faCloud} text="Create" type="submit" />
              <SecondaryButton disabled={loading} icon={faXmark} onClick={() => navigate(-1)} text="Cancel" />
            </>
          }
        />
      </form>
    </div>
  );
};
