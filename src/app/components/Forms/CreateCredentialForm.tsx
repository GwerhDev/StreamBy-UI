import s from './CreateCredentialForm.module.css';
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../../store';
import { createCredential } from '../../../services/projects';
import { setCurrentProject } from '../../../store/currentProjectSlice';
import { LabeledInput } from '../Inputs/LabeledInput';
import { ActionButton } from '../Buttons/ActionButton';
import { SecondaryButton } from '../Buttons/SecondaryButton';
import { Spinner } from '../Spinner';
import { faKey, faXmark, faFingerprint, faLock } from '@fortawesome/free-solid-svg-icons';
import { CustomForm } from './CustomForm';

export const CreateCredentialForm = () => {
  const { id: projectId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const currentProject = useSelector((state: RootState) => state.currentProject.data);

  const [key, setKey] = useState('');
  const [value, setValue] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectId || !key || !value) return;

    setLoading(true);
    try {
      const response = await createCredential(projectId, key, value);
      if (response && currentProject) {
        const newCredential = { id: response.id, key, value };
        const updatedCredentials = currentProject.credentials
          ? [...currentProject.credentials, newCredential]
          : [newCredential];
        dispatch(setCurrentProject({ ...currentProject, credentials: updatedCredentials }));
        navigate(`/project/${projectId}/settings/credentials`);
      }
    } catch (error) {
      console.error('Error creating credential:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Spinner bg isLoading={loading} />;
  if (!currentProject) return <div className={s.container}><Spinner bg isLoading={loading} /></div>;

  return (
    <div className={s.container}>
      <Spinner bg isLoading={loading} />
      <form onSubmit={handleSubmit} className={s.form}>
        <CustomForm
          readOnly={false}
          header={{ icon: faKey, title: 'New Credential', subtitle: `Add a credential for ${currentProject?.name}` }}
          fields={[
            {
              icon: faFingerprint,
              label: 'Key',
              value: key || '—',
              editComponent: (
                <LabeledInput
                  label="Key" name="key" value={key} type="text"
                  placeholder="Enter credential key"
                  id="credential-key" htmlFor="credential-key"
                  onChange={e => setKey(e.target.value)} disabled={loading}
                />
              ),
            },
            {
              icon: faLock,
              label: 'Value',
              value: value || '—',
              editComponent: (
                <LabeledInput
                  label="Value" name="value" value={value} type="text"
                  placeholder="Enter credential value"
                  id="credential-value" htmlFor="credential-value"
                  onChange={e => setValue(e.target.value)} disabled={loading}
                />
              ),
            },
          ]}
          actions={
            <>
              <ActionButton disabled={loading || !key || !value} icon={faKey} text="Create" type="submit" />
              <SecondaryButton disabled={loading} icon={faXmark} onClick={() => navigate(-1)} text="Cancel" />
            </>
          }
        />
      </form>
    </div>
  );
};
