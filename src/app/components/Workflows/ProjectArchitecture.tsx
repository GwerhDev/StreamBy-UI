import s from './ProjectArchitecture.module.css';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import ReactFlow, {
  Background,
  BackgroundVariant,
  Controls,
  Edge,
  Node,
  useNodesState,
  useEdgesState,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { faFileExport, faSitemap, faTriangleExclamation } from '@fortawesome/free-solid-svg-icons';
import { RootState, AppDispatch } from '../../../store';
import { setCurrentProject } from '../../../store/currentProjectSlice';
import { addApiResponse } from '../../../store/apiResponsesSlice';
import { updateWorkflow, createWorkflow, deleteWorkflow } from '../../../services/workflows';
import { createExport, deleteExport } from '../../../services/exports';
import { Export, Workflow } from '../../../interfaces';
import { StreamByNode } from '../NodeViewer/nodes/nodeTypes';
import { ExportRefNode, PipelineRefNode, ArchNodeData } from '../NodeViewer/nodes/ArchitectureNodes';
import { ModalShell } from '../Modals/ModalShell';
import { ActionButton } from '../Buttons/ActionButton';

const ARCH_NODE_TYPES = {
  streambyNode: StreamByNode,
  exportRef: ExportRefNode,
  pipelineRef: PipelineRefNode,
};

interface PendingDelete {
  entityType: 'export' | 'pipeline';
  entityId: string;
  nodeId: string;
  label: string;
}

function syncNodes(
  exports: Export[],
  subWorkflows: Workflow[],
  savedSchema: { nodes: object[]; edges: object[] } | null,
  currentNodes: Node[],
  onDelete: ArchNodeData['onDelete'],
): { nodes: Node[]; edges: Edge[] } {
  const saved = (savedSchema?.nodes ?? []) as Node[];

  const findPos = (nodeId: string) =>
    currentNodes.find(n => n.id === nodeId)?.position ??
    saved.find(n => n.id === nodeId)?.position ??
    null;

  const sbPos = findPos('streamby') ?? { x: 400, y: 200 };
  const sbNode: Node = {
    id: 'streamby',
    type: 'streambyNode',
    position: sbPos,
    data: { label: 'StreamBy', subtitle: 'Orchestrator' },
    deletable: false,
    selectable: false,
  };

  const allEntities = [
    ...exports.map(e => ({
      nodeId: `export-${e.id}`,
      type: 'exportRef',
      entityId: e.id,
      label: e.name,
      subtitle: e.method ?? 'GET',
    })),
    ...subWorkflows.map(w => ({
      nodeId: `pipeline-${w.id}`,
      type: 'pipelineRef',
      entityId: w.id,
      label: w.name,
      subtitle: w.description || 'Pipeline',
    })),
  ];

  const total = allEntities.length;
  const entityNodes: Node[] = allEntities.map((e, i) => {
    const savedPos = findPos(e.nodeId);
    const position = savedPos ?? (() => {
      const totalSpread = Math.min((Math.PI / 3) * (total - 1), Math.PI);
      const startAngle = total > 1 ? -totalSpread / 2 : 0;
      const angle = total > 1 ? startAngle + (i / (total - 1)) * totalSpread : 0;
      return { x: sbPos.x + Math.cos(angle) * 320, y: sbPos.y + Math.sin(angle) * 220 };
    })();
    return {
      id: e.nodeId,
      type: e.type,
      position,
      data: { entityId: e.entityId, label: e.label, subtitle: e.subtitle, onDelete },
      deletable: false,
    };
  });

  const edges: Edge[] = allEntities.map(e => ({
    id: `e-sb-${e.nodeId}`,
    source: 'streamby',
    sourceHandle: 'out-right',
    target: e.nodeId,
    targetHandle: 'in-left',
    animated: true,
    style: { stroke: '#38B6FF', strokeWidth: 2 },
  }));

  return { nodes: [sbNode, ...entityNodes], edges };
}

// ─── Add Export Modal ─────────────────────────────────────────────────────────

interface AddExportModalProps {
  projectId: string;
  onClose: () => void;
  onCreated: (exp: Export) => void;
}

function AddExportModal({ projectId, onClose, onCreated }: AddExportModalProps) {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const created = await createExport(projectId, {
        name: name.trim(),
        collectionName: name.trim().toLowerCase().replace(/\s+/g, '-'),
      });
      onCreated(created);
    } catch (err: any) {
      setError(err.message || 'Failed to create export');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModalShell
      title="Add Export"
      icon={faFileExport}
      onClose={onClose}
      footer={
        <div className={s.modalFooter}>
          <button type="button" className={s.cancelBtn} onClick={onClose}>Cancel</button>
          <ActionButton
            text={loading ? 'Creating…' : 'Create Export'}
            type="submit"
            form="add-export-form"
            disabled={loading || !name.trim()}
          />
        </div>
      }
    >
      <form id="add-export-form" onSubmit={handleSubmit} className={s.modalForm}>
        <label className={s.fieldLabel}>Export name</label>
        <input
          className={s.fieldInput}
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="e.g. github-latest"
          autoFocus
        />
        {error && <span className={s.fieldError}>{error}</span>}
      </form>
    </ModalShell>
  );
}

