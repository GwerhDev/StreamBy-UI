import s from '../components/LateralMenu/LateralMenu.module.css';
import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCompass, faUsers, faFileExport, faSitemap, faChevronDown } from '@fortawesome/free-solid-svg-icons';
import { LateralMenu } from '../components/LateralMenu/LateralMenu';
import { ExploreContent } from '../components/Explore/ExploreContent';

export const EXPLORE_FILTERS = [
  { id: 'projects',  label: 'Projects',  icon: faCompass    },
  { id: 'users',     label: 'Users',     icon: faUsers      },
  { id: 'exports',   label: 'Exports',   icon: faFileExport },
  { id: 'workflows', label: 'Workflows', icon: faSitemap    },
] as const;

export type ExploreFilterId = typeof EXPLORE_FILTERS[number]['id'];

const RAIL_ITEMS = [
  { icon: faCompass, path: '/explore', label: 'Explore' },
];

export const Explore = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const filter = searchParams.get('filter') as ExploreFilterId | null;
  const [sectionOpen, setSectionOpen] = useState(true);

  return (
    <div className="dashboard-sections">
      <LateralMenu railItems={RAIL_ITEMS}>
        <div className={s.accordionSection}>
          <div
            className={`${s.sectionHeader} ${s.sectionHeaderActive}`}
            onClick={() => setSectionOpen(v => !v)}
          >
            <span
              className={s.sectionLabel}
              onClick={e => { e.stopPropagation(); navigate('/explore'); }}
            >
              Explore
            </span>
            <div className={`${s.sectionChevronWrap} ${sectionOpen ? s.sectionChevronWrapOpen : ''}`}>
              <FontAwesomeIcon icon={faCompass} className={s.sectionChevronSectionIcon} />
              <FontAwesomeIcon icon={faChevronDown} className={s.sectionChevronArrow} />
            </div>
          </div>
          {sectionOpen && (
            <div className={s.sectionBody}>
              {EXPLORE_FILTERS.map(f => (
                <Link
                  key={f.id}
                  to={`/explore?filter=${f.id}`}
                  className={`${s.navItem} ${filter === f.id ? s.activeLink : ''}`}
                >
                  <FontAwesomeIcon icon={f.icon} />
                  {f.label}
                </Link>
              ))}
            </div>
          )}
        </div>
      </LateralMenu>
      <div style={{ flexGrow: 1, minHeight: 0, overflow: 'auto' }}>
        <ExploreContent filter={filter} />
      </div>
    </div>
  );
};
