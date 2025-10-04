import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../../store';
import { fetchCredential, updateCredential } from '../../../services/projects';
import { setCurrentProject } from '../../../store/currentProjectSlice';

import styles from './UpdateCredentialForm.module.css';
import { LabeledInput } from '../Inputs/LabeledInput';
import { ActionButton } from '../Buttons/ActionButton';
import { SecondaryButton } from '../Buttons/SecondaryButton';
import { Spinner } from '../Spinner';
import { faKey, faXmark } from '@fortawesome/free-solid-svg-icons';

interface Credential {
  id: string;
  key: string;
  value: string;
}

export const UpdateCredentialForm: React.FC = () => {
  const { id: projectId, credentialId } = useParams<{ id: string; credentialId: string }>();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const currentProject = useSelector((state: RootState) => state.currentProject.data);

  const [key, setKey] = useState('');
  const [value, setValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [initialCredential, setInitialCredential] = useState<Credential | null>(null);

  useEffect(() => {
    const getCredentialDetails = async () => {
      if (!projectId || !credentialId) {
        return;
      }
      setLoading(true);
      try {
        const data = await fetchCredential(projectId, credentialId);
        if (data) {
          setInitialCredential(data);
          setKey(data.key);
          setValue(data.value);
        }
      } catch (err) {
        console.error('Error fetching credential details:', err);
      } finally {
        setLoading(false);
      }
    };

    getCredentialDetails();
  }, [projectId, credentialId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectId || !credentialId || !key || !value) return;

    setLoading(true);
    try {
      const payload = { key, value };
      const response = await updateCredential(projectId, credentialId, payload);
      if (response && currentProject) {
        // Update the specific credential in the Redux store
        const updatedCredentials = currentProject.credentials?.map(cred =>
          cred.id === credentialId ? { ...cred, key, value } : cred
        );
        dispatch(setCurrentProject({ ...currentProject, credentials: updatedCredentials }));
        navigate(`/project/${projectId}/settings/credentials/${credentialId}`); // Navigate back to details
      }
    } catch (error) {
      console.error('Error updating credential:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate(-1); // Go back to the previous page
  };

  const isFormDirty = initialCredential && (key !== initialCredential.key || value !== initialCredential.value);
  const isDisabled = loading || !key || !value || !isFormDirty;

  return (
    <div className={styles.container}> {/* Use container from UpdateExportForm */}
      <Spinner bg isLoading={loading} />
      <form onSubmit={handleSubmit}>
        <div className={styles.formContainer}>
          <h3>Update Credential</h3>
          <p>Fill the form to update credential {initialCredential?.key}</p>

          <LabeledInput
            label="Key"
            name="key"
            value={key}
            type="text"
            placeholder="Enter credential key"
            id="credential-key"
            htmlFor="credential-key"
            onChange={(e) => setKey(e.target.value)}
            disabled={loading}
          />
          <LabeledInput
            label="Value"
            name="value"
            value={value}
            type="text"
            placeholder="Enter credential value"
            id="credential-value"
            htmlFor="credential-value"
            onChange={(e) => setValue(e.target.value)}
            disabled={loading}
          />
        </div>
        <span className={styles.buttonContainer}>
          <ActionButton disabled={isDisabled} icon={faKey} text="Update" type="submit" />
          <SecondaryButton disabled={loading} icon={faXmark} onClick={handleCancel} text="Cancel" />
        </span>
      </form>
    </div>
  );
};
