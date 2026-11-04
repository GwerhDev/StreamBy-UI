import s from './WorkflowPreview.module.css';
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faDiagramProject, faBan, faSpinner } from '@fortawesome/free-solid-svg-icons';
import { Export, Workflow } from '../../../interfaces';
import { getProjectWorkflow } from '../../../services/workflow';
import { NodeViewer } from '../NodeViewer/NodeViewer';

interface WorkflowPreviewProps {
  projectId: string;
  readonly?: boolean;
}

// A miniature of the project's Workflow canvas: a link to /workflow over the whole card, and the
// canvas under it only a picture (inert: nothing in it is hovered, clicked, dragged nor focused,
// React Flow's nodes take pointer events even under a parent that turns them off). It fetches the
// workflow itself, since currentProject.data.workflow is only populated by visiting /workflow.
// In the public preview (readonly) it links nowhere, like ProjectStats/ProjectCharts, and a
// failed or unauthorized fetch degrades to a placeholder.
export const WorkflowPreview = ({ projectId, readonly }: WorkflowPreviewProps) => {
  const [workflow, setWorkflow] = useState<Workflow | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setFailed(false);
    getProjectWorkflow(projectId)
      .then(wf => { if (!cancelled) setWorkflow(wf); })
      .catch(() => { if (!cancelled) setFailed(true); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [projectId]);

  const nodeViewerAdapter = useMemo<Export>(() => ({
    id: workflow?.id ?? 'workflow',
    name: workflow?.name ?? 'Workflow',
    description: workflow?.description ?? '',
    status: 'completed',
    createdAt: workflow?.createdAt ?? '',
    updatedAt: workflow?.updatedAt ?? '',
    projectId,
    exportedBy: workflow?.createdBy ?? '',
    nodeSchema: workflow?.nodeSchema ?? null,
  }), [workflow, projectId]);

  const showPlaceholder = failed || (!loading && !workflow?.nodeSchema && readonly);

  return (
    <div className={`${s.container} ${readonly ? s.readonly : ''}`} data-testid="workflow-preview">
      {!readonly && <Link to={`/project/${projectId}/workflow`} className={s.link} aria-label="Open the workflow" />}
      <div className={s.header}>
        <FontAwesomeIcon icon={faDiagramProject} className={s.icon} />
        <span className={s.title}>Workflow</span>
      </div>
      <div className={s.canvas} inert data-testid="workflow-preview-canvas">
        {loading ? (
          <div className={s.placeholder}>
            <FontAwesomeIcon icon={faSpinner} className={s.placeholderIcon} spin />
          </div>
        ) : showPlaceholder ? (
          <div className={s.placeholder}>
            <FontAwesomeIcon icon={faBan} className={s.placeholderIcon} />
            <p>Workflow preview not available</p>
          </div>
        ) : (
          <NodeViewer context="workflow" exportDetails={nodeViewerAdapter} editMode={false} projectId={projectId} />
        )}
      </div>
    </div>
  );
};
