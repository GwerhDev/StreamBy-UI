import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import CredentialList from '../components/Credentials/CredentialList';
import { PrimaryButton } from '../components/Buttons/PrimaryButton';

export const CredentialsList = () => {
  const { id: projectId } = useParams<{ id: string }>();
  const currentProject = useSelector((state: RootState) => state.currentProject.data);

  if (!currentProject || currentProject.id !== projectId) {
    return <div>Loading project details...</div>;
  }

  return (
    <div>
      <h1>Credentials for {currentProject.name}</h1>
      <Link to={`/project/${projectId}/settings/credentials/create`}>
        <PrimaryButton text="Add New Credential" />
      </Link>
      <CredentialList credentials={currentProject.credentials || []} />
    </div>
  );
};

export default CredentialsList;
