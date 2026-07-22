import s from './WorkflowPreview.module.css';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faDiagramProject, faBan, faSpinner } from '@fortawesome/free-solid-svg-icons';
import { Export, Workflow } from '../../../interfaces';
import { getProjectWorkflow } from '../../../services/workflow';
import { NodeViewer } from '../NodeViewer/NodeViewer';

interface WorkflowPreviewProps {
  projectId: string;
  readonly?: boolean;
}

// Read-only miniature of the project's Workflow canvas — the whole card navigates to
// /workflow on click, giving a real preview of the current production canvas instead of
// a plain link (TCORE-67). Fetches the workflow itself (mirrors WorkflowPage) since
// currentProject.data.workflow is only ever populated by visiting /workflow directly.
// In the public preview (readonly), the click is disabled — same pattern as
// ProjectStats/ProjectCharts — and a failed/unauthorized fetch degrades to a placeholder.
export const WorkflowPreview = ({ projectId, readonly }: WorkflowPreviewProps) => {
  const navigate = useNavigate();
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

  const handleClick = () => {
    if (readonly) return;
    navigate(`/project/${projectId}/workflow`);
  };

  const showPlaceholder = failed || (!loading && !workflow?.nodeSchema && readonly);

  return (
    <div className={`${s.container} ${readonly ? s.readonly : ''}`} onClick={handleClick}>
      <div className={s.header}>
        <FontAwesomeIcon icon={faDiagramProject} className={s.icon} />
        <span className={s.title}>Workflow</span>
      </div>
      <div className={s.canvas}>
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
