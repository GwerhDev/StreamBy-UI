import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../../store';
import { createCredential } from '../../../services/projects';
import { setCurrentProject } from '../../../store/currentProjectSlice';

import styles from './CreateCredentialForm.module.css';
import { LabeledInput } from '../Inputs/LabeledInput';
import { ActionButton } from '../Buttons/ActionButton';
import { SecondaryButton } from '../Buttons/SecondaryButton';
import { Spinner } from '../Spinner';
import { faKey, faXmark } from '@fortawesome/free-solid-svg-icons';

export const CreateCredentialForm = () => { // Removed props
  const { id: projectId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const currentProject = useSelector((state: RootState) => state.currentProject.data);

  const [key, setKey] = useState('');
  const [value, setValue] = useState('');
  const [loading, setLoading] = useState(false); // Managed internally

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
        navigate(`/project/${projectId}/settings/credentials`); // Navigate back to the list
      }
    } catch (error) {
      console.error('Error creating credential:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate(-1); // Go back to the previous page
  };

  return (
    <div className={styles.container}> {/* Use container from CreateExportForm */}
      <Spinner bg isLoading={loading} />
      <form onSubmit={handleSubmit}>
        <div className={styles.formContainer}>
          <h3>Create New Credential</h3>
          <p>Fill the form to create a new credential for {currentProject?.name}</p>

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
          <ActionButton disabled={loading || !key || !value} icon={faKey} text="Create" type="submit" />
          <SecondaryButton disabled={loading} icon={faXmark} onClick={handleCancel} text="Cancel" />
        </span>
      </form>
    </div>
  );
};
