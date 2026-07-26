import s from './ConnectionDetail.module.css';
import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { faCode, faPencil, faTrash, faFingerprint, faLink, faFileLines, faArrowsRotate } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { RootState } from '../../../store';
import { ActionButton } from '../Buttons/ActionButton';
import { SecondaryButton } from '../Buttons/SecondaryButton';
import { DeleteConnectionModal } from '../Modals/DeleteConnectionModal';
import { getConnectionResponse } from '../../../services/connections';
import { CustomForm } from '../Forms/CustomForm';
import CopyButton from '../Buttons/CopyButton';
import JsonViewer from '../JsonViewer/JsonViewer';
import { Panel, Group as PanelGroup, Separator as PanelResizeHandle } from 'react-resizable-panels';

export const ConnectionDetail = () => {
  const { id: projectId, connectionId } = useParams<{ id: string; connectionId: string }>();
  const navigate = useNavigate();
  const currentProject = useSelector((state: RootState) => state.currentProject.data);
  const connection = currentProject?.connections?.find(c => c.id === connectionId);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [response, setResponse] = useState<unknown>(null);

  if (!connection || !projectId) return null;

  const handleFetch = async () => {
    setFetching(true);
    setFetchError(null);
    try {
      const data = await getConnectionResponse(projectId, connectionId!);
      setResponse(data);
    } catch (err: unknown) {
      setFetchError((err as { message: string }).message || 'Fetch failed.');
    } finally {
      setFetching(false);
    }
  };

  return (
    <div className={s.container}>
      <PanelGroup orientation="horizontal" className={s.splitGroup}>

        <Panel defaultSize="35%" minSize="20%" maxSize="60%">
          <div className={s.detailsPanel}>
            <CustomForm
              readOnly
              header={{ icon: faCode, title: connection.name, subtitle: connection.description, badge: connection.method }}
              fields={[
                {
                  icon: faLink,
                  label: '',
                  value: (
                    <>
                      <a className={s.fieldLink} href={connection.apiUrl} target="_blank" rel="noopener noreferrer">{connection.apiUrl}</a>
                      <CopyButton title="Copy URL" textToCopy={connection.apiUrl} />
                    </>
                  ),
                },
                {
                  icon: faFingerprint,
                  label: 'Credential',
                  value: connection.hasCredential ? 'Configured' : '—',
                  hidden: !connection.hasCredential,
                },
                {
                  icon: faFileLines,
                  label: 'Description',
                  value: connection.description,
                  hidden: !connection.description,
                },
              ]}
            />
          </div>
        </Panel>

        <PanelResizeHandle className={s.resizeHandle} />

        <Panel minSize="25%">
          <div className={s.viewerPanel}>
            <div className={s.viewerHeader}>
              <span className={s.viewerLabel}>Response</span>
              <button
                type="button"
                className={`${s.fetchBtn} ${fetching ? s.fetchBtnLoading : ''}`}
                onClick={handleFetch}
                disabled={fetching}
              >
                <FontAwesomeIcon icon={faArrowsRotate} spin={fetching} />
                {fetching ? 'Fetching…' : 'Fetch'}
              </button>
            </div>
            <div className={s.viewerContent}>
              {fetchError && <p className={s.fetchError}>{fetchError}</p>}
              {response != null
                ? <JsonViewer data={response as JSON} />
                : !fetchError && <p className={s.viewerHint}>Click Fetch to preview the API response.</p>
              }
            </div>
          </div>
        </Panel>

      </PanelGroup>

      <div className={s.footer}>
        <ActionButton icon={faPencil} text="Edit" onClick={() => navigate(`/project/${projectId}/connections/${connectionId}/edit`)} />
        <SecondaryButton icon={faTrash} text="Delete" onClick={() => setShowDeleteModal(true)} />
      </div>

      {showDeleteModal && (
        <DeleteConnectionModal
          projectId={projectId}
          connectionId={connection.id}
          connectionName={connection.name}
          onClose={() => setShowDeleteModal(false)}
        />
      )}
    </div>
  );
};
