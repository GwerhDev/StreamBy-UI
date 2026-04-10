import s from './ExportDetailsView.module.css';
import JsonViewer from '../JsonViewer/JsonViewer';
import CopyButton from '../Buttons/CopyButton';
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { API_BASE } from '../../../config/api';
import { getExport } from '../../../services/exports';
import { Export } from '../../../interfaces';
import { Spinner } from '../Spinner';
import { ActionButton } from '../Buttons/ActionButton';
import { faExternalLink, faEye, faPenToSquare, faTrash } from '@fortawesome/free-solid-svg-icons';
import { useNavigate } from 'react-router-dom';
import { SecondaryButton } from '../Buttons/SecondaryButton';
import { DeleteExportModal } from '../Modals/DeleteExportModal';
import { ReadOnlyFields } from './ReadOnlyFields';
import { faFileLines, faCode } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useSelector } from 'react-redux';
import { RootState } from '../../../store';
import { NodeViewer } from '../NodeViewer/NodeViewer';

export const ExportDetailsView: React.FC = () => {
  const navigate = useNavigate();
  const { id, exportId } = useParams<{ id: string; exportId: string }>();
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'preview' | 'apiResponse' | 'fields' | 'json'>('preview');
  const [exportDetails, setExportDetails] = useState<Export | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
  const currentProject = useSelector((state: RootState) => state.currentProject);

  useEffect(() => {
    const fetchExportDetails = async () => {
      if (!id || !exportId) {
        setError('Project ID or Export ID is missing.');
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const data = await getExport(id, exportId);
        if (data) {
          setExportDetails(data);
        } else {
          setError('Export not found.');
        }
      } catch (err: { message: string } | unknown) {
        setError((err as { message: string }).message || 'Failed to fetch export details.');
      } finally {
        setLoading(false);
      }
    };

    fetchExportDetails();
  }, [id, exportId]);

  const handleDeleteClick = () => {
    setShowDeleteModal(true);
  };

  const handleCloseModal = () => {
    setShowDeleteModal(false);
  };

  const handleTypeRender = (type: string) => {
    switch (type) {
      case 'json':
        return 'JSON';
      case 'externalApi':
        return 'External API';
      default:
        return type;
    }
  };

  if (loading) {
    return (<div className={s.container}><Spinner bg={false} isLoading /></div>);
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  if (!exportDetails) {
    return <div>Export details not available.</div>;
  }

  const fullEndpoint = `${API_BASE}/streamby/${id}/get-export/${exportDetails.name}`;

  return (
    <div className={s.container}>
      <div className={s.header}>
        <h2>Export {exportDetails.method} /{exportDetails.name}</h2>
        <span className={s.buttonContainer}>
          <CopyButton title={"Copy endpoint"} textToCopy={`/streamby/${id}/get-export/${exportDetails.name}`} />
        </span>
      </div>
      <div className={s.detailsGrid}>
        <p><strong>Full endpoint:</strong><a target='_blank' href={fullEndpoint}> {`/streamby/${id}/get-export/${exportDetails.name}`}</a></p>
        <p><strong>Name:</strong> {exportDetails.name}</p>
        {exportDetails.description && <p><strong>Description:</strong> {exportDetails.description}</p>}
        {exportDetails.type !== "externalApi" && <p><strong>Collection Name:</strong> {exportDetails.collectionName}</p>}
        <p><strong>Export Type:</strong> {handleTypeRender(exportDetails.type)}</p>
        {exportDetails.type !== "externalApi" && <p><strong>Created At:</strong> {new Date(exportDetails.createdAt).toLocaleString()}</p>}
        {exportDetails.type !== "externalApi" && <p><strong>Updated At:</strong> {new Date(exportDetails.updatedAt).toLocaleString()}</p>}
        {exportDetails.allowedOrigin && exportDetails.allowedOrigin.length > 0 && (
          <p><strong>Allowed Origins:</strong> {
            exportDetails.allowedOrigin.some(origin => /^\*$/.test(origin))
              ? (currentProject?.data?.allowedOrigin?.join(', ') || '*')
              : exportDetails.allowedOrigin.join(', ')
          }</p>
        )}
      </div>
      <span className={s.actionButtons}>
        <ActionButton icon={faPenToSquare} text="Edit" onClick={() => navigate(`/project/${id}/dashboard/exports/${exportId}/edit`)} />
        <SecondaryButton icon={faTrash} text="Delete" onClick={handleDeleteClick} />
      </span>

      {exportDetails.json && (
        <div className={s.jsonViewer}>
          <div className={s.viewModeToggle}>
            <button
              type="button"
              className={`${s.toggleButton} ${viewMode === 'preview' ? s.active : ''}`}
              onClick={() => setViewMode('preview')}
              title="Preview"
            >
              <FontAwesomeIcon icon={faEye} />
              Flow
            </button>
            {exportDetails.type === 'externalApi' && (
              <button
                type="button"
                className={`${s.toggleButton} ${viewMode === 'apiResponse' ? s.active : ''}`}
                onClick={() => setViewMode('apiResponse')}
                title="Api Response View"
              >
                <FontAwesomeIcon icon={faExternalLink} />
                Api Response
              </button>
            )}
            <button
              type="button"
              className={`${s.toggleButton} ${viewMode === 'fields' ? s.active : ''}`}
              onClick={() => setViewMode('fields')}
              title="Fields View"
            >
              <FontAwesomeIcon icon={faFileLines} />
              Fields
            </button>
            <button
              type="button"
              className={`${s.toggleButton} ${viewMode === 'json' ? s.active : ''}`}
              onClick={() => setViewMode('json')}
              title="Raw JSON"
            >
              <FontAwesomeIcon icon={faCode} />
              Raw JSON
            </button>
          </div>
          {viewMode === 'preview' && (
            <NodeViewer exportDetails={exportDetails} />
          )}
          {viewMode === 'apiResponse' && (
            <JsonViewer data={exportDetails.apiResponse as JSON} />
          )}
          {viewMode === 'fields' && (
            <ReadOnlyFields data={exportDetails.json} />
          )}
          {viewMode === 'json' && (
            <JsonViewer data={exportDetails.json} />
          )}
        </div>
      )}

      {showDeleteModal && (
        <DeleteExportModal
          exportId={exportId}
          currentProject={currentProject}
          currentExport={exportDetails}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
};
