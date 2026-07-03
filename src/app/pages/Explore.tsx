import s from '../components/LateralMenu/LateralMenu.module.css';
import { useSearchParams } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCompass, faUsers, faFileExport, faSitemap } from '@fortawesome/free-solid-svg-icons';
import { LateralMenu } from '../components/LateralMenu/LateralMenu';
import { ExploreContent } from '../components/Explore/ExploreContent';

export const EXPLORE_FILTERS = [
  { id: 'projects',  label: 'Projects',  icon: faCompass    },
  { id: 'users',     label: 'Users',     icon: faUsers      },
  { id: 'exports',   label: 'Exports',   icon: faFileExport },
  { id: 'workflows', label: 'Workflows', icon: faSitemap    },
] as const;

export type ExploreFilterId = typeof EXPLORE_FILTERS[number]['id'];

export const Explore = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const filter = (searchParams.get('filter') ?? 'projects') as ExploreFilterId;

  return (
    <div className="dashboard-sections">
      <LateralMenu>
        <div className={s.accordionSection}>
          {EXPLORE_FILTERS.map(f => (
            <button
              key={f.id}
              className={`${s.navItem} ${filter === f.id ? s.activeLink : ''}`}
              onClick={() => setSearchParams({ filter: f.id })}
            >
              <FontAwesomeIcon icon={f.icon} />
              {f.label}
            </button>
          ))}
        </div>
      </LateralMenu>
      <div style={{ flexGrow: 1, minHeight: 0, overflow: 'auto' }}>
        <ExploreContent filter={filter} />
      </div>
    </div>
  );
};
