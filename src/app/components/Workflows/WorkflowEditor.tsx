import s from './WorkflowEditor.module.css';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import ReactFlow, {
  Background, BackgroundVariant, Controls,
  Edge, Node,
  useNodesState, useEdgesState, useReactFlow, ReactFlowProvider,
  addEdge, Connection,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import { RootState, AppDispatch } from '../../../store';
import { addApiResponse } from '../../../store/apiResponsesSlice';
import { setCurrentWorkflow, clearCurrentWorkflow, setWorkflowLoading, setWorkflowError } from '../../../store/currentWorkflowSlice';
import { getWorkflow, updateWorkflow } from '../../../services/workflows';
import { Workflow } from '../../../interfaces';
import { nodeTypes as NODE_TYPES } from '../NodeViewer/nodes/nodeTypes';
import { PaletteItem, PALETTE_GROUPS, NODE_PALETTE, edgeColorForSource } from '../NodeViewer/nodePalette';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faAnglesLeft, faAnglesRight, faFloppyDisk, faSitemap, faXmark } from '@fortawesome/free-solid-svg-icons';
import { ActionButton } from '../Buttons/ActionButton';
import { SecondaryButton } from '../Buttons/SecondaryButton';
import { Spinner } from '../Spinner';

function defaultNodes(): Node[] {
  return [
    { id: 'streamby', type: 'streambyNode', position: { x: 300, y: 200 }, data: { label: 'StreamBy', subtitle: 'Pipeline Core' } },
  ];
}

function defaultEdges(): Edge[] {
  return [];
}

interface WorkflowEditorInnerProps {
  workflow: Workflow;
  onSaved: (updated: Workflow) => void;
}

