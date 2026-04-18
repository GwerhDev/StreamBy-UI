import s from './ProjectPreviewContent.module.css';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck, faXmark, faEnvelope } from '@fortawesome/free-solid-svg-icons';
import { RootState } from '../../../store';
import { ProjectPresentation } from '../ProjectPresentation/ProjectPresentation';
import { acceptInvitation, rejectInvitation } from '../../../services/members';

export const ProjectPreviewContent = () => {
  const session = useSelector((state: RootState) => state.session);
  const { data: currentProject, membership } = useSelector((state: RootState) => state.currentProject);
  const navigate = useNavigate();

  const isPending = membership?.isMember && membership?.status === 'pending';

  const handleAccept = async () => {
    if (!currentProject?.id || !session.userId) return;
    await acceptInvitation(currentProject.id, session.userId);
  };

  const handleReject = async () => {
    if (!currentProject?.id || !session.userId) return;
    await rejectInvitation(currentProject.id, session.userId);
    navigate('/');
  };

  return (
    <div className={s.container}>
      <ProjectPresentation preview />

      {isPending && (
        <div className={s.floatingCard}>
          <div className={s.floatingIcon}>
            <FontAwesomeIcon icon={faEnvelope} />
          </div>
          <div className={s.floatingBody}>
            <p className={s.floatingTitle}>Project invitation</p>
            <p className={s.floatingText}>
              You've been invited to this project.
            </p>
          </div>
          <div className={s.floatingActions}>
            <button className={s.acceptBtn} onClick={handleAccept}>
              <FontAwesomeIcon icon={faCheck} />
              Accept
            </button>
            <button className={s.rejectBtn} onClick={handleReject}>
              <FontAwesomeIcon icon={faXmark} />
              Reject
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
