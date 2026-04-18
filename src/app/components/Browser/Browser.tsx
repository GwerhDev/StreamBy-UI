import s from './Browser.module.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useLocation, useParams, useNavigate } from 'react-router-dom';
import { faArrowLeft, faChevronRight, faFolder } from '@fortawesome/free-solid-svg-icons';
import { useSelector } from 'react-redux';
import { RootState } from '../../../store';

type BrowserProps = {
  children: React.ReactNode;
  preview?: boolean;
};

export const Browser = (props: BrowserProps) => {
  const { children, preview } = props;
  const location = useLocation();
  const navigate = useNavigate();
  const { id } = useParams();
  const { projectId } = useParams<{ projectId: string }>();
  const { membership } = useSelector((state: RootState) => state.currentProject);

  const isPending = membership?.isMember && membership?.status === 'pending';

  const handleBack = () => {
    if (location.key !== 'default') {
      navigate(-1);
    } else if (isPending) {
      navigate('/');
    } else {
      navigate(`/project/${projectId}/dashboard/overview`);
    }
  };


  const path = decodeURIComponent(location.pathname);
  const basePath = `/project/${id}`;
  const relativePath = path.replace(basePath, '');

  const segments = relativePath.split('/').filter(Boolean);

  const formatSegment = (seg: string) =>
    seg.replace(/[_-]/g, ' ');

  const handleNavigate = (index: number) => {
    const partial = segments.slice(0, index + 1).join('/');
    navigate(`${basePath}/${partial}`);
  };

  return (
    <div className={s.container}>
      {
        !preview ?
          <section className={s.location}>
            <span className={s.breadcrumb} onClick={() => navigate(basePath)}>
              <FontAwesomeIcon icon={faFolder} />
            </span>
            {
              segments.map((seg, i) => (
                <span key={i} className={s.separator}>
                  <FontAwesomeIcon icon={faChevronRight} />
                  <span className={s.breadcrumb} onClick={() => handleNavigate(i)}>
                    {formatSegment(seg)}
                  </span>
                </span>
              ))
            }
          </section>
          :
          <span>
            <button className={s.backBtn} onClick={handleBack}>
              <FontAwesomeIcon icon={faArrowLeft} />
              Back
            </button>
          </span>
      }
      <section className={s.content}>
        {children}
      </section>
    </div>
  );
};
