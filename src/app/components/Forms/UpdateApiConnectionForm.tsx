import s from './CreateApiConnectionForm.module.css';
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../../store';
import { updateApiConnection } from '../../../services/connections';
import { setCurrentProject } from '../../../store/currentProjectSlice';
import { LabeledInput } from '../Inputs/LabeledInput';
import { LabeledSelect } from '../Inputs/LabeledSelect';
import { ActionButton } from '../Buttons/ActionButton';
import { SecondaryButton } from '../Buttons/SecondaryButton';
import { Spinner } from '../Spinner';
import { faPenToSquare, faXmark, faLink, faLayerGroup, faFileLines, faKey, faLock, faCode } from '@fortawesome/free-solid-svg-icons';
import { CustomForm } from './CustomForm';

const HTTP_METHODS = [
  { value: 'POST', label: 'POST' },
  { value: 'GET', label: 'GET' },
  { value: 'PUT', label: 'PUT' },
  { value: 'PATCH', label: 'PATCH' },
  { value: 'DELETE', label: 'DELETE' },
];

export const UpdateApiConnectionForm = () => {
  const { id: projectId, apiConnectionId } = useParams<{ id: string; apiConnectionId: string }>();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const currentProject = useSelector((state: RootState) => state.currentProject.data);
  const connection = currentProject?.apiConnections?.find(c => c.id === apiConnectionId);

  const [name, setName] = useState('');
  const [baseUrl, setBaseUrl] = useState('');
  const [method, setMethod] = useState<'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE'>('GET');
  const [description, setDescription] = useState('');
  const [credentialId, setCredentialId] = useState('');
  const [prefix, setPrefix] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!connection) return;
    setName(connection.name);
    setBaseUrl(connection.baseUrl);
    setMethod(connection.method);
    setDescription(connection.description ?? '');
    setCredentialId(connection.credentialId ?? '');
    setPrefix(connection.prefix ?? '');
  }, [connection]);

  const availableCredentials = [
    { value: '', label: 'None' },
    ...(currentProject?.credentials?.map(c => ({ value: c.id, label: c.key })) ?? []),
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectId || !apiConnectionId || !currentProject) return;
    setLoading(true);
    try {
      const payload = {
        name, baseUrl, method,
        ...(description && { description }),
        ...(credentialId && { credentialId }),
        ...(credentialId && prefix && { prefix }),
      };
      const updated = await updateApiConnection(projectId, apiConnectionId, payload);
      if (updated && currentProject.apiConnections) {
        dispatch(setCurrentProject({
          ...currentProject,
          apiConnections: currentProject.apiConnections.map(c => c.id === apiConnectionId ? updated : c),
        }));
      }
      navigate(`/project/${projectId}/connections/api/${apiConnectionId}`);
    } catch {
      // error handled in service
    } finally {
      setLoading(false);
    }
  };

  if (!connection) return null;

  return (
    <div className={s.container}>
      <Spinner bg isLoading={loading} />
      <form onSubmit={handleSubmit} className={s.form}>
        <div className={s.formWrapper}>
          <CustomForm
            readOnly={false}
            header={{ icon: faPenToSquare, title: 'Edit API Connection', subtitle: connection.name }}
            fields={[
              {
                icon: faCode,
                label: 'Name',
                value: name || '—',
                editComponent: (
                  <LabeledInput
                    label="Name" name="name" value={name} type="text"
                    placeholder="My Webhook" id="conn-name" htmlFor="conn-name"
                    onChange={e => setName(e.target.value)} disabled={loading}
                  />
                ),
              },
              {
                icon: faLink,
                label: 'Base URL',
                value: baseUrl || '—',
                editComponent: (
                  <LabeledInput
                    label="Base URL" name="baseUrl" value={baseUrl} type="text"
                    placeholder="https://api.example.com/webhook" id="conn-url" htmlFor="conn-url"
                    onChange={e => setBaseUrl(e.target.value)} disabled={loading}
                  />
                ),
              },
              {
                icon: faLayerGroup,
                label: 'Method',
                value: method,
                editComponent: (
                  <LabeledSelect
                    label="Method" id="conn-method" name="conn-method" htmlFor="conn-method"
                    value={method} onChange={e => setMethod(e.target.value as typeof method)}
                    options={HTTP_METHODS}
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
                    placeholder="" id="conn-description" htmlFor="conn-description"
                    onChange={e => setDescription(e.target.value)} disabled={loading}
                  />
                ),
              },
              {
                icon: faKey,
                label: 'Credential',
                value: credentialId || 'None',
                editComponent: (
                  <LabeledSelect
                    label="Credential (optional)" id="conn-credential" name="conn-credential" htmlFor="conn-credential"
                    value={credentialId}
                    onChange={e => { setCredentialId(e.target.value); if (!e.target.value) setPrefix(''); }}
                    options={availableCredentials}
                  />
                ),
              },
              {
                icon: faLock,
                label: 'Auth Prefix',
                value: prefix || '—',
                hidden: !credentialId,
                editComponent: (
                  <LabeledInput
                    label="Auth Prefix (optional)" name="prefix" value={prefix} type="text"
                    placeholder="Bearer" id="conn-auth-prefix" htmlFor="conn-auth-prefix"
                    onChange={e => setPrefix(e.target.value)} disabled={loading}
                  />
                ),
              },
            ]}
            actions={
              <>
                <ActionButton disabled={!name || !baseUrl || loading} icon={faPenToSquare} text="Save changes" type="submit" />
                <SecondaryButton disabled={loading} icon={faXmark} onClick={() => navigate(-1)} text="Cancel" />
              </>
            }
          />
        </div>
      </form>
    </div>
  );
};
