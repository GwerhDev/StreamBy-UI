import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../store';
import CreateCredentialForm from '../components/Forms/CreateCredentialForm';
import { createCredential } from '../../services/projects';
import { setCurrentProject } from '../../store/currentProjectSlice';

export const CredentialsCreate = () => {
  const { id: projectId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const currentProject = useSelector((state: RootState) => state.currentProject.data);
  const [loading, setLoading] = useState(false);

  if (!currentProject || currentProject.id !== projectId) {
    return <div>Loading project details...</div>;
  }

  const handleCreateCredential = async (key: string, value: string) => {
    if (!projectId) return;
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

  return (
    <div>
      <h1>Create New Credential for {currentProject.name}</h1>
      <CreateCredentialForm
        projectId={projectId || ''}
        onCreate={handleCreateCredential}
        loading={loading}
      />
    </div>
  );
};
