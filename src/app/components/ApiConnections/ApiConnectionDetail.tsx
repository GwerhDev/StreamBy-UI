import s from './ApiConnectionDetail.module.css';
import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCode, faPencil, faTrash, faFingerprint, faLink, faFileLines } from '@fortawesome/free-solid-svg-icons';
import { SectionHeader } from '../SectionHeader/SectionHeader';
import { RootState } from '../../../store';
import { ActionButton } from '../Buttons/ActionButton';
import { SecondaryButton } from '../Buttons/SecondaryButton';
import { DeleteApiConnectionModal } from '../Modals/DeleteApiConnectionModal';

export const ApiConnectionDetail = () => {
  const { id: projectId, apiConnectionId } = useParams<{ id: string; apiConnectionId: string }>();
  const navigate = useNavigate();
  const currentProject = useSelector((state: RootState) => state.currentProject.data);
  const connection = currentProject?.apiConnections?.find(c => c.id === apiConnectionId);

  const [showDeleteModal, setShowDeleteModal] = useState(false);

  if (!connection || !projectId) return null;

  return (
    <div className={s.container}>
      <SectionHeader icon={faCode} title={connection.name} subtitle={connection.description} badge={connection.method} />

      <div className={s.fields}>
        <div className={s.field}>
          <span className={s.fieldIcon}><FontAwesomeIcon icon={faLink} /></span>
          <div>
            <p className={s.fieldLabel}>Base URL</p>
            <p className={s.fieldValue}>{connection.baseUrl}</p>
          </div>
        </div>

        {connection.credentialId && (
          <div className={s.field}>
            <span className={s.fieldIcon}><FontAwesomeIcon icon={faFingerprint} /></span>
            <div>
              <p className={s.fieldLabel}>Credential</p>
              <p className={s.fieldValue}>
                {currentProject?.credentials?.find(c => c.id === connection.credentialId)?.key ?? connection.credentialId}
                {connection.prefix && <span className={s.prefixBadge}>{connection.prefix}</span>}
              </p>
            </div>
          </div>
        )}

        {connection.description && (
          <div className={s.field}>
            <span className={s.fieldIcon}><FontAwesomeIcon icon={faFileLines} /></span>
            <div>
              <p className={s.fieldLabel}>Description</p>
              <p className={s.fieldValue}>{connection.description}</p>
            </div>
          </div>
        )}
      </div>

      <div className={s.actions}>
        <ActionButton
          icon={faPencil}
          text="Edit"
          onClick={() => navigate(`/project/${projectId}/connections/api/${apiConnectionId}/edit`)}
        />
        <SecondaryButton
          icon={faTrash}
          text="Delete"
          onClick={() => setShowDeleteModal(true)}
        />
      </div>

      {showDeleteModal && (
        <DeleteApiConnectionModal
          projectId={projectId}
          connectionId={connection.id}
          connectionName={connection.name}
          onClose={() => setShowDeleteModal(false)}
        />
      )}
    </div>
  );
};
