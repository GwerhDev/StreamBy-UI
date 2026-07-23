import s from './StorageConnectionCreate.module.css';
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { faCloud, faXmark, faTag, faLayerGroup, faFingerprint, faFileLines, faPlug, faRoute } from '@fortawesome/free-solid-svg-icons';
import { RootState, AppDispatch } from '../../../store';
import { setCurrentProject } from '../../../store/currentProjectSlice';
import { addApiResponse } from '../../../store/apiResponsesSlice';
import { createStorageConnection, StorageConnectionPayload } from '../../../services/storageConnections';
import { StorageConnectionType } from '../../../interfaces';
import { LabeledInput } from '../Inputs/LabeledInput';
import { LabeledSelect } from '../Inputs/LabeledSelect';
import { ActionButton } from '../Buttons/ActionButton';
import { SecondaryButton } from '../Buttons/SecondaryButton';
import { Spinner } from '../Spinner';
import { CustomForm } from '../Forms/CustomForm';
import { IntegrationPicker } from '../Integrations/IntegrationPicker';

const STORAGE_TYPES = [
  { value: 's3',    label: 'AWS S3' },
  { value: 'gcs',   label: 'Google Cloud Storage' },
  { value: 'r2',    label: 'Cloudflare R2' },
  { value: 'azure', label: 'Azure Blob Storage' },
];

const SOURCE_MODES = [
  { value: 'integration', label: 'Use an integration' },
  { value: 'manual',      label: 'Configure manually' },
];

export const StorageConnectionCreate = () => {
  const { id: projectId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const project = useSelector((state: RootState) => state.currentProject.data);
  const { integrations } = useSelector((state: RootState) => state.management);

  const [sourceMode, setSourceMode] = useState<'integration' | 'manual'>('integration');
  const [name, setName] = useState('');
  const [type, setType] = useState<StorageConnectionType>('s3');
  const [credentialId, setCredentialId] = useState('');
  const [integrationId, setIntegrationId] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [disabled, setDisabled] = useState(true);

  const availableCredentials = [
    { value: '', label: 'Select a credential…' },
    ...(project?.credentials?.map(c => ({ value: c.id, label: c.key || c.id })) ?? []),
  ];

  const connectedIntegrationIds = [
    ...(project?.dbConnections ?? []),
    ...(project?.storageConnections ?? []),
  ].map(c => c.integrationId).filter((id): id is string => !!id);

  const selectedIntegration = integrations.find(i => i.id === integrationId);

  useEffect(() => {
    const hasSource = sourceMode === 'integration' ? !!integrationId : !!(name && credentialId);
    setDisabled(!hasSource || loading);
  }, [name, sourceMode, credentialId, integrationId, loading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectId || !project) return;
    setLoading(true);
    try {
      // In integration mode, name/type come from the integration itself — an integration IS
      // already a named, typed storage account, asking again would just duplicate/contradict it.
      const payload: StorageConnectionPayload = sourceMode === 'integration'
        ? {
            name: selectedIntegration?.name ?? '',
            type: selectedIntegration?.provider as StorageConnectionType,
            integrationId,
            ...(description && { description }),
          }
        : {
            name, type, credentialId,
            ...(description && { description }),
          };
      const result = await createStorageConnection(projectId, payload);
      dispatch(addApiResponse({ message: 'Storage connection created.', type: 'success' }));
      dispatch(setCurrentProject({
        ...project,
        storageConnections: [...(project.storageConnections ?? []), result],
      }));
      navigate(`/project/${projectId}/storage`);
    } catch (error: any) {
      dispatch(addApiResponse({ message: error.message || 'Failed to create storage connection.', type: 'error' }));
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
              icon: faRoute,
              label: 'Source',
              value: null,
              editComponent: (
                <LabeledSelect
                  label="Source" id="storage-source" name="storage-source" htmlFor="storage-source"
                  value={sourceMode} onChange={e => setSourceMode(e.target.value as typeof sourceMode)}
                  options={SOURCE_MODES}
                />
              ),
            },
            {
              icon: faPlug,
              label: 'Integration',
              value: integrationId || '—',
              hidden: sourceMode !== 'integration',
              editComponent: (
                <IntegrationPicker
                  pool={integrations}
                  kind="storage"
                  selected={integrationId ? [integrationId] : []}
                  onChange={ids => setIntegrationId(ids[0] ?? '')}
                  excludeIds={connectedIntegrationIds}
                  single
                />
              ),
            },
            {
              icon: faTag,
              label: 'Name',
              value: name || '—',
              hidden: sourceMode !== 'manual',
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
              hidden: sourceMode !== 'manual',
              editComponent: (
                <LabeledSelect
                  label="Storage type" id="storage-type" name="storage-type" htmlFor="storage-type"
                  value={type} onChange={e => setType(e.target.value as StorageConnectionType)}
                  options={STORAGE_TYPES}
                />
              ),
            },
            {
              icon: faFingerprint,
              label: 'Credential (JSON config)',
              value: credentialId || '—',
              hidden: sourceMode !== 'manual',
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
