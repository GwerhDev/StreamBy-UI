import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../../store';
import { fetchCredential, deleteCredential } from '../../../services/projects';
import { setCurrentProject } from '../../../store/currentProjectSlice';
import { Spinner } from '../Spinner';
import { ActionButton } from '../Buttons/ActionButton';
import { SecondaryButton } from '../Buttons/SecondaryButton';
import { faPenToSquare, faTrash } from '@fortawesome/free-solid-svg-icons';
import { DeleteCredentialModal } from '../Modals/DeleteCredentialModal';
import s from './CredentialDetailsView.module.css';

interface Credential {
  id: string;
  key: string;
  value: string;
}

export const CredentialDetailsView: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { id: projectId, credentialId } = useParams<{ id: string; credentialId: string }>();
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [credentialDetails, setCredentialDetails] = useState<Credential | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
  const currentProject = useSelector((state: RootState) => state.currentProject);

  useEffect(() => {
    const getCredentialDetails = async () => {
      if (!projectId || !credentialId) {
        setError('Project ID or Credential ID is missing.');
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const data = await fetchCredential(projectId, credentialId);
        if (data) {
          setCredentialDetails(data);
        } else {
          setError('Credential not found.');
        }
      } catch (err: { message: string } | unknown) {
        setError((err as { message: string }).message || 'Failed to fetch credential details.');
      } finally {
        setLoading(false);
      }
    };

    getCredentialDetails();
  }, [projectId, credentialId]);

  const handleDeleteClick = () => {
    setShowDeleteModal(true);
  };

  const handleCloseModal = () => {
    setShowDeleteModal(false);
  };

  if (loading) {
    return (<div className={s.container}><Spinner bg={false} isLoading /></div>);
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  if (!credentialDetails) {
    return <div>Credential details not available.</div>;
  }

  return (
    <div className={s.container}>
      <div className={s.header}>
        <h2>Credential: {credentialDetails.key}</h2>
      </div>
      <div className={s.detailsGrid}>
        <p><strong>ID:</strong> {credentialDetails.id}</p>
        <p><strong>Key:</strong> {credentialDetails.key}</p>
        <p><strong>Value:</strong> {credentialDetails.value}</p>
      </div>
      <span className={s.actionButtons}>
        <ActionButton icon={faPenToSquare} text="Edit" onClick={() => navigate(`/project/${projectId}/settings/credentials/${credentialId}/edit`)} />
        <SecondaryButton icon={faTrash} text="Delete" onClick={handleDeleteClick} />
      </span>

      {showDeleteModal && (
        <DeleteCredentialModal
          projectId={projectId}
          credentialId={credentialId}
          currentProject={currentProject}
          currentCredential={credentialDetails}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
};