function WorkflowEditorInner({ workflow, onSaved }: WorkflowEditorInnerProps) {
  const { screenToFlowPosition } = useReactFlow();
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { id: projectId } = useParams<{ id: string }>();
  const workspaceMode = useSelector((state: RootState) => state.session.mode ?? 'developer');

  const palette: PaletteItem[] = useMemo(() => {
    if (workspaceMode === 'developer') return NODE_PALETTE;
    return NODE_PALETTE.filter(item => ['output', 'review', 'delivery', 'ai'].includes(item.group));
  }, [workspaceMode]);

  const groups = useMemo(() => {
    if (workspaceMode === 'developer') return PALETTE_GROUPS;
    return PALETTE_GROUPS.filter(g => ['output', 'review', 'delivery', 'ai'].includes(g.key));
  }, [workspaceMode]);

  const initialSchemaRef = useRef(workflow.nodeSchema);

  const initialNodes = useMemo((): Node[] => {
    if (initialSchemaRef.current?.nodes?.length) return initialSchemaRef.current.nodes as Node[];
    return defaultNodes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const initialEdges = useMemo((): Edge[] => {
    if (initialSchemaRef.current?.edges?.length) return initialSchemaRef.current.edges as Edge[];
    return defaultEdges();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [paletteCollapsed, setPaletteCollapsed] = useState(false);
  const [saving, setSaving] = useState(false);

  const onConnect = useCallback((connection: Connection) => {
    const src = nodes.find(n => n.id === connection.source);
    const color = edgeColorForSource(connection.sourceHandle, src?.type ?? '');
    setEdges(prev => addEdge({ ...connection, animated: true, style: { stroke: color, strokeWidth: 2 } }, prev));
  }, [nodes, setEdges]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    if (e.dataTransfer.types.includes('application/streamby-node')) e.preventDefault();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const raw = e.dataTransfer.getData('application/streamby-node');
    if (!raw) return;
    const config = JSON.parse(raw) as PaletteItem;
    const position = screenToFlowPosition({ x: e.clientX, y: e.clientY });
    const id = `${config.type}-${crypto.randomUUID()}`;
    const pos = position ?? (
      config.group === 'process' ? { x: 300 + Math.random() * 60, y: 60  + Math.random() * 40 }
    : config.group === 'output'  ? { x: 540 + Math.random() * 60, y: 200 + Math.random() * 40 }
    :                              { x: 300 + Math.random() * 60, y: 340 + Math.random() * 40 }
    );
    setNodes(prev => [...prev, {
      id, type: config.type, position: pos,
      data: { label: config.label, subtitle: config.subtitle, icon: config.icon, bgColor: config.bgColor, iconColor: config.iconColor },
    }]);
  }, [screenToFlowPosition, setNodes]);

  const handleSave = async () => {
    if (!projectId) return;
    setSaving(true);
    try {
      const nodeSchema = { nodes, edges };
      const updated: Workflow = await updateWorkflow(projectId, workflow.id, { nodeSchema });
      dispatch(addApiResponse({ message: 'Workflow saved.', type: 'success' }));
      onSaved(updated);
    } catch (err: any) {
      dispatch(addApiResponse({ message: err.message || 'Failed to save workflow.', type: 'error' }));
    } finally {
      setSaving(false);
    }
  };

  const groupedPalette = useMemo(() => {
    return groups.map(g => ({
      ...g,
      items: palette.filter(p => p.group === g.key),
    })).filter(g => g.items.length > 0);
  }, [palette, groups]);

  return (
    <div className={s.container}>
      <div className={s.toolbar}>
        <div className={s.toolbarLeft}>
          <FontAwesomeIcon icon={faSitemap} />
          <span className={s.workflowName}>{workflow.name}</span>
        </div>
        <div className={s.toolbarRight}>
          {saving && <span className={s.savingLabel}>Saving…</span>}
          <ActionButton icon={faFloppyDisk} text="Save" onClick={handleSave} disabled={saving} />
          <SecondaryButton icon={faXmark} text="Close" onClick={() => navigate(`/project/${projectId}/workflows/${workflow.id}`)} />
        </div>
      </div>

      <div className={s.body}>
        {/* Palette */}
        <div className={`${s.palette} ${paletteCollapsed ? s.paletteCollapsed : ''}`}>
          <button className={s.paletteToggle} onClick={() => setPaletteCollapsed(p => !p)} title={paletteCollapsed ? 'Expand palette' : 'Collapse palette'}>
            <FontAwesomeIcon icon={paletteCollapsed ? faAnglesRight : faAnglesLeft} />
          </button>
          {!paletteCollapsed && groupedPalette.map(g => (
            <React.Fragment key={g.key}>
              <div className={s.paletteGroup} style={{ color: g.color }}>{g.label}</div>
              {g.items.map(item => (
                <div
                  key={`${item.type}-${item.label}`}
                  className={s.paletteItem}
                  draggable
                  onDragStart={e => {
                    e.dataTransfer.setData('application/streamby-node', JSON.stringify(item));
                    e.dataTransfer.effectAllowed = 'copy';
                  }}
                >
                  <FontAwesomeIcon icon={item.icon} className={s.paletteIcon} style={{ color: item.iconColor }} />
                  {item.label}
                </div>
              ))}
            </React.Fragment>
          ))}
        </div>

        {/* Canvas */}
        <div className={s.canvas}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            nodeTypes={NODE_TYPES}
            fitView
            deleteKeyCode="Delete"
          >
            <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="var(--color-surface-raised)" />
            <Controls />
          </ReactFlow>
        </div>
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
    if (workflow?.id === workflowId) return;
    dispatch(setWorkflowLoading());
    getWorkflow(projectId, workflowId)
      .then(data => dispatch(setCurrentWorkflow(data)))
      .catch(err => dispatch(setWorkflowError(err.message || 'Failed to load workflow.')));
    return () => { dispatch(clearCurrentWorkflow()); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, workflowId]);

  const handleSaved = useCallback((updated: Workflow) => {
    dispatch(setCurrentWorkflow(updated));
  }, [dispatch]);

  if (loading) return <Spinner bg isLoading />;
  if (error) return <div style={{ padding: '2rem', color: 'var(--color-error)' }}>{error}</div>;
  if (!workflow) return null;

  return (
    <ReactFlowProvider>
      <WorkflowEditorInner workflow={workflow} onSaved={handleSaved} />
    </ReactFlowProvider>
  );
}
