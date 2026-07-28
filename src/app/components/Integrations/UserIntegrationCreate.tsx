import s from './UserIntegrationCreate.module.css';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faPlug, faTag, faKey, faFileLines, faWrench, faXmark } from '@fortawesome/free-solid-svg-icons';
import { AppDispatch } from '../../../store';
import { upsertIntegration } from '../../../store/managementSlice';
import { addApiResponse } from '../../../store/apiResponsesSlice';
import { createUserIntegration } from '../../../services/userIntegrations';
import { API_BASE } from '../../../config/api';
import { LabeledInput } from '../Inputs/LabeledInput';
import { ActionButton } from '../Buttons/ActionButton';
import { SecondaryButton } from '../Buttons/SecondaryButton';
import { CustomForm } from '../Forms/CustomForm';
import { SectionHeader } from '../SectionHeader/SectionHeader';
import { SERVICE_PROVIDER_ICON } from './serviceProviderIcons';

type Choice = 'claude' | 'jira' | 'google' | 'custom' | null;

// Jira/Google OAuth requires client credentials registered on the deploy (config.oauthProviders)
// that don't exist yet — the backend 503s on /oauth/:provider/start until they're configured.
// Disable the tiles until that's live rather than let users hit a dead-end redirect.
const TILES: { id: Choice; label: string; description: string; icon: typeof faWrench; soon?: boolean }[] = [
  { id: 'claude', label: 'Claude',  description: 'Connect with an API key', icon: SERVICE_PROVIDER_ICON.claude },
  { id: 'jira',   label: 'Jira',    description: 'Connect via OAuth',        icon: SERVICE_PROVIDER_ICON.jira, soon: true },
  { id: 'google', label: 'Google',  description: 'Connect via OAuth',        icon: SERVICE_PROVIDER_ICON.google, soon: true },
  { id: 'custom', label: 'Custom',  description: 'Your own database, storage, or API credential', icon: faWrench },
];

export const UserIntegrationCreate = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();

  const [choice, setChoice] = useState<Choice>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [credential, setCredential] = useState('');

  const [loading, setLoading] = useState(false);
  const [disabled, setDisabled] = useState(true);

  useEffect(() => {
    const hasCredential = choice === 'claude' ? !!apiKey : choice === 'custom' ? !!credential : false;
    setDisabled(!name || !hasCredential || loading);
  }, [choice, name, apiKey, credential, loading]);

  const handleConnectOAuth = (provider: 'jira' | 'google') => {
    window.location.href = `${API_BASE}/streamby/user/integrations/oauth/${provider}/start`;
  };

  const handleSelectTile = (id: Choice) => {
    if (TILES.find(t => t.id === id)?.soon) return;
    if (id === 'jira' || id === 'google') {
      handleConnectOAuth(id);
      return;
    }
    setChoice(id);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (choice !== 'claude' && choice !== 'custom') return;
    setLoading(true);
    try {
      // Custom has no free-standing provider slot on the backend — it always submits as a
      // plain database/postgresql credential store, the closest already-valid shape to a
      // single opaque credential string. The UI never surfaces "Database"/"PostgreSQL"
      // anywhere; the field is simply labeled "Credential".
      const payload = choice === 'claude'
        ? { kind: 'service' as const, provider: 'claude', name, credential: apiKey }
        : { kind: 'database' as const, provider: 'postgresql', name, credential };

      const integration = await createUserIntegration({
        ...payload,
        ...(description && { description }),
      });
      dispatch(addApiResponse({ message: 'Integration created.', type: 'success' }));
      dispatch(upsertIntegration(integration));
      navigate('/user/integrations');
    } catch (error: any) {
      dispatch(addApiResponse({ message: error.message || 'Failed to create integration.', type: 'error' }));
    } finally {
      setLoading(false);
    }
  };

  if (!choice) {
    return (
      <div className={s.container}>
        <SectionHeader
          icon={faArrowLeft}
          title="New Integration"
          onIconClick={() => navigate(-1)}
        />
        <div className={s.gridWrapper}>
          <h3 className={s.gridTitle}>Add an integration</h3>
          <div className={s.grid}>
            {TILES.map(tile => (
              <button
                key={tile.id}
                type="button"
                className={`${s.card} ${tile.soon ? s.cardDisabled : ''}`}
                disabled={tile.soon}
                onClick={() => handleSelectTile(tile.id)}
              >
                <span className={s.cardIcon}><FontAwesomeIcon icon={tile.icon} /></span>
                <span className={s.cardLabelRow}>
                  <span className={s.cardLabel}>{tile.label}</span>
                  {tile.soon && <span className={s.soon}>Soon</span>}
                </span>
                <span className={s.cardDesc}>{tile.description}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={s.container}>
      <form onSubmit={handleSubmit} className={s.formWrapper}>
        <CustomForm
          readOnly={false}
          isLoading={loading}
          header={
            <SectionHeader
              icon={faArrowLeft}
              title={choice === 'claude' ? 'Connect Claude' : 'Custom Integration'}
              subtitle={choice === 'claude' ? 'Connect with an API key' : 'Your own database, storage, or API credential'}
              onIconClick={() => setChoice(null)}
            />
          }
          fields={[
            {
              icon: faTag,
              label: 'Name',
              value: name || '—',
              editComponent: (
                <LabeledInput
                  label="Name" name="name" value={name} type="text"
                  placeholder={choice === 'claude' ? 'My Claude Key' : 'My Integration'} id="integration-name" htmlFor="integration-name"
                  onChange={e => setName(e.target.value)} disabled={loading}
                />
              ),
            },
            choice === 'claude' ? {
              icon: faKey,
              label: 'API key',
              value: apiKey ? '••••••••' : '—',
              editComponent: (
                <LabeledInput
                  label="API key" name="apiKey" value={apiKey} type="password"
                  placeholder="sk-ant-..." id="integration-api-key" htmlFor="integration-api-key"
                  onChange={e => setApiKey(e.target.value)} disabled={loading}
                />
              ),
            } : {
              icon: faKey,
              label: 'Credential',
              value: credential ? '••••••••' : '—',
              editComponent: (
                <LabeledInput
                  label="Credential" name="credential" value={credential} type="password"
                  placeholder="" id="integration-credential" htmlFor="integration-credential"
                  onChange={e => setCredential(e.target.value)} disabled={loading}
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
                  placeholder="" id="integration-description" htmlFor="integration-description"
                  onChange={e => setDescription(e.target.value)} disabled={loading}
                />
              ),
            },
          ]}
          actions={
            <>
              <ActionButton disabled={disabled} icon={faPlug} text="Create" type="submit" />
              <SecondaryButton disabled={loading} icon={faXmark} onClick={() => navigate('/user/integrations')} text="Cancel" />
            </>
          }
        />
      </form>
    </div>
  );
};
