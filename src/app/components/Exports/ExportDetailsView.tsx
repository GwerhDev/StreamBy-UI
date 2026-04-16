import s from './ExportDetailsView.module.css';
import JsonViewer from '../JsonViewer/JsonViewer';
import CopyButton from '../Buttons/CopyButton';
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { API_BASE } from '../../../config/api';
import { getExport } from '../../../services/exports';
import { Export } from '../../../interfaces';
import { Spinner } from '../Spinner';
import { ActionButton } from '../Buttons/ActionButton';
import { SecondaryButton } from '../Buttons/SecondaryButton';
import { DeleteExportModal } from '../Modals/DeleteExportModal';
import { ReadOnlyFields } from './ReadOnlyFields';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCode, faFileLines, faLink, faDatabase, faGlobe, faClock,
  faLayerGroup, faExternalLink, faPenToSquare, faTrash, faSitemap,
} from '@fortawesome/free-solid-svg-icons';
import { useSelector } from 'react-redux';
import { RootState } from '../../../store';
import { NodeViewer } from '../NodeViewer/NodeViewer';
import { Panel, Group as PanelGroup, Separator as PanelResizeHandle } from 'react-resizable-panels';
import { Tabs, TabItem } from '../Tabs/Tabs';

type ViewMode = 'preview' | 'apiResponse' | 'fields' | 'json';

