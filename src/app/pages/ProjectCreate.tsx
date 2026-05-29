import { CreateProjectForm } from '../components/Forms/CreateProjectForm';
import { HomeMenu } from '../components/LateralMenu/HomeMenu';

export const ProjectCreate = () => {
  return (
    <div className="dashboard-sections">
      <HomeMenu />
      <CreateProjectForm />
    </div>
  );
};
