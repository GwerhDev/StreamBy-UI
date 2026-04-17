import s from './AllowedOriginsList.module.css';
import skeleton from '../Loader/Skeleton.module.css';
import { faGlobe } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { SectionHeader } from '../SectionHeader/SectionHeader';
import { useSelector } from 'react-redux';
import { RootState } from '../../../store';
import { EmptyBackground } from '../Backgrounds/EmptyBackground';

export const AllowedOriginsList = () => {
  const { data: currentProjectData, loading: currentProjectLoading } = useSelector((state: RootState) => state.currentProject);
  const allowedOrigins = currentProjectData?.allowedOrigin;

  return (
    <div className={s.container}>
      <SectionHeader icon={faGlobe} title="Allowed Origins" subtitle="Manage your project's allowed origins" />
      {
        currentProjectLoading
          ?
          <ul className={s.originGrid}>
            {Array.from({ length: 3 }).map((_, index) => (
              <li key={index} className={`${s.cardSkeleton} ${skeleton.skeleton}`}></li>
            ))}
          </ul>
          : !allowedOrigins?.length ? (
            <div className={s.emptyState}>
              <EmptyBackground />
            </div>
          ) : (
            <ul className={s.originGrid}>
              {allowedOrigins?.map((origin, index) => (
                <li key={index} className={s.originListItem}>
                  <span className={s.originIconContainer}>
                    <FontAwesomeIcon icon={faGlobe} />
                  </span>
                  <h4 className={s.originText}>
                    {origin}
                  </h4>
                </li>
              ))}
            </ul>
          )
      }
    </div>
  );
};
