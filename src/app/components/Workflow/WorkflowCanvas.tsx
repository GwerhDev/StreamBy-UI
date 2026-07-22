import s from './WorkflowCanvas.module.css';
import { useMemo, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye, faFloppyDisk, faPencil } from '@fortawesome/free-solid-svg-icons';
import { Node, Edge } from 'reactflow';
import { RootState, AppDispatch } from '../../../store';
import { setCurrentProject } from '../../../store/currentProjectSlice';
import { addApiResponse } from '../../../store/apiResponsesSlice';
import { updateProjectWorkflow } from '../../../services/workflow';
import { ApiConnection, DbConnection, Export, PipelineRef, Project, StorageConnection, Workflow } from '../../../interfaces';
import { NodeViewer, NodeViewerHandle } from '../NodeViewer/NodeViewer';
import { TemplatePicker } from './TemplatePicker';

interface Props {
  workflow: Workflow;
}

export interface MgmtStorage { name: string; type?: string; }
export interface BuiltinDb { name: string; value: string; }

// Orchestrator side semantics (TCORE-64): Left = Pipelines, Top = DB/Storage/API +
// Credentials, Bottom = Exports, Right = reserved for future Distribution.
const X_STREAMBY     = 350;
const PIPELINE_XOFF  = -350;
const Y_INPUTS       = -160;
const Y_CREDENTIALS  = -320;
const Y_EXPORTS      = 220;

const EDGE_PRIMARY    = { stroke: '#38b6ff', strokeWidth: 1.5 };
const EDGE_CREDENTIAL = { stroke: '#6366f1', strokeWidth: 1.5 };

export function buildSchemaFromProject(
  project: Project,
  mgmtStorages: MgmtStorage[],
  builtinDbs: BuiltinDb[],
): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = [];
  const edges: Edge[] = [];

  const INPUT_SPACING = 220;

  let globalX     = X_STREAMBY - 550;
  let inputCount  = 0;
  let firstInputX = globalX;
  let lastInputX  = globalX;

  const registerInput = (nodeX: number) => {
    if (inputCount === 0) firstInputX = nodeX;
    lastInputX = nodeX;
    inputCount++;
  };

  const addSimpleInputNode = (id: string, type: string, label: string, subtitle: string, data?: Record<string, unknown>) => {
    registerInput(globalX);
    nodes.push({ id, type, position: { x: globalX, y: Y_INPUTS }, data: { label, subtitle, ...data } });
    edges.push({ id: `e-${id}`, source: id, sourceHandle: 'out-stream', target: 'streamby', targetHandle: 'in-top', animated: false, style: EDGE_PRIMARY });
    globalX += INPUT_SPACING;
  };

  // --- All DB connections (builtin + external), with collection + record sub-nodes ---
  const allDbs = [
    ...builtinDbs.map(db => ({
      id: `builtin-db-${db.name}`,
      label: db.name,
      subtitle: db.value === 'sql' ? 'postgresql' : 'mongodb',
    })),
    ...(project.dbConnections ?? []).map((db: DbConnection) => ({
      id: `db-${db.id}`,
      label: db.name,
      subtitle: db.dbType,
    })),
  ];

  for (const db of allDbs) {
    addSimpleInputNode(db.id, 'dataSourceNode', db.label, db.subtitle);
  }

  // --- API connections (with optional credential node) ---
  let credentialX = globalX;
  (project.apiConnections ?? []).forEach((api: ApiConnection) => {
    if (api.credentialId) {
      const cred = (project.credentials ?? []).find(c => c.id === api.credentialId);
      if (cred) {
        const credId = `credential-${cred.id}`;
        nodes.push({ id: credId, type: 'credentialNode', position: { x: credentialX, y: Y_CREDENTIALS }, data: { label: cred.key, subtitle: 'Credential', credentialId: cred.id } });
        edges.push({ id: `e-orchestrator-${credId}`, source: 'streamby', sourceHandle: 'out-credentials', target: credId, targetHandle: 'in-streamby', animated: false, style: EDGE_CREDENTIAL });
        edges.push({ id: `e-${credId}-api`, source: credId, sourceHandle: 'out-credential', target: `api-${api.id}`, targetHandle: 'in-credential', animated: false, style: EDGE_CREDENTIAL });
        credentialX += INPUT_SPACING;
      }
    }
    addSimpleInputNode(`api-${api.id}`, 'apiConnectionNode', api.name, api.method);
  });

  // --- Management-level storages ---
  mgmtStorages.forEach((storage: MgmtStorage, i: number) => {
    addSimpleInputNode(`mgmt-storage-${i}`, 'ingestNode', storage.name, storage.type ?? 'storage');
  });

  // --- External storage connections ---
  (project.storageConnections ?? []).forEach((storage: StorageConnection) => {
    addSimpleInputNode(`storage-${storage.id}`, 'ingestNode', storage.name, storage.type);
  });

  // --- StreamBy orchestrator (center, horizontally aligned to all inputs) ---
  const streambyX = inputCount > 0 ? (firstInputX + lastInputX) / 2 : X_STREAMBY;
  nodes.push({ id: 'streamby', type: 'orchestratorNode', position: { x: streambyX, y: 20 }, data: { label: 'StreamBy', subtitle: 'Orchestrator' } });

  // --- Pipelines (left column) — auto-drawn from project.pipelines[] ---
  (project.pipelines ?? []).forEach((pipeline: PipelineRef, i: number) => {
    const pipelineNodeId = `pipeline-${pipeline.id}`;
    nodes.push({ id: pipelineNodeId, type: 'pipelineRefNode', position: { x: streambyX + PIPELINE_XOFF, y: 20 + i * INPUT_SPACING }, data: { label: pipeline.name, subtitle: 'Pipeline', pipelineId: pipeline.id } });
    edges.push({ id: `e-streamby-${pipelineNodeId}`, source: 'streamby', sourceHandle: 'out-pipeline', target: pipelineNodeId, targetHandle: 'in-orchestrator', animated: true, style: EDGE_PRIMARY });
  });

  // --- Exports (bottom row) ---
  (project.exports ?? []).forEach((exp: Export, i: number) => {
    const exportNodeId = `export-${exp.id}`;
    nodes.push({ id: exportNodeId, type: 'exportNode', position: { x: streambyX + i * INPUT_SPACING, y: Y_EXPORTS }, data: { label: exp.name, subtitle: exp.method || 'GET', exportId: exp.id } });
    edges.push({ id: `e-streamby-${exportNodeId}`, source: 'streamby', sourceHandle: 'out-bottom', target: exportNodeId, targetHandle: 'in-orchestrator-bottom', animated: true, style: EDGE_PRIMARY });
  });

  return { nodes, edges };
}

