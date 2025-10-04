import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../store';
import { CredentialList } from '../components/Credentials/CredentialList';
import { CreateCredentialForm } from '../components/Forms/CreateCredentialForm';
import { createCredential } from '../../services/projects';
import { setCurrentProject } from '../../store/currentProjectSlice';

export const Credentials = () => {
  const { id: projectId } = useParams<{ id: string }>();
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
      // Assuming the API returns the updated project or just the new credential
      // For now, let's assume it returns the new credential and we append it
      // In a real app, you might refetch the project or get the full updated project from the API
      if (response && currentProject) {
        const newCredential = { id: response.id, key, value }; // Assuming response.id exists
        const updatedCredentials = currentProject.credentials
          ? [...currentProject.credentials, newCredential]
          : [newCredential];
        dispatch(setCurrentProject({ ...currentProject, credentials: updatedCredentials }));
      }
    } catch (error) {
      console.error('Error creating credential:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1>Credentials for {currentProject.name}</h1>
      <CredentialList credentials={currentProject.credentials || []} />
      <CreateCredentialForm
        onCreate={handleCreateCredential}
        loading={loading}
        setLoading={setLoading}
      />
    </div>
  );
};
