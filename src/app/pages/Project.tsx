import { useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { LateralMenu } from '../components/LateralMenu/LateralMenu';
import { Browser } from '../components/Browser/Browser';
import { fetchProject } from '../../services/streamby';
import { DeleteProjectModal } from '../components/Modals/DeleteProjectModal';

export const Project = () => {
  const { id } = useParams();
  const [project, setProject] = useState(null);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const data = await fetchProject(id);
        setProject(data);
      } catch (err) {
        console.error('Error loading project:', err);
      }
    })();
  }, [id]);

  if (!project) return <div>Loading...</div>;

  return (
    <div className="dashboard-sections">
      <LateralMenu project={project} />
      <Browser />
      <DeleteProjectModal project={project} />
    </div>
  );
};
