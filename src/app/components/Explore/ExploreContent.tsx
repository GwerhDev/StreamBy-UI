import s from './ExploreContent.module.css';
import skeleton from '../Loader/Skeleton.module.css';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { exploreProjects } from '../../../services/projects';
import { ExploreProject } from '../../../interfaces';
import { ExploreProjectCard } from '../Cards/ExploreProjectCard';
import { EmptyBackground } from '../Backgrounds/EmptyBackground';
import { SectionHeader } from '../SectionHeader/SectionHeader';
import { faCompass } from '@fortawesome/free-solid-svg-icons';

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
      <div className={s.createContainer}>
        <SectionHeader
          icon={faCompass}
          title="Explore Projects"
          subtitle="Discover public projects and request to join them"
        />
        {loading ? (
          <ul>
            {Array.from({ length: 3 }).map((_, i) => (
              <li key={i} className={`${s.projectCardSkeleton} ${skeleton.skeleton}`} />
            ))}
          </ul>
        ) : projects.length === 0 ? (
          <EmptyBackground />
        ) : (
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
        )}
      </div>
    </div>
  );
};
