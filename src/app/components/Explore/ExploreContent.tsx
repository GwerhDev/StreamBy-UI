import s from './ExploreContent.module.css';
import skeleton from '../Loader/Skeleton.module.css';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { exploreProjects } from '../../../services/projects';
import { ExploreProject } from '../../../interfaces';
import { ExploreProjectCard } from '../Cards/ExploreProjectCard';
import { EmptyBackground } from '../Backgrounds/EmptyBackground';

export const ExploreContent = () => {
  const [projects, setProjects] = useState<ExploreProject[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    exploreProjects()
      .then(setProjects)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className={s.container}>
      {loading ? (
        <div className={s.createContainer}>
          <div className={s.title}>
            <h2>Searching...</h2>
            <p>(wait for it...)</p>
          </div>
          <ul>
            {Array.from({ length: 3 }).map((_, i) => (
              <li key={i} className={`${s.projectCardSkeleton} ${skeleton.skeleton}`} />
            ))}
          </ul>
        </div>
      ) : projects.length === 0 ? (
        <EmptyBackground />
      ) : (
        <div className={s.createContainer}>
          <div className={s.title}>
            <h2>Explore Projects</h2>
            <p>Discover public projects and request to join them</p>
          </div>
          <ul>
            {projects.map(project => (
              <li
                key={project.id}
                title={project.name}
                onClick={() => navigate(`/preview/${project.id}`)}
              >
                <ExploreProjectCard project={project} />
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
