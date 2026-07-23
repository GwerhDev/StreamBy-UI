import s from './Database.module.css';
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { faDatabase, faXmark, faTag, faLayerGroup, faFingerprint, faFileLines, faPlug, faRoute } from '@fortawesome/free-solid-svg-icons';
import { RootState, AppDispatch } from '../../../store';
import { setCurrentProject } from '../../../store/currentProjectSlice';
import { addApiResponse } from '../../../store/apiResponsesSlice';
import { createDbConnection, DbConnectionPayload } from '../../../services/database';
import { LabeledInput } from '../Inputs/LabeledInput';
import { LabeledSelect } from '../Inputs/LabeledSelect';
import { ActionButton } from '../Buttons/ActionButton';
import { SecondaryButton } from '../Buttons/SecondaryButton';
import { CustomForm } from '../Forms/CustomForm';
import { IntegrationPicker } from '../Integrations/IntegrationPicker';

const DB_TYPES = [
  { value: 'postgresql', label: 'PostgreSQL' },
  { value: 'mongodb',    label: 'MongoDB' },
];

const SOURCE_MODES = [
  { value: 'integration', label: 'Use an integration' },
  { value: 'manual',      label: 'Configure manually' },
];

export const DbConnectionCreate = () => {
  const { id: projectId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const project = useSelector((state: RootState) => state.currentProject.data);
  const { integrations } = useSelector((state: RootState) => state.management);

  const [sourceMode, setSourceMode] = useState<'integration' | 'manual'>('integration');
  const [name, setName] = useState('');
  const [dbType, setDbType] = useState<'postgresql' | 'mongodb'>('postgresql');
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
      // In integration mode, name/dbType come from the integration itself — an integration
      // IS already a named, typed database, asking again would just duplicate/contradict it.
      const payload: DbConnectionPayload = sourceMode === 'integration'
        ? {
            name: selectedIntegration?.name ?? '',
            dbType: selectedIntegration?.provider as 'postgresql' | 'mongodb',
            integrationId,
            ...(description && { description }),
          }
        : {
            name, dbType, credentialId,
            ...(description && { description }),
          };
      const result = await createDbConnection(projectId, payload);
      dispatch(addApiResponse({ message: 'Database connection created.', type: 'success' }));
      dispatch(setCurrentProject({
        ...project,
        dbConnections: [...(project.dbConnections ?? []), result],
      }));
      navigate(`/project/${projectId}/database`);
    } catch (error: any) {
      dispatch(addApiResponse({ message: error.message || 'Failed to create connection.', type: 'error' }));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={s.container}>
      <form onSubmit={handleSubmit} className={s.formWrapper}>
        <CustomForm
          readOnly={false}
          isLoading={loading}
          header={{ icon: faDatabase, title: 'New DB Connection', subtitle: `Connect an external database to ${project?.name}` }}
          fields={[
            {
              icon: faRoute,
              label: 'Source',
              value: null,
              editComponent: (
                <LabeledSelect
                  label="Source" id="db-source" name="db-source" htmlFor="db-source"
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
                  kind="database"
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
                  placeholder="My Postgres DB" id="db-name" htmlFor="db-name"
                  onChange={e => setName(e.target.value)} disabled={loading}
                />
              ),
            },
            {
              icon: faLayerGroup,
              label: 'Database type',
              value: dbType,
              hidden: sourceMode !== 'manual',
              editComponent: (
                <LabeledSelect
                  label="Database type" id="db-type" name="db-type" htmlFor="db-type"
                  value={dbType} onChange={e => setDbType(e.target.value as typeof dbType)}
                  options={DB_TYPES}
                />
              ),
            },
            {
              icon: faFingerprint,
              label: 'Credential (connection string)',
              value: credentialId || '—',
              hidden: sourceMode !== 'manual',
              editComponent: (
                <LabeledSelect
                  label="Credential (connection string)" id="db-credential" name="db-credential" htmlFor="db-credential"
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
                  placeholder="" id="db-description" htmlFor="db-description"
                  onChange={e => setDescription(e.target.value)} disabled={loading}
                />
              ),
            },
          ]}
          actions={
            <>
              <ActionButton disabled={disabled} icon={faDatabase} text="Create" type="submit" />
              <SecondaryButton disabled={loading} icon={faXmark} onClick={() => navigate(-1)} text="Cancel" />
            </>
          }
        />
      </form>
    </div>
  );
};

