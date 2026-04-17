import s from './ApiConnectionDetail.module.css';
import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCode, faPencil, faTrash, faFingerprint, faLink, faFileLines, faArrowsRotate } from '@fortawesome/free-solid-svg-icons';
import { SectionHeader } from '../SectionHeader/SectionHeader';
import { RootState } from '../../../store';
import { ActionButton } from '../Buttons/ActionButton';
import { SecondaryButton } from '../Buttons/SecondaryButton';
import { DeleteApiConnectionModal } from '../Modals/DeleteApiConnectionModal';
import { getConnectionResponse } from '../../../services/connections';
import JsonViewer from '../JsonViewer/JsonViewer';
import { Panel, Group as PanelGroup, Separator as PanelResizeHandle } from 'react-resizable-panels';

export const ApiConnectionDetail = () => {
  const { id: projectId, apiConnectionId } = useParams<{ id: string; apiConnectionId: string }>();
  const navigate = useNavigate();
  const currentProject = useSelector((state: RootState) => state.currentProject.data);
  const connection = currentProject?.apiConnections?.find(c => c.id === apiConnectionId);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [response, setResponse] = useState<unknown>(null);

  if (!connection || !projectId) return null;

  const handleFetch = async () => {
    setFetching(true);
    setFetchError(null);
    try {
      const data = await getConnectionResponse(projectId, apiConnectionId!);
      setResponse(data);
    } catch (err: unknown) {
      setFetchError((err as { message: string }).message || 'Fetch failed.');
    } finally {
      setFetching(false);
    }
  };

  return (
    <div className={s.splitContainer}>
      <PanelGroup orientation="horizontal" className={s.splitGroup}>

        <Panel defaultSize="40%" minSize="25%" maxSize="70%">
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
          </div>
        </Panel>

        <PanelResizeHandle className={s.resizeHandle} />

        <Panel minSize="25%">
          <div className={s.responsePanel}>
            <div className={s.responsePanelHeader}>
              <p className={s.responseLabel}>Response</p>
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

            {fetchError && <p className={s.fetchError}>{fetchError}</p>}

            {response != null
              ? <div className={s.responseViewer}><JsonViewer data={response as JSON} /></div>
              : !fetchError && <p className={s.responseHint}>Click Fetch to preview the API response.</p>
            }
          </div>
        </Panel>

      </PanelGroup>

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