export const ExportDetailsView: React.FC = () => {
  const navigate = useNavigate();
  const { id, exportId } = useParams<{ id: string; exportId: string }>();
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('preview');
  const [exportDetails, setExportDetails] = useState<Export | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
  const currentProject = useSelector((state: RootState) => state.currentProject);

  useEffect(() => {
    const fetchExportDetails = async () => {
      if (!id || !exportId) { setError('Project ID or Export ID is missing.'); setLoading(false); return; }
      try {
        setLoading(true);
        const data = await getExport(id, exportId);
        if (data) setExportDetails(data);
        else setError('Export not found.');
      } catch (err: { message: string } | unknown) {
        setError((err as { message: string }).message || 'Failed to fetch export details.');
      } finally {
        setLoading(false);
      }
    };
    fetchExportDetails();
  }, [id, exportId]);

  const handleTypeRender = (type: string) => {
    switch (type) {
      case 'json': return 'JSON';
      case 'externalApi': return 'External API';
      default: return type;
    }
  };

  if (loading) return <div className={s.container}><Spinner bg={false} isLoading /></div>;
  if (error) return <div>Error: {error}</div>;
  if (!exportDetails) return <div>Export details not available.</div>;

  const endpointPath = `/streamby/${id}/get-export/${exportDetails.name}`;
  const fullEndpoint = `${API_BASE}${endpointPath}`;
  const hasJson = !!exportDetails.json;

  return (
    <div className={s.container}>

      {/* Resizable body */}
      <PanelGroup orientation="horizontal" className={s.splitGroup}>

        {/* Details panel */}
        <Panel defaultSize="35%" minSize="20%" maxSize="60%">
          <div className={s.detailsPanel}>
            <div className={s.header}>
              <span className={s.iconWrap}><FontAwesomeIcon icon={faCode} /></span>
              <div>
                <h2 className={s.title}>{exportDetails.name}</h2>
                {exportDetails.description && <p className={s.description}>{exportDetails.description}</p>}
              </div>
              <span className={s.methodBadge}>{exportDetails.method}</span>
            </div>

            <div className={s.fields}>
              <div className={s.field}>
                <span className={s.fieldIcon}><FontAwesomeIcon icon={faLink} /></span>
                <div>
                  <p className={s.fieldLabel}>Endpoint</p>
                  <p className={s.fieldValue}>
                    <a className={s.fieldLink} href={fullEndpoint} target="_blank" rel="noopener noreferrer">{endpointPath}</a>
                    <CopyButton title="Copy endpoint" textToCopy={endpointPath} />
                  </p>
                </div>
              </div>

              <div className={s.field}>
                <span className={s.fieldIcon}><FontAwesomeIcon icon={faLayerGroup} /></span>
                <div>
                  <p className={s.fieldLabel}>Type</p>
                  <p className={s.fieldValue}>{handleTypeRender(exportDetails.type)}</p>
                </div>
              </div>

              {exportDetails.type !== 'externalApi' && exportDetails.collectionName && (
                <div className={s.field}>
                  <span className={s.fieldIcon}><FontAwesomeIcon icon={faDatabase} /></span>
                  <div>
                    <p className={s.fieldLabel}>Collection</p>
                    <p className={s.fieldValue}>{exportDetails.collectionName}</p>
                  </div>
                </div>
              )}

              {exportDetails.description && (
                <div className={s.field}>
                  <span className={s.fieldIcon}><FontAwesomeIcon icon={faFileLines} /></span>
                  <div>
                    <p className={s.fieldLabel}>Description</p>
                    <p className={s.fieldValue}>{exportDetails.description}</p>
                  </div>
                </div>
              )}

              {exportDetails.allowedOrigin && exportDetails.allowedOrigin.length > 0 && (
                <div className={s.field}>
                  <span className={s.fieldIcon}><FontAwesomeIcon icon={faGlobe} /></span>
                  <div>
                    <p className={s.fieldLabel}>Allowed Origins</p>
                    <p className={s.fieldValue}>
                      {exportDetails.allowedOrigin.some(o => /^\*$/.test(o))
                        ? (currentProject?.data?.allowedOrigin?.join(', ') || '*')
                        : exportDetails.allowedOrigin.join(', ')}
                    </p>
                  </div>
                </div>
              )}

              {exportDetails.type !== 'externalApi' && (
                <div className={s.field}>
                  <span className={s.fieldIcon}><FontAwesomeIcon icon={faClock} /></span>
                  <div>
                    <p className={s.fieldLabel}>Created</p>
                    <p className={s.fieldValue}>{new Date(exportDetails.createdAt).toLocaleString()}</p>
                  </div>
                </div>
              )}
            </div>

            <div className={s.actions}>
              <ActionButton icon={faPenToSquare} text="Edit" onClick={() => navigate(`/project/${id}/dashboard/exports/${exportId}/edit`)} />
              <SecondaryButton icon={faTrash} text="Delete" onClick={() => setShowDeleteModal(true)} />
            </div>
          </div>
        </Panel>

        {/* Drag handle */}
        {hasJson && (
          <PanelResizeHandle className={s.resizeHandle} />
        )}

        {/* Viewer panel */}
        {hasJson && (
          <Panel minSize="15%">
            <div className={s.viewerPanel}>
              <Tabs
                active={viewMode}
                onChange={id => setViewMode(id as ViewMode)}
                tabs={[
                  { id: 'preview', label: 'Flow', icon: faSitemap },
                  ...(exportDetails.type === 'externalApi'
                    ? [{ id: 'apiResponse', label: 'Api Response', icon: faExternalLink } as TabItem]
                    : []),
                  { id: 'fields', label: 'Fields', icon: faFileLines },
                  { id: 'json', label: 'Raw JSON', icon: faCode },
                ]}
              />
              <div className={s.viewerContent}>
                {viewMode === 'preview' && <NodeViewer exportDetails={exportDetails} />}
                {viewMode === 'apiResponse' && exportDetails.apiResponse && <JsonViewer data={exportDetails.apiResponse as JSON} />}
                {viewMode === 'fields' && exportDetails.json && <ReadOnlyFields data={exportDetails.json} />}
                {viewMode === 'json' && exportDetails.json && <JsonViewer data={exportDetails.json} />}
              </div>
            </div>
          </Panel>
        )}

      </PanelGroup>

      {showDeleteModal && (
        <DeleteExportModal
          exportId={exportId}
          currentProject={currentProject}
          currentExport={exportDetails}
          onClose={() => setShowDeleteModal(false)}
        />
      )}
    </div>
  );
};
