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
import {
  faCode, faFileLines, faLink, faDatabase, faGlobe, faClock,
  faLayerGroup, faExternalLink, faPenToSquare, faTrash, faSitemap,
} from '@fortawesome/free-solid-svg-icons';
import { useSelector } from 'react-redux';
import { RootState } from '../../../store';
import { NodeViewer } from '../NodeViewer/NodeViewer';
import { Panel, Group as PanelGroup, Separator as PanelResizeHandle } from 'react-resizable-panels';
import { Tabs, TabItem } from '../Tabs/Tabs';
import { CustomForm } from '../Forms/CustomForm';

type ViewMode = 'nodes' | 'apiResponse' | 'fields' | 'json';

export const ExportDetailsView: React.FC = () => {
  const navigate = useNavigate();
  const { id, exportId } = useParams<{ id: string; exportId: string }>();
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('nodes');
  const [exportDetails, setExportDetails] = useState<Export | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
  const currentProject = useSelector((state: RootState) => state.currentProject);

  useEffect(() => {
    const cached = currentProject.data?.exports?.find(e => e.id === exportId);
    if (cached?.json !== undefined) { setExportDetails(cached); setLoading(false); return; }

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

      <PanelGroup orientation="horizontal" className={s.splitGroup}>

        {/* Details panel */}
        <Panel defaultSize="35%" minSize="20%" maxSize="60%">
          <div className={s.detailsPanel}>
            <CustomForm
              readOnly
              header={{
                icon: faCode,
                title: exportDetails.name,
                subtitle: exportDetails.description,
                badge: exportDetails.method,
              }}
              fields={[
                {
                  icon: faLink,
                  label: 'Endpoint',
                  value: (
                    <>
                      <a className={s.fieldLink} href={fullEndpoint} target="_blank" rel="noopener noreferrer">{endpointPath}</a>
                      <CopyButton title="Copy endpoint" textToCopy={endpointPath} />
                    </>
                  ),
                },
                {
                  icon: faLayerGroup,
                  label: 'Type',
                  value: handleTypeRender(exportDetails.type),
                },
                {
                  icon: faDatabase,
                  label: 'Collection',
                  value: exportDetails.collectionName,
                  hidden: exportDetails.type === 'externalApi' || !exportDetails.collectionName,
                },
                {
                  icon: faFileLines,
                  label: 'Description',
                  value: exportDetails.description,
                  hidden: !exportDetails.description,
                },
                {
                  icon: faGlobe,
                  label: 'Allowed Origins',
                  value: exportDetails.allowedOrigin?.some(o => /^\*$/.test(o))
                    ? (currentProject?.data?.allowedOrigin?.join(', ') || '*')
                    : exportDetails.allowedOrigin?.join(', '),
                  hidden: !exportDetails.allowedOrigin?.length,
                },
                {
                  icon: faClock,
                  label: 'Created',
                  value: new Date(exportDetails.createdAt).toLocaleString(),
                  hidden: exportDetails.type === 'externalApi',
                },
              ]}
              actions={
                <>
                  <ActionButton icon={faPenToSquare} text="Edit" onClick={() => navigate(`/project/${id}/dashboard/exports/${exportId}/edit`)} />
                  <SecondaryButton icon={faTrash} text="Delete" onClick={() => setShowDeleteModal(true)} />
                </>
              }
            />
          </div>
        </Panel>

        {hasJson && <PanelResizeHandle className={s.resizeHandle} />}

        {hasJson && (
          <Panel className={s.panelContainer} minSize="15%">
            <div className={s.viewerPanel}>
              <Tabs
                active={viewMode}
                onChange={id => setViewMode(id as ViewMode)}
                tabs={[
                  { id: 'nodes', label: 'Nodes', icon: faSitemap },
                  ...(exportDetails.type === 'externalApi'
                    ? [{ id: 'apiResponse', label: 'Api Response', icon: faExternalLink } as TabItem]
                    : []),
                  { id: 'fields', label: 'Form', icon: faFileLines },
                  { id: 'json', label: 'JSON', icon: faCode },
                ]}
              />
              <div className={s.viewerContent}>
                {viewMode === 'nodes' && <NodeViewer exportDetails={exportDetails} />}
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
