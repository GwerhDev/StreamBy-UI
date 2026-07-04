import s from './ProjectArchitecture.module.css';
import { useMemo, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye, faFloppyDisk, faPencil } from '@fortawesome/free-solid-svg-icons';
import { Node, Edge } from 'reactflow';
import { RootState, AppDispatch } from '../../../store';
import { setCurrentProject } from '../../../store/currentProjectSlice';
import { addApiResponse } from '../../../store/apiResponsesSlice';
import { updateProjectWorkflow } from '../../../services/workflows';
import { ApiConnection, DbConnection, Export, Project, StorageConnection, Workflow } from '../../../interfaces';
import { NodeViewer, NodeViewerHandle } from '../NodeViewer/NodeViewer';
import { TemplatePicker } from './TemplatePicker';

interface Props {
  workflow: Workflow;
}

export interface MgmtStorage { name: string; type?: string; }
export interface BuiltinDb { name: string; value: string; }

// Canvas column x-positions
const X_CREDENTIALS = -200;
const X_INPUTS      = 80;
const X_STREAMBY    = 350;
const X_EXPORTS     = 620;

const EDGE_PRIMARY    = { stroke: '#38b6ff', strokeWidth: 1.5 };
const EDGE_CREDENTIAL = { stroke: '#6366f1', strokeWidth: 1.5 };

export function buildSchemaFromProject(
  project: Project,
  mgmtStorages: MgmtStorage[],
  builtinDbs: BuiltinDb[],
): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = [];
  const edges: Edge[] = [];

  const INPUT_SPACING = 140;

  let globalY     = 20;
  let outputY     = 20;
  let inputCount  = 0;
  let firstInputY = 20;
  let lastInputY  = 20;

  const registerInput = (nodeY: number) => {
    if (inputCount === 0) firstInputY = nodeY;
    lastInputY = nodeY;
    inputCount++;
  };

  const addSimpleInputNode = (id: string, type: string, label: string, subtitle: string, data?: Record<string, unknown>) => {
    registerInput(globalY);
    nodes.push({ id, type, position: { x: X_INPUTS, y: globalY }, data: { label, subtitle, ...data } });
    edges.push({ id: `e-${id}`, source: id, sourceHandle: 'out-right', target: 'streamby', targetHandle: 'in-left', animated: false, style: EDGE_PRIMARY });
    globalY += INPUT_SPACING;
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
  (project.apiConnections ?? []).forEach((api: ApiConnection) => {
    if (api.credentialId) {
      const cred = (project.credentials ?? []).find(c => c.id === api.credentialId);
      if (cred) {
        const credId = `credential-${cred.id}`;
        nodes.push({ id: credId, type: 'credentialNode', position: { x: X_CREDENTIALS, y: globalY }, data: { label: cred.key, subtitle: 'Credential', credentialId: cred.id } });
        edges.push({ id: `e-orchestrator-${credId}`, source: 'streamby', sourceHandle: 'out-credentials', target: credId, targetHandle: 'in-streamby', animated: false, style: EDGE_CREDENTIAL });
        edges.push({ id: `e-${credId}-api`, source: credId, sourceHandle: 'out-credential', target: `api-${api.id}`, targetHandle: 'in-credential', animated: false, style: EDGE_CREDENTIAL });
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

  // --- StreamBy orchestrator (center, vertically aligned to all inputs) ---
  const streambyY = inputCount > 0 ? (firstInputY + lastInputY) / 2 : 20;
  nodes.push({ id: 'streamby', type: 'orchestratorNode', position: { x: X_STREAMBY, y: streambyY }, data: { label: 'StreamBy', subtitle: 'Orchestrator' } });

  // --- Exports (right column) ---
  (project.exports ?? []).forEach((exp: Export) => {
    nodes.push({ id: `export-${exp.id}`, type: 'exportNode', position: { x: X_EXPORTS, y: outputY }, data: { label: exp.name, subtitle: exp.method || 'GET' } });
    edges.push({ id: `e-streamby-export-${exp.id}`, source: 'streamby', sourceHandle: 'out-right', target: `export-${exp.id}`, targetHandle: 'in-left', animated: true, style: EDGE_PRIMARY });
    outputY += INPUT_SPACING;
  });

  return { nodes, edges };
}

export function ProjectArchitecture({ workflow }: Props) {
  const { id: projectId } = useParams<{ id: string }>();
  const dispatch = useDispatch<AppDispatch>();
  const currentProject = useSelector((state: RootState) => state.currentProject.data);
  const allWorkflows = useMemo(() => currentProject?.workflows ?? [], [currentProject?.workflows]);

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
        workflows: allWorkflows.map(w => w.id === workflow.id ? updated : w),
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
