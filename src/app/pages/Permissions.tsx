import { useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { AllowedOriginsList } from '../../app/components/Permissions/AllowedOriginsList';


export const Permissions = () => {
  const { id } = useParams<{ id: string }>();
  const currentProject = useSelector((state: RootState) => state.currentProject);

  if (!currentProject.data || currentProject.data.id !== id) {
    return (
      <div>Loading project or project not found...</div>
    );
  }

  return (
    <AllowedOriginsList allowedOrigins={currentProject.data.allowedOrigin || []} />
  );
};
