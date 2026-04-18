import s from './Browser.module.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useLocation, useParams, useNavigate } from 'react-router-dom';
import { faArrowLeft, faBan, faCheck, faChevronRight, faEnvelope, faFolder } from '@fortawesome/free-solid-svg-icons';
import { useSelector } from 'react-redux';
import { RootState } from '../../../store';
import { SecondaryButton } from '../Buttons/SecondaryButton';
import { ActionButton } from '../Buttons/ActionButton';
import { acceptInvitation, rejectInvitation } from '../../../services/members';

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
  const { data: currentProject, membership } = useSelector((state: RootState) => state.currentProject);

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

  const session = useSelector((state: RootState) => state.session);

  const handleAccept = async () => {
    if (!currentProject?.id || !session.userId) return;
    await acceptInvitation(currentProject.id, session.userId);
  };

  const handleReject = async () => {
    if (!currentProject?.id || !session.userId) return;
    await rejectInvitation(currentProject.id, session.userId);
    navigate('/');
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
          <span className={s.buttonsContainer}>
            <button className={s.backButton} onClick={handleBack}>
              <FontAwesomeIcon icon={faArrowLeft} />
            </button>
            {!isPending && (
              <div className={s.floatingCard}>
                <span className={s.message}>
                  <div className={s.floatingIcon}>
                    <FontAwesomeIcon icon={faEnvelope} />
                  </div>
                  <div className={s.floatingBody}>
                    <p className={s.floatingTitle}>Project invitation</p>
                    <p className={s.floatingText}>
                      You've been invited to this project.
                    </p>
                  </div>
                </span>
                <div className={s.floatingActions}>
                  <ActionButton onClick={handleAccept} icon={faCheck} text="Accept" type="button" />
                  <SecondaryButton onClick={handleReject} icon={faBan} text="Reject" type="button" />
                </div>
              </div>
            )}
          </span>
      }
      <section className={s.content}>
        {children}
      </section>
    </div>
  );
};
