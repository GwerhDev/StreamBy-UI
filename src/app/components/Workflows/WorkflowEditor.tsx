import s from './WorkflowEditor.module.css';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import { RootState, AppDispatch } from '../../../store';
import { addApiResponse } from '../../../store/apiResponsesSlice';
import { setCurrentWorkflow, setWorkflowLoading, setWorkflowError } from '../../../store/currentWorkflowSlice';
import { getWorkflow, updateWorkflow } from '../../../services/workflows';
import { Workflow, Export } from '../../../interfaces';
import { NodeViewer, NodeViewerHandle } from '../NodeViewer/NodeViewer';
import { faArrowLeft, faFloppyDisk, faSitemap } from '@fortawesome/free-solid-svg-icons';
import { ActionButton } from '../Buttons/ActionButton';
import { SectionHeader } from '../SectionHeader/SectionHeader';
import { Spinner } from '../Spinner';

function workflowToExport(workflow: Workflow, projectId: string): Export {
  return {
    id: workflow.id,
    name: workflow.name,
    description: workflow.description || '',
    status: 'completed',
    createdAt: workflow.createdAt || '',
    updatedAt: workflow.updatedAt || '',
    projectId,
    exportedBy: '',
    nodeSchema: workflow.nodeSchema ?? null,
    type: 'json',
    method: 'GET',
  };
}

interface WorkflowEditorInnerProps {
  workflow: Workflow;
  onSaved: (updated: Workflow) => void;
}

function WorkflowEditorInner({ workflow, onSaved }: WorkflowEditorInnerProps) {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { id: projectId } = useParams<{ id: string }>();
  const [saving, setSaving] = useState(false);
  const nodeViewerRef = useRef<NodeViewerHandle>(null);
  const exportAdapter = workflowToExport(workflow, projectId ?? '');

  const handleSave = async () => {
    if (!projectId) return;
    const schema = nodeViewerRef.current?.getSchema();
    if (!schema) return;
    setSaving(true);
    try {
      const updated: Workflow = await updateWorkflow(projectId, workflow.id, { nodeSchema: schema });
      dispatch(addApiResponse({ message: 'Workflow saved.', type: 'success' }));
      onSaved(updated);
    } catch (err: any) {
      dispatch(addApiResponse({ message: err.message || 'Failed to save workflow.', type: 'error' }));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={s.container}>
      <div className={s.pageHeader}>
        <div className={s.headerRow}>
          <SectionHeader
            icon={faArrowLeft}
            title={workflow.name}
            subtitle={workflow.description || undefined}
            onIconClick={() => navigate(`/project/${projectId}/workflows/${workflow.id}`)}
          />
          <div className={s.headerRight}>
            {saving && <span className={s.savingLabel}>Saving…</span>}
            <ActionButton icon={faFloppyDisk} text="Save" onClick={handleSave} disabled={saving} />
          </div>
        </div>
      </div>
      <div className={s.canvas}>
        <NodeViewer
          ref={nodeViewerRef}
          exportDetails={exportAdapter}
          editMode
          projectId={projectId}
        />
      </div>
    </div>
  );
}

export function WorkflowEditor() {
  const dispatch = useDispatch<AppDispatch>();
  const { id: projectId, workflowId } = useParams<{ id: string; workflowId: string }>();
  const { data: workflow, loading, error } = useSelector((state: RootState) => state.currentWorkflow);

  useEffect(() => {
    if (!projectId || !workflowId) return;
    dispatch(setWorkflowLoading());
    getWorkflow(projectId, workflowId)
      .then(data => dispatch(setCurrentWorkflow(data)))
      .catch(err => dispatch(setWorkflowError(err.message || 'Failed to load workflow.')));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, workflowId]);

  const handleSaved = useCallback((updated: Workflow) => {
    dispatch(setCurrentWorkflow(updated));
  }, [dispatch]);

  if (loading || !workflow) return <Spinner bg isLoading />;
  if (error) return <div style={{ padding: '2rem', color: 'var(--color-error)' }}>{error}</div>;

  return <WorkflowEditorInner workflow={workflow} onSaved={handleSaved} />;
}
