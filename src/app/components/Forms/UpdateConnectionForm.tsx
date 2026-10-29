import s from './CreateConnectionForm.module.css';
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../../../store';
import { useFormRoute } from '../../../hooks/useFormRoute';
import { updateConnection } from '../../../services/connections';
import { setCurrentProject } from '../../../store/currentProjectSlice';
import { addApiResponse } from '../../../store/apiResponsesSlice';
import { LabeledInput } from '../Inputs/LabeledInput';
import { LabeledSelect } from '../Inputs/LabeledSelect';
import { ActionButton } from '../Buttons/ActionButton';
import { SecondaryButton } from '../Buttons/SecondaryButton';
import { faPenToSquare, faXmark, faLink, faLayerGroup, faFileLines, faFingerprint, faLock, faCode } from '@fortawesome/free-solid-svg-icons';
import { CustomForm } from './CustomForm';

const HTTP_METHODS = [
  { value: 'POST', label: 'POST' },
  { value: 'GET', label: 'GET' },
  { value: 'PUT', label: 'PUT' },
  { value: 'PATCH', label: 'PATCH' },
  { value: 'DELETE', label: 'DELETE' },
];

export const UpdateConnectionForm = () => {
  const { id: projectId, connectionId } = useParams<{ id: string; connectionId: string }>();
  const { close, done } = useFormRoute();
  const dispatch = useDispatch<AppDispatch>();
  const currentProject = useSelector((state: RootState) => state.currentProject.data);
  const connection = currentProject?.connections?.find(c => c.id === connectionId);

  const [name, setName] = useState('');
  const [apiUrl, setApiUrl] = useState('');
  const [method, setMethod] = useState<'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE'>('GET');
  const [description, setDescription] = useState('');
  const [usesCredentials, setUsesCredentials] = useState(false);
  const [token, setToken] = useState('');
  const [prefix, setPrefix] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!connection) return;
    setName(connection.name);
    setApiUrl(connection.apiUrl);
    setMethod(connection.method);
    setDescription(connection.description ?? '');
    // token always starts blank — the server never sends the real secret back,
    // only hasCredential. Leaving it blank on submit preserves the existing one.
    setToken('');
    setUsesCredentials(!!(connection.prefix || connection.hasCredential));
    setPrefix(connection.prefix ?? '');
  }, [connection]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectId || !connectionId || !currentProject) return;
    setLoading(true);
    try {
      const payload = {
        name, apiUrl, method,
        ...(description && { description }),
        ...(usesCredentials && token && { token }),
        ...(usesCredentials && prefix && { prefix }),
      };
      const updated = await updateConnection(projectId, connectionId, payload);
      if (updated && currentProject.connections) {
        dispatch(setCurrentProject({
          ...currentProject,
          connections: currentProject.connections.map(c => c.id === connectionId ? updated : c),
        }));
        dispatch(addApiResponse({ message: 'Connection updated successfully.', type: 'success' }));
      }
      done(`/project/${projectId}/connections/${connectionId}`);
    } catch (error: any) {
      dispatch(addApiResponse({ message: error.message || 'Failed to update connection.', type: 'error' }));
    } finally {
      setLoading(false);
    }
  };

  if (!connection) return null;

  return (
    <div className={s.container}>
      <form onSubmit={handleSubmit} className={s.form}>
        <div className={s.formWrapper}>
          <CustomForm
            readOnly={false}
            isLoading={loading}
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
                label: 'API URL',
                value: apiUrl || '—',
                editComponent: (
                  <LabeledInput
                    label="API URL" name="apiUrl" value={apiUrl} type="text"
                    placeholder="https://api.example.com/webhook" id="conn-url" htmlFor="conn-url"
                    onChange={e => setApiUrl(e.target.value)} disabled={loading}
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
                icon: faFingerprint,
                label: 'Uses credentials',
                value: usesCredentials ? 'Yes' : 'No',
                editComponent: (
                  <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '14px', color: 'var(--color-text-secondary)' }}>
                    <input
                      type="checkbox"
                      checked={usesCredentials}
                      onChange={e => { setUsesCredentials(e.target.checked); if (!e.target.checked) { setToken(''); setPrefix(''); } }}
                      disabled={loading}
                      style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: '#818cf8' }}
                    />
                    This connection uses a credential
                  </label>
                ),
              },
              {
                icon: faLock,
                label: 'Secret',
                value: token ? '••••••••' : (connection.hasCredential ? 'Configured' : '—'),
                hidden: !usesCredentials,
                editComponent: (
                  <LabeledInput
                    label="Secret (token / API key)" name="token" value={token} type="password"
                    placeholder={connection.hasCredential ? 'Leave blank to keep current credential' : 'sk-...'}
                    id="conn-token" htmlFor="conn-token"
                    onChange={e => setToken(e.target.value)} disabled={loading}
                  />
                ),
              },
              {
                icon: faLock,
                label: 'Auth Prefix',
                value: prefix || '—',
                hidden: !usesCredentials,
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
                <ActionButton disabled={!name || !apiUrl || loading} icon={faPenToSquare} text="Save changes" type="submit" />
                <SecondaryButton disabled={loading} icon={faXmark} onClick={() => close(`/project/${projectId}/connections/${connectionId}`)} text="Cancel" />
              </>
            }
          />
        </div>
      </form>
    </div>
  );
};
