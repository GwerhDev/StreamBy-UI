import s from './PipelineCanvas.module.css';
import { useMemo, useRef, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useParams } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFloppyDisk } from '@fortawesome/free-solid-svg-icons';
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
// Mirrors ExportEditor: always editable, no View/Edit toggle — the read-only view lives
// separately in PipelineDetailsView. Shows a TemplatePicker (Blank + pipeline-scoped
// templates) when there's no saved schema yet.
export function PipelineCanvas({ pipeline, onChange }: Props) {
  const { id: projectId } = useParams<{ id: string }>();
  const dispatch = useDispatch<AppDispatch>();

  const [localSchema, setLocalSchema] = useState<{ nodes: Node[]; edges: Edge[] } | null>(null);
  const [saving, setSaving] = useState(false);
  const nodeViewerRef = useRef<NodeViewerHandle>(null);

  const displaySchema = useMemo<{ nodes: Node[]; edges: Edge[] } | null>(() => {
    if (localSchema !== null) return localSchema;
    if (pipeline.nodeSchema) return pipeline.nodeSchema as { nodes: Node[]; edges: Edge[] };
    return null;
  }, [localSchema, pipeline.nodeSchema]);

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
        <TemplatePicker context="pipeline" onSelect={handleTemplateSelect} />
      </div>
    );
  }

  const saveButton = (
    <button
      className={s.saveBtn}
      onClick={handleSave}
      disabled={saving}
      title={saving ? 'Saving…' : 'Save'}
    >
      <FontAwesomeIcon icon={faFloppyDisk} />
    </button>
  );

  return (
    <div className={s.container}>
      <NodeViewer
        key={pipeline.nodeSchema ? `saved-${pipeline.id}` : 'template'}
        ref={nodeViewerRef}
        context="pipeline"
        exportDetails={exportAdapter}
        editMode
        projectId={projectId}
        canvasOverlay={saveButton}
      />
    </div>
  );
}
