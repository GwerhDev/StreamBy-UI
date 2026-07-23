import s from './UserIntegrationCreate.module.css';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { faPlug, faXmark, faTag, faLayerGroup, faKey, faFileLines } from '@fortawesome/free-solid-svg-icons';
import { AppDispatch } from '../../../store';
import { upsertIntegration } from '../../../store/managementSlice';
import { addApiResponse } from '../../../store/apiResponsesSlice';
import { createUserIntegration } from '../../../services/userIntegrations';
import { IntegrationKind } from '../../../interfaces';
import { LabeledInput } from '../Inputs/LabeledInput';
import { LabeledSelect } from '../Inputs/LabeledSelect';
import { ActionButton } from '../Buttons/ActionButton';
import { SecondaryButton } from '../Buttons/SecondaryButton';
import { CustomForm } from '../Forms/CustomForm';

const KINDS = [
  { value: 'database', label: 'Database' },
  { value: 'storage',  label: 'Storage' },
];

const DB_PROVIDERS = [
  { value: 'postgresql', label: 'PostgreSQL' },
  { value: 'mongodb',    label: 'MongoDB' },
];

const STORAGE_PROVIDERS = [
  { value: 's3',    label: 'AWS S3' },
  { value: 'gcs',   label: 'Google Cloud Storage' },
  { value: 'r2',    label: 'Cloudflare R2' },
  { value: 'azure', label: 'Azure Blob Storage' },
];

export const UserIntegrationCreate = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();

  const [kind, setKind] = useState<IntegrationKind>('database');
  const [provider, setProvider] = useState(DB_PROVIDERS[0].value);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const [connectionString, setConnectionString] = useState('');
  const [bucket, setBucket] = useState('');
  const [region, setRegion] = useState('');
  const [accessKeyId, setAccessKeyId] = useState('');
  const [secretAccessKey, setSecretAccessKey] = useState('');

  const [loading, setLoading] = useState(false);
  const [disabled, setDisabled] = useState(true);

  const providerOptions = kind === 'database' ? DB_PROVIDERS : STORAGE_PROVIDERS;

  useEffect(() => {
    setProvider(providerOptions[0].value);
    // eslint-disable-next-line
  }, [kind]);

  useEffect(() => {
    const hasCredential = kind === 'database'
      ? !!connectionString
      : !!(bucket && region && accessKeyId && secretAccessKey);
    setDisabled(!name || !hasCredential || loading);
  }, [kind, name, connectionString, bucket, region, accessKeyId, secretAccessKey, loading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const credential = kind === 'database'
        ? connectionString
        : { bucket, region, accessKeyId, secretAccessKey };

      const integration = await createUserIntegration({
        kind, provider, name,
        ...(description && { description }),
        credential,
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

  return (
    <div className={s.container}>
      <form onSubmit={handleSubmit}>
        <CustomForm
          readOnly={false}
          isLoading={loading}
          header={{ icon: faPlug, title: 'New Integration', subtitle: 'Connect your own database or storage account' }}
          fields={[
            {
              icon: faLayerGroup,
              label: 'Kind',
              value: kind,
              editComponent: (
                <LabeledSelect
                  label="Kind" id="integration-kind" name="integration-kind" htmlFor="integration-kind"
                  value={kind} onChange={e => setKind(e.target.value as IntegrationKind)}
                  options={KINDS}
                />
              ),
            },
            {
              icon: faLayerGroup,
              label: 'Provider',
              value: provider,
              editComponent: (
                <LabeledSelect
                  label="Provider" id="integration-provider" name="integration-provider" htmlFor="integration-provider"
                  value={provider} onChange={e => setProvider(e.target.value)}
                  options={providerOptions}
                />
              ),
            },
            {
              icon: faTag,
              label: 'Name',
              value: name || '—',
              editComponent: (
                <LabeledInput
                  label="Name" name="name" value={name} type="text"
                  placeholder="My Postgres DB" id="integration-name" htmlFor="integration-name"
                  onChange={e => setName(e.target.value)} disabled={loading}
                />
              ),
            },
            ...(kind === 'database' ? [{
              icon: faKey,
              label: 'Connection string',
              value: connectionString ? '••••••••' : '—',
              editComponent: (
                <LabeledInput
                  label="Connection string" name="connectionString" value={connectionString} type="password"
                  placeholder="postgres://user:pass@host:5432/db" id="integration-connstring" htmlFor="integration-connstring"
                  onChange={e => setConnectionString(e.target.value)} disabled={loading}
                />
              ),
            }] : [
              {
                icon: faKey,
                label: 'Bucket',
                value: bucket || '—',
                editComponent: (
                  <LabeledInput
                    label="Bucket" name="bucket" value={bucket} type="text"
                    placeholder="my-bucket" id="integration-bucket" htmlFor="integration-bucket"
                    onChange={e => setBucket(e.target.value)} disabled={loading}
                  />
                ),
              },
              {
                icon: faKey,
                label: 'Region',
                value: region || '—',
                editComponent: (
                  <LabeledInput
                    label="Region" name="region" value={region} type="text"
                    placeholder="us-east-1" id="integration-region" htmlFor="integration-region"
                    onChange={e => setRegion(e.target.value)} disabled={loading}
                  />
                ),
              },
              {
                icon: faKey,
                label: 'Access key ID',
                value: accessKeyId ? '••••••••' : '—',
                editComponent: (
                  <LabeledInput
                    label="Access key ID" name="accessKeyId" value={accessKeyId} type="password"
                    placeholder="" id="integration-access-key" htmlFor="integration-access-key"
                    onChange={e => setAccessKeyId(e.target.value)} disabled={loading}
                  />
                ),
              },
              {
                icon: faKey,
                label: 'Secret access key',
                value: secretAccessKey ? '••••••••' : '—',
                editComponent: (
                  <LabeledInput
                    label="Secret access key" name="secretAccessKey" value={secretAccessKey} type="password"
                    placeholder="" id="integration-secret-key" htmlFor="integration-secret-key"
                    onChange={e => setSecretAccessKey(e.target.value)} disabled={loading}
                  />
                ),
              },
            ]),
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