export function WorkflowCanvas({ workflow }: Props) {
  const { id: projectId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const currentProject = useSelector((state: RootState) => state.currentProject.data);

  const [localSchema, setLocalSchema] = useState<{ nodes: Node[]; edges: Edge[] } | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const nodeViewerRef = useRef<NodeViewerHandle>(null);

  const displaySchema = useMemo<{ nodes: Node[]; edges: Edge[] } | null>(() => {
    if (localSchema !== null) return localSchema;
    if (workflow.nodeSchema) return workflow.nodeSchema as { nodes: Node[]; edges: Edge[] };
    return null;
  }, [localSchema, workflow.nodeSchema]);

  const nodeViewerKey = useMemo(() => {
    if (workflow.nodeSchema) return `saved-${workflow.id}`;
    if (localSchema) return 'template';
    return 'empty';
  }, [workflow.nodeSchema, workflow.id, localSchema]);

  const exportAdapter = useMemo<Export>(() => ({
    id: workflow.id,
    name: workflow.name,
    description: workflow.description ?? '',
    status: 'completed',
    createdAt: '',
    updatedAt: '',
    projectId: projectId ?? '',
    exportedBy: '',
    nodeSchema: displaySchema,
  }), [workflow, projectId, displaySchema]);

  const handleTemplateSelect = (schema: { nodes: Node[]; edges: Edge[] }) => {
    setLocalSchema(schema);
    setEditMode(true);
  };

  const handleSave = async () => {
    if (!projectId || !currentProject) return;
    setSaving(true);
    const nodeSchema = nodeViewerRef.current?.getSchema() ?? null;
    try {
      const updated: Workflow = await updateProjectWorkflow(projectId, { nodeSchema });
      dispatch(setCurrentProject({
        ...currentProject,
        workflow: updated,
      }));
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
        <TemplatePicker context="workflow" onSelect={handleTemplateSelect} />
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
        context="workflow"
        exportDetails={exportAdapter}
        editMode={editMode}
        projectId={projectId}
        canvasOverlay={saveButton}
        onOpenPipeline={pipelineId => navigate(`/project/${projectId}/workflow/pipelines/${pipelineId}/editor`)}
        onOpenExport={exportId => navigate(`/project/${projectId}/workflow/exports/${exportId}/editor`)}
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
