import { useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { CredentialList } from '../components/Credentials/CredentialList';
import { CreateCredentialForm } from '../components/Forms/CreateCredentialForm';

export const Credentials = () => {
  const { id: projectId } = useParams<{ id: string }>();
  const currentProject = useSelector((state: RootState) => state.currentProject.data);

  if (!currentProject || currentProject.id !== projectId) {
    return <div>Loading project details...</div>;
  }

  return (
    <div>
      <h1>Credentials for {currentProject.name}</h1>
      <CredentialList />
      <CreateCredentialForm />
    </div>
  );
};
