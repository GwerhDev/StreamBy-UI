import React from 'react';
import styles from './CredentialList.module.css';
import { useNavigate, useParams } from 'react-router-dom';
import { ActionButton } from '../Buttons/ActionButton';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus } from '@fortawesome/free-solid-svg-icons';
import { useSelector } from 'react-redux';
import { RootState } from '../../../store';

interface Credential {
  id: string;
  key: string;
  value: string;
}

interface CredentialListProps {
  // No longer needs to receive credentials as a prop, it will get them from Redux
}

export const CredentialList: React.FC<CredentialListProps> = () => {
  const navigate = useNavigate();
  const { id: projectId } = useParams<{ id: string }>();
  const { data: currentProjectData, loading: currentProjectLoading } = useSelector((state: RootState) => state.currentProject);
  const credentials = currentProjectData?.credentials;

  const handleCreateCredential = () => {
    navigate(`/project/${projectId}/settings/credentials/create`);
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
          {credentials.map((credential) => (
            <li key={credential.id} className={styles.credentialItem}>
              <div>
                <strong>Key:</strong> {credential.key}
              </div>
              <div>
                <strong>Value:</strong> {credential.value}
              </div>
              {/* Add actions like edit/delete later */}
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
    </div>
  );
};

