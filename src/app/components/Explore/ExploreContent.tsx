import s from './ExploreContent.module.css';
import skeleton from '../Loader/Skeleton.module.css';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { exploreProjects } from '../../../services/projects';
import { ExploreProject } from '../../../interfaces';
import { ExploreProjectCard } from '../Cards/ExploreProjectCard';
import { EmptyBackground } from '../Backgrounds/EmptyBackground';
import { SectionHeader } from '../SectionHeader/SectionHeader';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCompass, faMagnifyingGlass } from '@fortawesome/free-solid-svg-icons';
import type { ExploreFilterId } from '../../pages/Explore';

interface Props { filter: ExploreFilterId | null; }

export const ExploreContent = ({ filter }: Props) => {
  const [query, setQuery] = useState('');
  const [projects, setProjects] = useState<ExploreProject[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    exploreProjects()
      .then(setProjects)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = projects.filter(p =>
    !query || p.name.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className={s.container}>
      <div className={s.createContainer}>
        <SectionHeader icon={faCompass} title="Explore" subtitle="Search across projects, users, exports, workflows and more" />

        <div className={s.searchBar}>
          <FontAwesomeIcon icon={faMagnifyingGlass} className={s.searchIcon} />
          <input
            className={s.searchInput}
            placeholder={filter ? `Search ${filter}...` : 'Search...'}
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
        </div>

        {filter === null || filter === 'projects' ? (
          loading ? (
            <ul>
              {Array.from({ length: 3 }).map((_, i) => (
                <li key={i} className={`${s.projectCardSkeleton} ${skeleton.skeleton}`} />
              ))}
            </ul>
          ) : filtered.length === 0 ? (
            <EmptyBackground />
          ) : (
            <ul>
              {filtered.map(project => (
                <li key={project.id} title={project.name} onClick={() => navigate(`/preview/${project.id}`)}>
                  <ExploreProjectCard project={project} />
                </li>
              ))}
            </ul>
          )
        ) : (
          <EmptyBackground />
        )}
      </div>
    </div>
  );
};
