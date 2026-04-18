import s from './ProjectPreviewContent.module.css';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck, faEnvelope, faBan } from '@fortawesome/free-solid-svg-icons';
import { RootState } from '../../../store';
import { ProjectPresentation } from '../ProjectPresentation/ProjectPresentation';
import { acceptInvitation, rejectInvitation } from '../../../services/members';
import { ActionButton } from '../Buttons/ActionButton';
import { SecondaryButton } from '../Buttons/SecondaryButton';

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
            <ActionButton onClick={handleAccept} icon={faCheck} text="Accept" type="button" />
            <SecondaryButton onClick={handleReject} icon={faBan} text="Reject" type="button" />
          </div>
        </div>
      )}
    </div>
  );
};
