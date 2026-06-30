import s from './Database.module.css';
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { faDatabase, faXmark, faTag, faLayerGroup, faKey, faFileLines } from '@fortawesome/free-solid-svg-icons';
import { RootState, AppDispatch } from '../../../store';
import { setCurrentProject } from '../../../store/currentProjectSlice';
import { addApiResponse } from '../../../store/apiResponsesSlice';
import { createDbConnection, DbConnectionPayload } from '../../../services/database';
import { LabeledInput } from '../Inputs/LabeledInput';
import { LabeledSelect } from '../Inputs/LabeledSelect';
import { ActionButton } from '../Buttons/ActionButton';
import { SecondaryButton } from '../Buttons/SecondaryButton';
import { CustomForm } from '../Forms/CustomForm';

const DB_TYPES = [
  { value: 'postgresql', label: 'PostgreSQL' },
  { value: 'mongodb',    label: 'MongoDB' },
];

export const DbConnectionCreate = () => {
  const { id: projectId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const project = useSelector((state: RootState) => state.currentProject.data);

  const [name, setName] = useState('');
  const [dbType, setDbType] = useState<'postgresql' | 'mongodb'>('postgresql');
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
      const payload: DbConnectionPayload = {
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
              icon: faTag,
              label: 'Name',
              value: name || '—',
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
              editComponent: (
                <LabeledSelect
                  label="Database type" id="db-type" name="db-type" htmlFor="db-type"
                  value={dbType} onChange={e => setDbType(e.target.value as typeof dbType)}
                  options={DB_TYPES}
                />
              ),
            },
            {
              icon: faKey,
              label: 'Credential (connection string)',
              value: credentialId || '—',
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

