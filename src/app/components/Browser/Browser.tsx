import s from './Browser.module.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useLocation, useParams, useNavigate } from 'react-router-dom';
import { faArrowLeft, faBan, faCheck, faChevronRight, faEnvelope, faSpinner } from '@fortawesome/free-solid-svg-icons';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../../../store';
import { addApiResponse } from '../../../store/apiResponsesSlice';
import { SecondaryButton } from '../Buttons/SecondaryButton';
import { ActionButton } from '../Buttons/ActionButton';
import { ModeToggle } from '../ModeToggle/ModeToggle';
import { acceptInvitation, rejectInvitation } from '../../../services/members';
import { setMembership } from '../../../store/currentProjectSlice';
import { reloadProjects } from '../../../store/projectsSlice';
import { Icon } from '@fortawesome/fontawesome-svg-core';

type BrowserProps = {
  children: React.ReactNode;
  preview?: boolean;
  env?: string;
};

export const Browser = (props: BrowserProps) => {
  const { children, preview, env } = props;
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { id } = useParams();
  const { projectId } = useParams<{ projectId: string }>();
  const { data: currentProject, membership } = useSelector((state: RootState) => state.currentProject);
  const currentExport = useSelector((state: RootState) => state.currentExport.data);
  const currentWorkflow = useSelector((state: RootState) => state.currentWorkflow.data);
  const currentPipeline = useSelector((state: RootState) => state.currentPipeline.data);
  const currentStorageFolder = useSelector((state: RootState) => state.currentStorageFolder.data);
  const documents = useSelector((state: RootState) => state.documents.list);
  const crumbNames = useSelector((state: RootState) => state.crumbNames?.names);
  // Whether something that names a route's ids is still on its way (then an id waits for it).
  const naming = useSelector((state: RootState) =>
    !!(state.currentProject?.loading || state.currentExport?.loading || state.currentWorkflow?.loading
      || state.currentPipeline?.loading || state.documents?.loading));


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
    try {
      await acceptInvitation(currentProject.id, session.userId);
      dispatch(addApiResponse({ message: 'Invitation accepted.', type: 'success' }));
      // A member now: no longer pending here, and the project joins their list.
      dispatch(setMembership({ isMember: true, status: 'active' }));
      dispatch(reloadProjects());
    } catch (error: any) {
      dispatch(addApiResponse({ message: error.message || 'Failed to accept invitation.', type: 'error' }));
    }
  };

  const handleReject = async () => {
    if (!currentProject?.id || !session.userId) return;
    try {
      await rejectInvitation(currentProject.id, session.userId);
      dispatch(addApiResponse({ message: 'Invitation rejected.', type: 'success' }));
      navigate('/');
    } catch (error: any) {
      dispatch(addApiResponse({ message: error.message || 'Failed to reject invitation.', type: 'error' }));
    }
  };

  const path = decodeURIComponent(location.pathname);
  const basePath = `/project/${id}`;
  const relativePath = path.replace(basePath, '');

  const segments = relativePath.split('/').filter(Boolean);

  const isMongoId = (seg: string) => /^[a-f0-9]{24}$/.test(seg);

  const isUUID = (seg: string) =>
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(seg);

  const documentTitle = (seg: string) => documents?.find(d => d.id === seg)?.title;

  // A segment's name, if something loaded names it.
  const nameOf = (seg: string): string | undefined => {
    if (currentExport && seg === currentExport.id) return currentExport.name;
    if (currentWorkflow && seg === currentWorkflow.id) return currentWorkflow.name;
    if (currentPipeline && seg === currentPipeline.id) return currentPipeline.name;
    const storageConn = currentProject?.storageConnections?.find(c => c.id === seg);
    if (storageConn) return storageConn.name.toLowerCase();
    const dbConn = currentProject?.dbConnections?.find(c => c.id === seg);
    if (dbConn) return dbConn.name.toLowerCase();
    if (currentStorageFolder && seg === currentStorageFolder.id) return currentStorageFolder.name;
    return documentTitle(seg) ?? crumbNames?.[seg];
  };

  // An id is its name once something names it; while something that could is loading, it
  // waits (a spinner); else it's a short id, never a spinner forever.
  const crumbOf = (seg: string) => {
    const name = nameOf(seg);
    if (name) return name;
    if (isMongoId(seg) || isUUID(seg)) return naming ? <FontAwesomeIcon icon={faSpinner} spin /> : seg.slice(0, 8);
    return seg.replace(/[_-]/g, ' ');
  };

  const handleNavigate = (index: number) => {
    const partial = segments.slice(0, index + 1).join('/');
    navigate(`${basePath}/${partial}`);
  };

  return (
    <div className={s.container}>
      {
        !preview ?
          <section className={s.location}>
            {
              env !== 'notification' &&
              <>
                {
                  segments.map((seg, i) => (
                    <span key={i} className={s.separator}>
                      <FontAwesomeIcon icon={faChevronRight} />
                      <span className={s.breadcrumb} onClick={() => handleNavigate(i)}>
                        {crumbOf(seg)}
                      </span>
                    </span>
                  ))
                }

              </>
            }
            {/* The workspace's mode, at the end of where the user is. */}
            <span className={s.locationActions}>
              <ModeToggle />
            </span>
          </section>
          :
          <span className={s.buttonsContainer}>
            <button className={s.backButton} onClick={handleBack}>
              <FontAwesomeIcon icon={faArrowLeft} />
            </button>
            {isPending && (
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
                  <SecondaryButton onClick={handleReject} icon={faBan as Icon} text="Reject" type="button" />
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
