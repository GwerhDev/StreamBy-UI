import s from './PipelineCanvas.module.css';
import { useMemo, useRef, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useParams } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye, faFloppyDisk, faPencil } from '@fortawesome/free-solid-svg-icons';
import { Node, Edge } from 'reactflow';
import { AppDispatch } from '../../../store';
import { addApiResponse } from '../../../store/apiResponsesSlice';
import { updatePipeline } from '../../../services/pipelines';
import { Export, Pipeline } from '../../../interfaces';
import { NodeViewer, NodeViewerHandle } from '../NodeViewer/NodeViewer';
import { TemplatePicker } from './TemplatePicker';

interface Props {
  pipeline: Pipeline;
  onChange?: (pipeline: Pipeline) => void;
}

// A Pipeline is a scoped sub-workflow. Same canvas as the Workflow editor but bound to a
// Pipeline entity (context="pipeline") instead of the project-level workflow.
export function PipelineCanvas({ pipeline, onChange }: Props) {
  const { id: projectId } = useParams<{ id: string }>();
  const dispatch = useDispatch<AppDispatch>();

  const [localSchema, setLocalSchema] = useState<{ nodes: Node[]; edges: Edge[] } | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const nodeViewerRef = useRef<NodeViewerHandle>(null);

  const displaySchema = useMemo<{ nodes: Node[]; edges: Edge[] } | null>(() => {
    if (localSchema !== null) return localSchema;
    if (pipeline.nodeSchema) return pipeline.nodeSchema as { nodes: Node[]; edges: Edge[] };
    return null;
  }, [localSchema, pipeline.nodeSchema]);

  const nodeViewerKey = useMemo(() => {
    if (pipeline.nodeSchema) return `saved-${pipeline.id}`;
    if (localSchema) return 'template';
    return 'empty';
  }, [pipeline.nodeSchema, pipeline.id, localSchema]);

  const exportAdapter = useMemo<Export>(() => ({
    id: pipeline.id,
    name: pipeline.name,
    description: pipeline.description ?? '',
    status: 'completed',
    createdAt: '',
    updatedAt: '',
    projectId: projectId ?? '',
    exportedBy: '',
    nodeSchema: displaySchema,
  }), [pipeline, projectId, displaySchema]);

  const handleTemplateSelect = (schema: { nodes: Node[]; edges: Edge[] }) => {
    setLocalSchema(schema);
    setEditMode(true);
  };

  const handleSave = async () => {
    if (!projectId) return;
    setSaving(true);
    const nodeSchema = nodeViewerRef.current?.getSchema() ?? null;
    try {
      const updated = await updatePipeline(projectId, pipeline.id, { nodeSchema });
      onChange?.(updated);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to save.';
      dispatch(addApiResponse({ message, type: 'error' }));
    } finally {
      setSaving(false);
    }
  };

  if (displaySchema === null) {
    return (
      <div className={s.container}>
        <TemplatePicker onSelect={handleTemplateSelect} />
      </div>
    );
  }

  const saveButton = editMode ? (
    <button
      className={s.saveBtn}
      onClick={handleSave}
      disabled={saving}
      title={saving ? 'Saving…' : 'Save'}
    >
      <FontAwesomeIcon icon={faFloppyDisk} />
    </button>
  ) : null;

  return (
    <div className={s.container}>
      <NodeViewer
        key={nodeViewerKey}
        ref={nodeViewerRef}
        context="pipeline"
        exportDetails={exportAdapter}
        editMode={editMode}
        projectId={projectId}
        canvasOverlay={saveButton}
      />

      {/* Mode toggle — top center */}
      <div className={s.toggleOverlay}>
        <div
          className={s.track}
          role="switch"
          aria-checked={editMode}
          tabIndex={0}
          onClick={() => setEditMode(e => !e)}
          onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && setEditMode(e => !e)}
          title={editMode ? 'Switch to view mode' : 'Switch to edit mode'}
        >
          <span className={`${s.thumb} ${editMode ? s.thumbRight : ''}`} />
          <div className={s.trackLabels}>
            <span className={`${s.trackLabel} ${!editMode ? s.trackLabelActive : s.trackLabelInactive}`}>
              <FontAwesomeIcon icon={faEye} />
              View
            </span>
            <span className={`${s.trackLabel} ${editMode ? s.trackLabelActive : s.trackLabelInactive}`}>
              <FontAwesomeIcon icon={faPencil} />
              Edit
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