// ─── Add Pipeline Modal ───────────────────────────────────────────────────────

interface AddPipelineModalProps {
  projectId: string;
  onClose: () => void;
  onCreated: (wf: Workflow) => void;
}

function AddPipelineModal({ projectId, onClose, onCreated }: AddPipelineModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const created = await createWorkflow(projectId, {
        name: name.trim(),
        description: description.trim() || undefined,
      });
      onCreated(created);
    } catch (err: any) {
      setError(err.message || 'Failed to create pipeline');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModalShell
      title="Add Pipeline"
      icon={faSitemap}
      onClose={onClose}
      footer={
        <div className={s.modalFooter}>
          <button type="button" className={s.cancelBtn} onClick={onClose}>Cancel</button>
          <ActionButton
            text={loading ? 'Creating…' : 'Create Pipeline'}
            type="submit"
            form="add-pipeline-form"
            disabled={loading || !name.trim()}
          />
        </div>
      }
    >
      <form id="add-pipeline-form" onSubmit={handleSubmit} className={s.modalForm}>
        <label className={s.fieldLabel}>Pipeline name</label>
        <input
          className={s.fieldInput}
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="e.g. Guion, Animación 3D"
          autoFocus
        />
        <label className={s.fieldLabel}>Description</label>
        <input
          className={s.fieldInput}
          value={description}
          onChange={e => setDescription(e.target.value)}
          placeholder="Optional"
        />
        {error && <span className={s.fieldError}>{error}</span>}
      </form>
    </ModalShell>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

interface Props {
  workflow: Workflow;
}

export function ProjectArchitecture({ workflow }: Props) {
  const { id: projectId } = useParams<{ id: string }>();
  const dispatch = useDispatch<AppDispatch>();
  const currentProject = useSelector((state: RootState) => state.currentProject.data);

  const exports = currentProject?.exports ?? [];
  const allWorkflows = currentProject?.workflows ?? [];
  const subWorkflows = allWorkflows.filter(w => w.id !== workflow.id);

  const [nodes, setNodes, onNodesChange] = useNodesState<ArchNodeData>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [pendingDelete, setPendingDelete] = useState<PendingDelete | null>(null);
  const [showAddExport, setShowAddExport] = useState(false);
  const [showAddPipeline, setShowAddPipeline] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const nodesRef = useRef<Node[]>([]);
  useEffect(() => { nodesRef.current = nodes; }, [nodes]);

  const handleDelete = useCallback((entityType: 'export' | 'pipeline', entityId: string, nodeId: string) => {
    const label = entityType === 'export'
      ? (exports.find(e => e.id === entityId)?.name ?? entityId)
      : (subWorkflows.find(w => w.id === entityId)?.name ?? entityId);
    setPendingDelete({ entityType, entityId, nodeId, label });
  }, [exports, subWorkflows]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    const synced = syncNodes(exports, subWorkflows, workflow.nodeSchema ?? null, nodesRef.current, handleDelete);
    setNodes(synced.nodes);
    setEdges(synced.edges);
  }, [exports.length, subWorkflows.length, workflow.id]);

  const handleSave = async () => {
    if (!projectId || !currentProject) return;
    setSaving(true);
    const cleanSchema = {
      nodes: nodes.map(n =>
        n.type === 'streambyNode'
          ? { id: n.id, type: n.type, position: n.position, data: { label: n.data.label, subtitle: n.data.subtitle } }
          : { id: n.id, type: n.type, position: n.position, data: { entityId: n.data.entityId, label: n.data.label, subtitle: n.data.subtitle } }
      ),
      edges,
    };
    try {
      const updated: Workflow = await updateWorkflow(projectId, workflow.id, { nodeSchema: cleanSchema });
      dispatch(setCurrentProject({
        ...currentProject,
        workflows: allWorkflows.map(w => w.id === workflow.id ? updated : w),
      }));
      dispatch(addApiResponse({ message: 'Architecture saved.', type: 'success' }));
    } catch (err: any) {
      dispatch(addApiResponse({ message: err.message || 'Failed to save.', type: 'error' }));
    } finally {
      setSaving(false);
    }
  };

  const handleExportCreated = (exp: Export) => {
    setShowAddExport(false);
    if (!currentProject) return;
    dispatch(setCurrentProject({
      ...currentProject,
      exports: [...(currentProject.exports ?? []), exp],
    }));
  };

  const handlePipelineCreated = (wf: Workflow) => {
    setShowAddPipeline(false);
    if (!currentProject) return;
    dispatch(setCurrentProject({
      ...currentProject,
      workflows: [...allWorkflows, wf],
    }));
  };

  const handleDeleteConfirm = async () => {
    if (!pendingDelete || !projectId || !currentProject) return;
    setDeleting(true);
    const { entityType, entityId, nodeId } = pendingDelete;
    try {
      if (entityType === 'export') {
        await deleteExport(projectId, entityId);
        dispatch(setCurrentProject({
          ...currentProject,
          exports: (currentProject.exports ?? []).filter(e => e.id !== entityId),
        }));
      } else {
        await deleteWorkflow(projectId, entityId);
        dispatch(setCurrentProject({
          ...currentProject,
          workflows: allWorkflows.filter(w => w.id !== entityId),
        }));
      }
      setNodes(prev => prev.filter(n => n.id !== nodeId));
      setEdges(prev => prev.filter(e => e.source !== nodeId && e.target !== nodeId));
    } catch (err: any) {
      dispatch(addApiResponse({ message: err.message || 'Failed to delete.', type: 'error' }));
    } finally {
      setDeleting(false);
      setPendingDelete(null);
    }
  };

  return (
    <div className={s.container}>
      <div className={s.canvas}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          nodeTypes={ARCH_NODE_TYPES}
          fitView
          fitViewOptions={{ padding: 0.35 }}
          deleteKeyCode={null}
          minZoom={0.3}
          maxZoom={1.5}
        >
          <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="var(--color-surface)" />
          <Controls showInteractive={false} />
        </ReactFlow>
      </div>

      {showAddExport && (
        <AddExportModal
          projectId={projectId!}
          onClose={() => setShowAddExport(false)}
          onCreated={handleExportCreated}
        />
      )}

      {showAddPipeline && (
        <AddPipelineModal
          projectId={projectId!}
          onClose={() => setShowAddPipeline(false)}
          onCreated={handlePipelineCreated}
        />
      )}

      {pendingDelete && (
        <ModalShell
          title={`Delete ${pendingDelete.entityType}`}
          icon={faTriangleExclamation}
          onClose={() => !deleting && setPendingDelete(null)}
          footer={
            <div className={s.modalFooter}>
              <button
                type="button"
                className={s.cancelBtn}
                onClick={() => setPendingDelete(null)}
                disabled={deleting}
              >
                Cancel
              </button>
              <button
                type="button"
                className={s.deleteConfirmBtn}
                onClick={handleDeleteConfirm}
                disabled={deleting}
              >
                {deleting ? 'Deleting…' : `Delete ${pendingDelete.entityType}`}
              </button>
            </div>
          }
        >
          <p className={s.confirmText}>
            This will permanently delete <strong>{pendingDelete.label}</strong>. This action cannot be undone.
          </p>
        </ModalShell>
      )}
    </div>
  );
}
