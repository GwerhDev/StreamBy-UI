import s from './Browser.module.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useLocation, useParams, useNavigate } from 'react-router-dom';
import { faArrowLeft, faBan, faCheck, faChevronRight, faEnvelope, faFolder, faSpinner } from '@fortawesome/free-solid-svg-icons';
import { useSelector } from 'react-redux';
import { RootState } from '../../../store';
import { SecondaryButton } from '../Buttons/SecondaryButton';
import { ActionButton } from '../Buttons/ActionButton';
import { acceptInvitation, rejectInvitation } from '../../../services/members';
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
  const { id } = useParams();
  const { projectId } = useParams<{ projectId: string }>();
  const { data: currentProject, membership } = useSelector((state: RootState) => state.currentProject);
  const currentExport = useSelector((state: RootState) => state.currentExport.data);
  const storages = useSelector((state: RootState) => state.management.storages);
  const currentStorageFolder = useSelector((state: RootState) => state.currentStorageFolder.data);


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

  const isMongoId = (seg: string) => /^[a-f0-9]{24}$/.test(seg);

  const resolveBuiltinStorageName = (seg: string): string | null => {
    const match = seg === 'builtin' ? 0 : /^builtin-(\d+)$/.exec(seg)?.[1];
    if (match === undefined || match === null) return null;
    return storages[Number(match)]?.name ?? null;
  };

  const isUUID = (seg: string) =>
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(seg);

  const formatSegment = (seg: string) => {
    if (currentExport && seg === currentExport.id) return currentExport.name;
    const storageName = resolveBuiltinStorageName(seg);
    if (storageName) return storageName.toLowerCase();
    const storageConn = currentProject?.storageConnections?.find(c => c.id === seg);
    if (storageConn) return storageConn.name.toLowerCase();
    if (currentStorageFolder && seg === currentStorageFolder.id) return currentStorageFolder.name;
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
                <span className={s.breadcrumb} onClick={() => navigate(basePath)}>
                  <FontAwesomeIcon icon={faFolder} />
                </span>
                {
                  segments.map((seg, i) => (
                    <span key={i} className={s.separator}>
                      <FontAwesomeIcon icon={faChevronRight} />
                      <span className={s.breadcrumb} onClick={() => handleNavigate(i)}>
                        {(isMongoId(seg) && seg !== currentExport?.id) ||
                         (isUUID(seg) && (!currentStorageFolder || currentStorageFolder.id !== seg))
                          ? <FontAwesomeIcon icon={faSpinner} spin />
                          : formatSegment(seg)}
                      </span>
                    </span>
                  ))
                }
              </>
            }
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
