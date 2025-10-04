import React, { useState } from 'react';
import styles from './CredentialList.module.css';
import { useNavigate, useParams } from 'react-router-dom';
import { ActionButton } from '../Buttons/ActionButton';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faTrash } from '@fortawesome/free-solid-svg-icons';
import { useSelector } from 'react-redux';
import { RootState } from '../../../store';
import { CredentialCard } from '../Cards/CredentialCard';
import { DeleteCredentialModal } from '../Modals/DeleteCredentialModal';

interface Credential {
  id: string;
  key: string;
  value: string;
}

export const CredentialList: React.FC = () => {
  const navigate = useNavigate();
  const { id: projectId } = useParams<{ id: string }>();
  const { data: currentProjectData, loading: currentProjectLoading } = useSelector((state: RootState) => state.currentProject);
  const credentials = currentProjectData?.credentials;

  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false); // State for modal visibility
  const [selectedCredential, setSelectedCredential] = useState<Credential | null>(null); // State for selected credential to delete

  const handleCreateCredential = () => {
    navigate(`/project/${projectId}/settings/credentials/create`);
  };

  const handleDeleteClick = (credential: Credential) => {
    setSelectedCredential(credential);
    setShowDeleteModal(true);
  };

  const handleCloseModal = () => {
    setShowDeleteModal(false);
    setSelectedCredential(null);
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>Manage Project Credentials</h2>
        <p>Add, view, or remove credentials for your project.</p>
      </div>
      {currentProjectLoading ? (
        // Skeleton loader similar to ExportList
        <ul>
          {Array.from({ length: 3 }).map((_, index) => (
            <li key={index} className={`${styles.credentialCardSkeleton} ${styles.skeleton}`}></li>
          ))}
        </ul>
      ) : !credentials?.length ? (
        <ActionButton icon={faPlus} text='Create new credential' onClick={handleCreateCredential} />
      ) : (
        <ul className={styles.credentialListGrid}>
          {credentials.map((credential, index) => (
            <li
              title={credential.key}
              key={index}
              className={styles.credentialItem}
            >
              <CredentialCard credential={credential} />
              <button
                className={styles.deleteButton}
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteClick(credential);
                }}
              >
                <FontAwesomeIcon icon={faTrash} />
              </button>
            </li>
          ))}
          <li className={styles.createCredential} onClick={handleCreateCredential}>
            <FontAwesomeIcon icon={faPlus} />
            <h4>
              Create a new Credential
            </h4>
          </li>
        </ul>
      )}

      {showDeleteModal && selectedCredential && (
        <DeleteCredentialModal
          projectId={projectId}
          credentialId={selectedCredential.id}
          currentCredential={selectedCredential}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
};

export default CredentialList;

