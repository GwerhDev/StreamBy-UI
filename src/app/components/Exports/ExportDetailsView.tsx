import s from './ExportDetailsView.module.css';
import CopyButton from '../Buttons/CopyButton';

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { API_BASE } from '../../../config/api';
import { getExport } from '../../../services/exports';
import { Spinner } from '../Spinner';
import { ActionButton } from '../Buttons/ActionButton';
import { SecondaryButton } from '../Buttons/SecondaryButton';
import { DeleteExportModal } from '../Modals/DeleteExportModal';
import {
  faCode, faFileLines, faLink, faGlobe, faClock,
  faPenToSquare, faTrash, faSitemap,
} from '@fortawesome/free-solid-svg-icons';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../../store';
import { setCurrentExport, clearCurrentExport, setExportLoading, setExportError } from '../../../store/currentExportSlice';
import { NodeViewer } from '../NodeViewer/NodeViewer';
import { ResponsePreview } from './ResponsePreview';
import { Panel, Group as PanelGroup, Separator as PanelResizeHandle } from 'react-resizable-panels';
import { Tabs } from '../Tabs/Tabs';
import { CustomForm } from '../Forms/CustomForm';

type ViewMode = 'nodes' | 'response';

export const ExportDetailsView: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { id, exportId } = useParams<{ id: string; exportId: string }>();
  const [viewMode, setViewMode] = useState<ViewMode>('nodes');
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
  const currentProject = useSelector((state: RootState) => state.currentProject);
  const { data: exportDetails, loading, error } = useSelector((state: RootState) => state.currentExport);

  useEffect(() => {
    if (!id || !exportId) { dispatch(setExportError('Project ID or Export ID is missing.')); return; }

    if (exportDetails?.id === exportId) return;

    const fetch = async () => {
      dispatch(setExportLoading());
      try {
        const data = await getExport(id, exportId);
        if (data) dispatch(setCurrentExport(data));
        else dispatch(setExportError('Export not found.'));
      } catch (err: { message: string } | unknown) {
        dispatch(setExportError((err as { message: string }).message || 'Failed to fetch export details.'));
      }
    };
    fetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, exportId]);

  useEffect(() => {
    return () => { dispatch(clearCurrentExport()); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) return <div className={s.container}><Spinner bg={false} isLoading /></div>;
  if (error) return <div>Error: {error}</div>;
  if (!exportDetails) return <div>Export details not available.</div>;

  const endpointPath = `/streamby/${id}/get-export/${exportDetails.name}`;
  const fullEndpoint = `${API_BASE}${endpointPath}`;

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

        <PanelResizeHandle className={s.resizeHandle} />

        <Panel className={s.panelContainer} minSize="15%">
          <div className={s.viewerPanel}>
            <Tabs
              active={viewMode}
              onChange={id => setViewMode(id as ViewMode)}
              tabs={[
                { id: 'nodes', label: 'Nodes', icon: faSitemap },
                { id: 'response', label: 'Response', icon: faCode },
              ]}
            />
            <div className={s.viewerContent}>
              {viewMode === 'nodes' && <NodeViewer exportDetails={exportDetails} />}
              {viewMode === 'response' && (
                <ResponsePreview
                  projectId={id!}
                  exportName={exportDetails.name}
                  schema={exportDetails.nodeSchema}
                  savedApiResponse={exportDetails.apiResponse}
                />
              )}
            </div>
          </div>
        </Panel>

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
