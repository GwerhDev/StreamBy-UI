import s from './CreateApiConnectionForm.module.css';
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../../store';
import { createApiConnection } from '../../../services/apiConnections';
import { setCurrentProject } from '../../../store/currentProjectSlice';
import { LabeledInput } from '../Inputs/LabeledInput';
import { LabeledSelect } from '../Inputs/LabeledSelect';
import { ActionButton } from '../Buttons/ActionButton';
import { SecondaryButton } from '../Buttons/SecondaryButton';
import { Spinner } from '../Spinner';
import { faTowerBroadcast, faXmark } from '@fortawesome/free-solid-svg-icons';

const HTTP_METHODS = [
  { value: 'POST', label: 'POST' },
  { value: 'GET', label: 'GET' },
  { value: 'PUT', label: 'PUT' },
  { value: 'PATCH', label: 'PATCH' },
  { value: 'DELETE', label: 'DELETE' },
];

export const CreateApiConnectionForm = () => {
  const { id: projectId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const currentProject = useSelector((state: RootState) => state.currentProject.data);

  const [name, setName] = useState('');
  const [baseUrl, setBaseUrl] = useState('');
  const [method, setMethod] = useState<'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE'>('POST');
  const [description, setDescription] = useState('');
  const [credentialId, setCredentialId] = useState('');
  const [loading, setLoading] = useState(false);
  const [disabled, setDisabled] = useState(true);

  const availableCredentials = [
    { value: '', label: 'None' },
    ...(currentProject?.credentials?.map(c => ({ value: c.id, label: c.key })) ?? []),
  ];

  useEffect(() => {
    setDisabled(!name || !baseUrl || loading);
  }, [name, baseUrl, loading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectId || !currentProject) return;

    setLoading(true);
    try {
      const payload = {
        name,
        baseUrl,
        method,
        ...(description && { description }),
        ...(credentialId && { credentialId }),
      };
      const response = await createApiConnection(projectId, payload);
      if (response) {
        const existing = currentProject.apiConnections ?? [];
        dispatch(setCurrentProject({
          ...currentProject,
          apiConnections: [...existing, response],
        }));
      }
      navigate(`/project/${projectId}/api/connections`);
    } catch {
      // error handled in service
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => navigate(-1);

  return (
    <div className={s.container}>
      <Spinner bg isLoading={loading} />
      <form onSubmit={handleSubmit}>
        <div className={s.formContainer}>
          <h3>New API Connection</h3>
          <p>Configure an external API connection for {currentProject?.name}</p>

          <LabeledInput
            label="Name"
            name="name"
            value={name}
            type="text"
            placeholder="My Webhook"
            id="conn-name"
            htmlFor="conn-name"
            onChange={e => setName(e.target.value)}
            disabled={loading}
          />

          <LabeledInput
            label="Base URL"
            name="baseUrl"
            value={baseUrl}
            type="text"
            placeholder="https://api.example.com/webhook"
            id="conn-url"
            htmlFor="conn-url"
            onChange={e => setBaseUrl(e.target.value)}
            disabled={loading}
          />

          <LabeledSelect
            label="Method"
            id="conn-method"
            name="conn-method"
            htmlFor="conn-method"
            value={method}
            onChange={e => setMethod(e.target.value as typeof method)}
            options={HTTP_METHODS}
          />

          <LabeledInput
            label="Description (optional)"
            name="description"
            value={description}
            type="text"
            placeholder=""
            id="conn-description"
            htmlFor="conn-description"
            onChange={e => setDescription(e.target.value)}
            disabled={loading}
          />

          <LabeledSelect
            label="Credential (optional)"
            id="conn-credential"
            name="conn-credential"
            htmlFor="conn-credential"
            value={credentialId}
            onChange={e => setCredentialId(e.target.value)}
            options={availableCredentials}
          />
        </div>

        <span className={s.buttonContainer}>
          <ActionButton disabled={disabled} icon={faTowerBroadcast} text="Create" type="submit" />
          <SecondaryButton disabled={loading} icon={faXmark} onClick={handleCancel} text="Cancel" />
        </span>
      </form>
    </div>
  );
};
