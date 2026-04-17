import React, { memo, useState, useCallback, useEffect, useMemo, useRef, forwardRef, useImperativeHandle } from 'react';
import { getConnectionResponse } from '../../../services/connections';
import JsonViewer from '../JsonViewer/JsonViewer';
import { JsonEditor } from '../JsonEditor/JsonEditor';
import ReactFlow, {
  Background,
  BackgroundVariant,
  Controls,
  Edge,
  Node,
  NodeProps,
  Handle,
  Position,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
} from 'reactflow';
import 'reactflow/dist/style.css';
import s from './NodeViewer.module.css';
import { Export, ApiConnection } from '../../../interfaces';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import {
  faUser, faBolt, faDatabase, faGlobe, faXmark, faFloppyDisk,
  faInfoCircle, faArrowsRotate, faFilter, faKey, faWrench,
  faPlus, faCode, faArrowRight,
} from '@fortawesome/free-solid-svg-icons';

// ─── Node Data Types ───────────────────────────────────────────────────────

interface BaseNodeData { label: string; subtitle: string; }
interface ProcessNodeData extends BaseNodeData { icon: IconDefinition; bgColor: string; iconColor: string; }
interface JsonInputNodeData extends BaseNodeData { jsonString: string; }

// ─── Handle color tokens ───────────────────────────────────────────────────
// Left=input blue, Top=process purple, Bottom=data green, Right=output amber

const H_LEFT   = '#38B6FF';
const H_TOP    = '#a78bfa';
const H_BOTTOM = '#34d399';
const H_RIGHT  = '#fbbf24';

const hIn  = (color: string): React.CSSProperties => ({ background: 'var(--color-dark-800)', borderColor: color });
const hOut = (color: string): React.CSSProperties => ({ background: color, borderColor: color });

// ─── Custom Node Components ────────────────────────────────────────────────

const ClientNode = memo(({ data, selected }: NodeProps<BaseNodeData>) => (
  <div className={`${s.customNode} ${selected ? s.nodeSelected : ''}`}>
    <Handle type="source" position={Position.Right} id="out-right" className={s.handle} style={hOut(H_LEFT)} />
    <div className={s.nodeIconBar} style={{ backgroundColor: '#0e2537' }}>
      <div className={s.nodeIcon} style={{ color: H_LEFT }}><FontAwesomeIcon icon={faUser} /></div>
    </div>
    <div className={s.nodeBody}>
      <div className={s.nodeLabel}>{data.label}</div>
      <div className={s.nodeSubtitle}>{data.subtitle}</div>
    </div>
  </div>
));
ClientNode.displayName = 'ClientNode';

const StreamByNode = memo(({ data, selected }: NodeProps<BaseNodeData>) => (
  <div className={`${s.customNode} ${s.streambyNode} ${selected ? s.nodeSelected : ''}`}>
    {/* Left — input from client */}
    <Handle type="target" position={Position.Left}   id="in-left"   className={s.handle} style={hIn(H_LEFT)} />
    {/* Top — process layer */}
    <Handle type="source" position={Position.Top}    id="out-top"   className={s.handle} style={{ ...hOut(H_TOP),    left: '35%' }} />
    <Handle type="target" position={Position.Top}    id="in-top"    className={s.handle} style={{ ...hIn(H_TOP),     left: '65%' }} />
    {/* Bottom — data layer */}
    <Handle type="source" position={Position.Bottom} id="out-bottom" className={s.handle} style={{ ...hOut(H_BOTTOM), left: '35%' }} />
    <Handle type="target" position={Position.Bottom} id="in-bottom"  className={s.handle} style={{ ...hIn(H_BOTTOM),  left: '65%' }} />
    {/* Right — output layer */}
    <Handle type="source" position={Position.Right}  id="out-right" className={s.handle} style={hOut(H_RIGHT)} />
    <div className={s.nodeIconBar} style={{ backgroundColor: '#14103a' }}>
      <div className={s.nodeIcon} style={{ color: '#a78bfa' }}><FontAwesomeIcon icon={faBolt} /></div>
    </div>
    <div className={s.nodeBody}>
      <div className={s.nodeLabel}>{data.label}</div>
      <div className={s.nodeSubtitle}>{data.subtitle}</div>
    </div>
  </div>
));
StreamByNode.displayName = 'StreamByNode';

// Sits ABOVE StreamBy — connects via StreamBy top handles
const ProcessNode = memo(({ data, selected }: NodeProps<ProcessNodeData>) => (
  <div className={`${s.customNode} ${selected ? s.nodeSelected : ''}`}>
    <Handle type="target" position={Position.Bottom} id="in-process"  className={s.handle} style={{ ...hIn(H_TOP),  left: '35%' }} />
    <Handle type="source" position={Position.Bottom} id="out-process" className={s.handle} style={{ ...hOut(H_TOP), left: '65%' }} />
    <div className={s.nodeIconBar} style={{ backgroundColor: data.bgColor }}>
      <div className={s.nodeIcon} style={{ color: data.iconColor }}><FontAwesomeIcon icon={data.icon} /></div>
    </div>
    <div className={s.nodeBody}>
      <div className={s.nodeLabel}>{data.label}</div>
      <div className={s.nodeSubtitle}>{data.subtitle}</div>
    </div>
  </div>
));
ProcessNode.displayName = 'ProcessNode';

// Sits BELOW StreamBy — connects via StreamBy bottom handles + receives JSON input from left
const DataSourceNode = memo(({ data, selected }: NodeProps<BaseNodeData>) => (
  <div className={`${s.customNode} ${selected ? s.nodeSelected : ''}`}>
    <Handle type="target" position={Position.Top}  id="in-stream"  className={s.handle} style={{ ...hIn(H_BOTTOM),  left: '35%' }} />
    <Handle type="source" position={Position.Top}  id="out-stream" className={s.handle} style={{ ...hOut(H_BOTTOM), left: '65%' }} />
    <Handle type="target" position={Position.Left} id="in-json"    className={s.handle} style={hIn(H_RIGHT)} />
    <div className={s.nodeIconBar} style={{ backgroundColor: '#0d2a1e' }}>
      <div className={s.nodeIcon} style={{ color: H_BOTTOM }}><FontAwesomeIcon icon={faDatabase} /></div>
    </div>
    <div className={s.nodeBody}>
      <div className={s.nodeLabel}>{data.label}</div>
      <div className={s.nodeSubtitle}>{data.subtitle}</div>
    </div>
  </div>
));
DataSourceNode.displayName = 'DataSourceNode';

// Sits BELOW StreamBy — connects via StreamBy bottom handles
const ApiConnectionNode = memo(({ data, selected }: NodeProps<BaseNodeData>) => (
  <div className={`${s.customNode} ${selected ? s.nodeSelected : ''}`}>
    <Handle type="target" position={Position.Top}  id="in-stream"  className={s.handle} style={{ ...hIn(H_BOTTOM),  left: '35%' }} />
    <Handle type="source" position={Position.Top}  id="out-stream" className={s.handle} style={{ ...hOut(H_BOTTOM), left: '65%' }} />
    <div className={s.nodeIconBar} style={{ backgroundColor: '#0b1e35' }}>
      <div className={s.nodeIcon} style={{ color: H_LEFT }}><FontAwesomeIcon icon={faGlobe} /></div>
    </div>
    <div className={s.nodeBody}>
      <div className={s.nodeLabel}>{data.label}</div>
      <div className={s.nodeSubtitle}>{data.subtitle}</div>
    </div>
  </div>
));
ApiConnectionNode.displayName = 'ApiConnectionNode';

// Feeds static JSON into the data layer
const JsonInputNode = memo(({ data, selected }: NodeProps<JsonInputNodeData>) => (
  <div className={`${s.customNode} ${selected ? s.nodeSelected : ''}`}>
    <Handle type="source" position={Position.Right} id="out-right" className={s.handle} style={hOut(H_RIGHT)} />
    <div className={s.nodeIconBar} style={{ backgroundColor: '#1e1403' }}>
      <div className={s.nodeIcon} style={{ color: H_RIGHT }}><FontAwesomeIcon icon={faCode} /></div>
    </div>
    <div className={s.nodeBody}>
      <div className={s.nodeLabel}>{data.label}</div>
      <div className={s.nodeSubtitle}>{data.subtitle}</div>
    </div>
  </div>
));
JsonInputNode.displayName = 'JsonInputNode';

// Sits to the RIGHT of StreamBy — output filters before response
const FilterNode = memo(({ data, selected }: NodeProps<ProcessNodeData>) => (
  <div className={`${s.customNode} ${selected ? s.nodeSelected : ''}`}>
    <Handle type="target" position={Position.Left}  id="in-filter"  className={s.handle} style={hIn(H_RIGHT)} />
    <Handle type="source" position={Position.Right} id="out-filter" className={s.handle} style={hOut(H_RIGHT)} />
    <div className={s.nodeIconBar} style={{ backgroundColor: data.bgColor }}>
      <div className={s.nodeIcon} style={{ color: data.iconColor }}><FontAwesomeIcon icon={data.icon} /></div>
    </div>
    <div className={s.nodeBody}>
      <div className={s.nodeLabel}>{data.label}</div>
      <div className={s.nodeSubtitle}>{data.subtitle}</div>
    </div>
  </div>
));
FilterNode.displayName = 'FilterNode';

// ─── Schema response computation ──────────────────────────────────────────
// Walks the saved node graph and computes a client-side preview of the response.
// Only JSON Data nodes can be evaluated here; API/DB nodes require server execution.

type SchemaNode = { id: string; type?: string; data?: Record<string, unknown> };
type SchemaEdge = { source?: string; sourceHandle?: string; target?: string; targetHandle?: string };

export function computeResponseFromSchema(
  schema: { nodes: object[]; edges: object[] } | null | undefined
): unknown {
  if (!schema) return null;
  const nodes = schema.nodes as SchemaNode[];
  const edges  = schema.edges as SchemaEdge[];

  // Collect all JSON values reachable at StreamBy's in-bottom
  const collectJsonAt = (nodeId: string, targetHandle: string): unknown[] => {
    return edges
      .filter(e => e.target === nodeId && e.targetHandle === targetHandle)
      .flatMap(edge => {
        const src = nodes.find(n => n.id === edge.source);
        if (!src) return [];
        if (src.type === 'jsonInputNode') {
          try { return [JSON.parse((src.data?.jsonString as string) || '{}')] ; }
          catch { return []; }
        }
        return []; // API/DataSource: not evaluable client-side
      });
  };

  const dataLayer = collectJsonAt('streamby', 'in-bottom');
  if (dataLayer.length === 0) return null;

  // Multiple sources → wrap in array so each is distinct
  let result: unknown = dataLayer.length === 1 ? dataLayer[0] : dataLayer;

  // Walk filter nodes chained on StreamBy's out-right (pass-through for now)
  const walkFilters = (srcId: string, srcHandle: string): void => {
    const next = edges.find(e => e.source === srcId && e.sourceHandle === srcHandle);
    if (!next?.target) return;
    const filterNode = nodes.find(n => n.id === next.target);
    if (filterNode?.type === 'filterNode') {
      // Future: apply actual filter logic from filterNode.data
      walkFilters(next.target, 'out-filter');
    }
  };
  walkFilters('streamby', 'out-right');

  return result;
}

const nodeTypes = {
  clientNode: ClientNode,
  streambyNode: StreamByNode,
  dataSourceNode: DataSourceNode,
  jsonInputNode: JsonInputNode,
  apiConnectionNode: ApiConnectionNode,
  processNode: ProcessNode,
  filterNode: FilterNode,
};

// ─── Node Palette Config ───────────────────────────────────────────────────

type PaletteItem = { type: string; label: string; subtitle: string; icon: IconDefinition; bgColor: string; iconColor: string; group: 'data' | 'process' | 'output' };

const NODE_PALETTE: PaletteItem[] = [
  // Data layer — connect to StreamBy bottom
  { type: 'dataSourceNode',    label: 'Data Source',  subtitle: 'DB collection',       icon: faDatabase,     bgColor: '#0d2a1e', iconColor: H_BOTTOM, group: 'data' },
  { type: 'jsonInputNode',     label: 'JSON Data',    subtitle: 'Static data feed',    icon: faCode,         bgColor: '#1e1403', iconColor: H_RIGHT,  group: 'data' },
  { type: 'apiConnectionNode', label: 'API',          subtitle: 'External endpoint',   icon: faGlobe,        bgColor: '#0b1e35', iconColor: H_LEFT,   group: 'data' },
  // Process layer — connect to StreamBy top
  { type: 'processNode',       label: 'Transform',    subtitle: 'Data transformation', icon: faArrowsRotate, bgColor: '#0e1f35', iconColor: '#60a5fa', group: 'process' },
  { type: 'processNode',       label: 'Auth',         subtitle: 'Authentication',      icon: faKey,          bgColor: '#1e1030', iconColor: H_TOP,    group: 'process' },
  { type: 'processNode',       label: 'Custom',       subtitle: 'Custom step',         icon: faWrench,       bgColor: '#251a0a', iconColor: H_RIGHT,  group: 'process' },
  // Output layer — connect to StreamBy right
  { type: 'filterNode',        label: 'Filter',       subtitle: 'Output filter',       icon: faFilter,       bgColor: '#1a1200', iconColor: H_RIGHT,  group: 'output' },
  { type: 'filterNode',        label: 'Transform',    subtitle: 'Output transform',    icon: faArrowRight,   bgColor: '#1a1200', iconColor: H_RIGHT,  group: 'output' },
];

const PALETTE_GROUPS: { key: PaletteItem['group']; label: string; color: string }[] = [
  { key: 'data',    label: 'Data',    color: H_BOTTOM },
  { key: 'process', label: 'Process', color: H_TOP },
  { key: 'output',  label: 'Output',  color: H_RIGHT },
];

// ─── Edge color per connection type ───────────────────────────────────────

const edgeColorForSource = (sourceHandle: string | null | undefined, srcType: string): string => {
  if (srcType === 'jsonInputNode') return H_RIGHT;
  if (sourceHandle === 'out-top' || sourceHandle === 'out-process') return H_TOP;
  if (sourceHandle === 'out-bottom' || sourceHandle === 'out-stream') return H_BOTTOM;
  if (sourceHandle === 'out-right' && srcType === 'streambyNode') return H_RIGHT;
  return H_LEFT;
};

// ─── Types ─────────────────────────────────────────────────────────────────

interface DetailField {
  key: string; label: string; value: string;
  editable?: boolean; inputType?: 'text' | 'checkbox' | 'json' | 'select';
  options?: { value: string; label: string }[];
}
interface NodeDetail { title: string; description: string; fields: DetailField[]; }

// ─── NodeViewer ────────────────────────────────────────────────────────────

export interface NodeViewerProps {
  exportDetails: Export;
  editMode?: boolean;
  onSave?: (updates: Record<string, string | boolean | object | null>) => void;
  onChange?: (schema: { nodes: Node[]; edges: Edge[] }) => void;
  apiConnections?: ApiConnection[];
  projectId?: string;
}

export interface NodeViewerHandle {
  getSchema: () => { nodes: Node[]; edges: Edge[] };
}

const CORE_NODE_IDS = ['client', 'streamby'];

export const NodeViewer = forwardRef<NodeViewerHandle, NodeViewerProps>(({
  exportDetails, editMode = false, onSave, onChange, apiConnections = [], projectId,
}, ref) => {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [localData, setLocalData] = useState<Record<string, string | boolean>>({});
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [connFetching, setConnFetching] = useState(false);
  const [connResult, setConnResult] = useState<unknown>(null);
  const [connError, setConnError] = useState<string | null>(null);

  const initialJsonRef = useRef(exportDetails.json);
  const initialApiRef = useRef({ apiUrl: exportDetails.apiUrl, credentialId: exportDetails.credentialId });
  const apiConnectionsRef = useRef(apiConnections);
  const initialSchemaRef = useRef(exportDetails.nodeSchema);

  const initialNodes = useMemo((): Node[] => {
    if (initialSchemaRef.current?.nodes) return initialSchemaRef.current.nodes as Node[];

    const nodes: Node[] = [
      { id: 'client',   type: 'clientNode',   position: { x: 0,   y: 100 }, data: { label: 'Client',   subtitle: exportDetails.method || 'GET' } },
      { id: 'streamby', type: 'streambyNode',  position: { x: 240, y: 100 }, data: { label: 'StreamBy', subtitle: 'Middleware' } },
    ];

    if (initialJsonRef.current) {
      nodes.push({ id: 'json-input', type: 'jsonInputNode', position: { x: 240, y: 320 }, data: { label: 'JSON Data', subtitle: 'Static data source', jsonString: JSON.stringify(initialJsonRef.current, null, 2) } });
    }
    if (initialApiRef.current.apiUrl) {
      const conn = apiConnectionsRef.current.find(c => c.apiUrl === initialApiRef.current.apiUrl);
      nodes.push({ id: 'api-conn', type: 'apiConnectionNode', position: { x: 240, y: 320 }, data: { label: conn?.name || 'API Connection', subtitle: initialApiRef.current.apiUrl || '', connectionId: conn?.id || '' } });
    }
    return nodes;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const initialEdges = useMemo((): Edge[] => {
    if (initialSchemaRef.current?.edges) return initialSchemaRef.current.edges as Edge[];

    const edges: Edge[] = [{
      id: 'e-client-streamby', source: 'client', sourceHandle: 'out-right',
      target: 'streamby', targetHandle: 'in-left',
      animated: true, style: { stroke: H_LEFT, strokeWidth: 2 },
    }];

    if (initialJsonRef.current) {
      edges.push({ id: 'e-json-streamby', source: 'json-input', sourceHandle: 'out-right', target: 'streamby', targetHandle: 'in-bottom', animated: true, style: { stroke: H_RIGHT, strokeWidth: 2 } });
    }
    if (initialApiRef.current.apiUrl) {
      edges.push(
        { id: 'e-streamby-api', source: 'streamby', sourceHandle: 'out-bottom', target: 'api-conn', targetHandle: 'in-stream', animated: true, style: { stroke: H_BOTTOM, strokeWidth: 2 } },
        { id: 'e-api-streamby', source: 'api-conn', sourceHandle: 'out-stream', target: 'streamby', targetHandle: 'in-bottom', animated: true, style: { stroke: H_BOTTOM, strokeWidth: 2 } },
      );
    }
    return edges;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const CONNECTOR_TYPES = ['apiConnectionNode', 'dataSourceNode'];
  const visibleNodes = useMemo(() => {
    if (editMode) return nodes;
    const connected = new Set(edges.flatMap(e => [e.source, e.target].filter(Boolean) as string[]));
    return nodes.filter(n => !CONNECTOR_TYPES.includes(n.type ?? '') || connected.has(n.id));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editMode, nodes, edges]);

  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  useEffect(() => { onChangeRef.current?.({ nodes, edges }); }, [nodes, edges]);

  useImperativeHandle(ref, () => ({ getSchema: () => ({ nodes, edges }) }), [nodes, edges]);

  // ─── Connection validation ─────────────────────────────────────────────

  const isValidConnection = useCallback((conn: Connection): boolean => {
    const src = nodes.find(n => n.id === conn.source);
    const tgt = nodes.find(n => n.id === conn.target);
    if (!src || !tgt || src.id === tgt.id) return false;

    const sh = conn.sourceHandle;
    const th = conn.targetHandle;
    const st = src.type ?? '';
    const tt = tgt.type ?? '';

    // Client → StreamBy left input
    if (st === 'clientNode' && tt === 'streambyNode')  return th === 'in-left';

    // StreamBy top ↔ ProcessNode bottom
    if (st === 'streambyNode' && tt === 'processNode') return sh === 'out-top';
    if (st === 'processNode'  && tt === 'streambyNode') return th === 'in-top';

    // StreamBy bottom ↔ DataSource/API top
    if (st === 'streambyNode' && (tt === 'dataSourceNode' || tt === 'apiConnectionNode')) return sh === 'out-bottom';
    if ((st === 'dataSourceNode' || st === 'apiConnectionNode') && tt === 'streambyNode') return th === 'in-bottom';

    // JsonInput → DataSource left or StreamBy bottom
    if (st === 'jsonInputNode' && tt === 'dataSourceNode')    return th === 'in-json';
    if (st === 'jsonInputNode' && tt === 'streambyNode')      return th === 'in-bottom';

    // StreamBy right → FilterNode left
    if (st === 'streambyNode' && tt === 'filterNode')  return sh === 'out-right';

    // FilterNode can chain to another FilterNode
    if (st === 'filterNode'   && tt === 'filterNode')  return sh === 'out-filter' && th === 'in-filter';

    return false;
  }, [nodes]);

  const onConnect = useCallback((connection: Connection) => {
    const src = nodes.find(n => n.id === connection.source);
    const color = edgeColorForSource(connection.sourceHandle, src?.type ?? '');
    setEdges(prev => addEdge({ ...connection, animated: true, style: { stroke: color, strokeWidth: 2 } }, prev));
  }, [nodes, setEdges]);

  const addNode = useCallback((config: PaletteItem) => {
    const id = `${config.type}-${Date.now()}`;
    const pos = config.group === 'process' ? { x: 240 + Math.random() * 60, y: -80 + Math.random() * 40 }
              : config.group === 'output'  ? { x: 520 + Math.random() * 60, y: 100 + Math.random() * 40 }
              : /* data */                   { x: 240 + Math.random() * 60, y: 300 + Math.random() * 40 };
    setNodes(prev => [...prev, {
      id, type: config.type, position: pos,
      data: { label: config.label, subtitle: config.subtitle, icon: config.icon, bgColor: config.bgColor, iconColor: config.iconColor, ...(config.type === 'jsonInputNode' ? { jsonString: '{}' } : {}) },
    }]);
  }, [setNodes]);

  // ─── Detail panel ─────────────────────────────────────────────────────

  const getNodeDetail = useCallback((nodeId: string | null): NodeDetail | null => {
    if (!nodeId) return null;
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return null;

    if (nodeId === 'client') return {
      title: 'Client',
      description: 'Consumer making requests to this StreamBy endpoint.',
      fields: [
        { key: 'method',   label: 'HTTP Method', value: exportDetails.method || 'GET' },
        { key: 'endpoint', label: 'Endpoint',    value: `/streamby/${exportDetails.projectId}/get-export/${exportDetails.name}` },
      ],
    };

    if (nodeId === 'streamby') return {
      title: 'StreamBy Middleware',
      description: 'Core engine. Connect data sources below, process nodes above, and output filters to the right.',
      fields: [
        { key: 'private',       label: 'Private',          value: exportDetails.private ? 'Yes' : 'No', editable: true, inputType: 'checkbox' },
        { key: 'allowedOrigin', label: 'Allowed Origins',  value: exportDetails.allowedOrigin?.join(', ') || '*' },
      ],
    };

    if (node.type === 'jsonInputNode') return {
      title: 'JSON Data',
      description: 'Static JSON that feeds the data layer. Connect its output to a Data Source or directly to StreamBy bottom.',
      fields: editMode
        ? [{ key: 'jsonString', label: 'JSON Content', value: node.data.jsonString || '{}', editable: true, inputType: 'json' as const }]
        : [],
    };

    if (node.type === 'apiConnectionNode') {
      const options = apiConnections.map(c => ({ value: c.id, label: `${c.name} — ${c.apiUrl}` }));
      return {
        title: 'API Connection',
        description: 'External API that StreamBy queries via the data layer.',
        fields: [{ key: 'connectionId', label: 'Connection', value: node.data.connectionId || '', editable: true, inputType: 'select', options }],
      };
    }

    if (node.type === 'dataSourceNode') return {
      title: 'Data Source',
      description: 'Database collection used by this export.',
      fields: [
        { key: 'label',    label: 'Name',       value: node.data.label,    editable: true, inputType: 'text' },
        { key: 'subtitle', label: 'Collection', value: node.data.subtitle, editable: true, inputType: 'text' },
      ],
    };

    if (node.type === 'processNode') return {
      title: node.data.label,
      description: 'Processing step applied to data before it reaches the output layer.',
      fields: [
        { key: 'label',    label: 'Name',        value: node.data.label,    editable: true, inputType: 'text' },
        { key: 'subtitle', label: 'Description', value: node.data.subtitle, editable: true, inputType: 'text' },
      ],
    };

    if (node.type === 'filterNode') return {
      title: node.data.label,
      description: 'Output filter applied to the response before it reaches the client.',
      fields: [
        { key: 'label',    label: 'Name',        value: node.data.label,    editable: true, inputType: 'text' },
        { key: 'subtitle', label: 'Description', value: node.data.subtitle, editable: true, inputType: 'text' },
      ],
    };

    return null;
  }, [exportDetails, nodes, apiConnections, editMode]);

  const selectedDetail = getNodeDetail(selectedNodeId);
  const selectedNode   = nodes.find(n => n.id === selectedNodeId) ?? null;
  const hasChanges     = Object.keys(localData).length > 0;
  const isJsonNode     = selectedNode?.type === 'jsonInputNode';
  const isApiNode      = selectedNode?.type === 'apiConnectionNode';
  const isCoreNode     = selectedNodeId !== null && CORE_NODE_IDS.includes(selectedNodeId);
  const canSave        = editMode && hasChanges && (isJsonNode || isApiNode || !isCoreNode || !!onSave);

  const resetConnFetch = () => { setConnFetching(false); setConnResult(null); setConnError(null); };
  const handleNodeClick   = useCallback((_: React.MouseEvent, node: Node) => { setSelectedNodeId(node.id); setLocalData({}); setJsonError(null); resetConnFetch(); }, []);
  const handleClosePanel  = useCallback(() => { setSelectedNodeId(null); setLocalData({}); setJsonError(null); resetConnFetch(); }, []);
  const handleFieldChange = useCallback((key: string, value: string | boolean) => { setLocalData(prev => ({ ...prev, [key]: value })); if (key === 'jsonString') setJsonError(null); }, []);

  const handleSave = useCallback(() => {
    if (!selectedNodeId) return;
    const node = nodes.find(n => n.id === selectedNodeId);

    if (node?.type === 'jsonInputNode') {
      const jsonStr = (localData.jsonString as string) ?? node.data.jsonString ?? '{}';
      try {
        JSON.parse(jsonStr);
        setNodes(prev => prev.map(n => n.id === selectedNodeId ? { ...n, data: { ...n.data, jsonString: jsonStr } } : n));
        setJsonError(null); setLocalData({}); setSelectedNodeId(null);
      } catch { setJsonError('JSON inválido — verifica la sintaxis.'); }
      return;
    }

    if (node?.type === 'apiConnectionNode') {
      const connId = (localData.connectionId as string) ?? node.data.connectionId;
      const conn = apiConnections.find(c => c.id === connId);
      if (conn) setNodes(prev => prev.map(n => n.id === selectedNodeId ? { ...n, data: { ...n.data, label: conn.name, subtitle: conn.apiUrl, connectionId: conn.id } } : n));
      setLocalData({}); setSelectedNodeId(null);
      return;
    }

    if (!CORE_NODE_IDS.includes(selectedNodeId)) {
      setNodes(prev => prev.map(n => n.id === selectedNodeId ? { ...n, data: { ...n.data, ...localData } } : n));
    } else if (onSave) {
      onSave(localData as Record<string, string | boolean>);
    }
    setLocalData({}); setSelectedNodeId(null);
  }, [selectedNodeId, localData, nodes, apiConnections, onSave, setNodes]);

  const handleConnFetch = useCallback(async () => {
    if (!projectId || !selectedNodeId) return;
    const node = nodes.find(n => n.id === selectedNodeId);
    const connectionId = (node?.data?.connectionId as string) ?? '';
    if (!connectionId) return;
    setConnFetching(true);
    setConnError(null);
    try {
      const result = await getConnectionResponse(projectId, connectionId);
      setConnResult(result);
    } catch (err: unknown) {
      setConnError((err as { message: string }).message || 'Fetch failed.');
    } finally {
      setConnFetching(false);
    }
  }, [projectId, selectedNodeId, nodes]);

  const getFieldDisplayValue = (field: DetailField): string | boolean => {
    if (localData[field.key] !== undefined) return localData[field.key];
    if (field.inputType === 'checkbox') return field.value === 'Yes';
    return field.value;
  };

  return (
    <div className={`${s.wrapper} ${editMode ? s.wrapperEditMode : ''}`}>
      <div className={s.canvasArea}>

        {editMode && (
          <div className={s.palette}>
            <span className={s.paletteLabel}><FontAwesomeIcon icon={faPlus} /> Add</span>
            {PALETTE_GROUPS.map(group => (
              <React.Fragment key={group.key}>
                <span className={s.paletteGroupLabel} style={{ color: group.color }}>{group.label}</span>
                {NODE_PALETTE.filter(p => p.group === group.key).map(config => (
                  <button
                    key={`${config.type}-${config.label}`} type="button"
                    className={s.paletteBtn} onClick={() => addNode(config)}
                    title={`Add ${config.label} node`}
                  >
                    <span className={s.paletteBtnIcon} style={{ color: config.iconColor, backgroundColor: config.bgColor }}>
                      <FontAwesomeIcon icon={config.icon} />
                    </span>
                    {config.label}
                  </button>
                ))}
              </React.Fragment>
            ))}
          </div>
        )}

        <div className={s.flowContainer}>
          <ReactFlow
            nodes={visibleNodes} edges={edges}
            onNodeClick={handleNodeClick}
            onNodesChange={editMode ? onNodesChange : () => {}}
            onEdgesChange={editMode ? onEdgesChange : () => {}}
            onConnect={editMode ? onConnect : undefined}
            isValidConnection={editMode ? isValidConnection : undefined}
            nodeTypes={nodeTypes}
            nodesDraggable={editMode} nodesConnectable={editMode}
            elementsSelectable deleteKeyCode={editMode ? 'Delete' : null}
            fitView fitViewOptions={{ padding: 0.35 }}
          >
            <Background variant={BackgroundVariant.Dots} color="var(--color-dark-400)" gap={22} size={1} />
            <Controls showInteractive={false} />
          </ReactFlow>
        </div>

        {selectedDetail && (
          <div className={s.detailPanel}>
            <div className={s.detailHeader}>
              <span className={s.detailTitle}>{selectedDetail.title}</span>
              <button className={s.panelClose} onClick={handleClosePanel} type="button"><FontAwesomeIcon icon={faXmark} /></button>
            </div>

            <p className={s.detailDescription}>{selectedDetail.description}</p>
            {selectedDetail.fields.length > 0 && <div className={s.detailFields}>
              {selectedDetail.fields.map(field => (
                <div key={field.key} className={s.detailField}>
                  <span className={s.fieldLabel}>{field.label}</span>
                  {editMode && field.editable ? (
                    field.inputType === 'checkbox' ? (
                      <label className={s.checkboxRow}>
                        <input type="checkbox" checked={Boolean(getFieldDisplayValue(field))} onChange={e => handleFieldChange(field.key, e.target.checked)} className={s.fieldCheckbox} />
                        <span className={s.checkboxLabel}>{getFieldDisplayValue(field) ? 'Enabled' : 'Disabled'}</span>
                      </label>
                    ) : field.inputType === 'json' ? (
                      <JsonEditor
                        value={String(getFieldDisplayValue(field))}
                        onChange={(jsonString) => handleFieldChange(field.key, jsonString)}
                        jsonError={jsonError}
                      />
                    ) : field.inputType === 'select' && field.options?.length ? (
                      <select value={String(getFieldDisplayValue(field))} onChange={e => handleFieldChange(field.key, e.target.value)} className={s.fieldSelect}>
                        <option value="">Select connection…</option>
                        {field.options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                      </select>
                    ) : (
                      <input type="text" defaultValue={String(getFieldDisplayValue(field))} onChange={e => handleFieldChange(field.key, e.target.value)} className={s.fieldInput} placeholder={field.label} />
                    )
                  ) : (
                    <span className={s.fieldValue}>{field.value}</span>
                  )}
                </div>
              ))}
            </div>}
            {jsonError && <p className={s.jsonError}>{jsonError}</p>}

            {isJsonNode && (() => {
              const raw = (localData.jsonString as string) ?? (selectedNode?.data?.jsonString as string) ?? '{}';
              let parsed: unknown = null;
              try { parsed = JSON.parse(raw); } catch { /* invalid */ }
              return parsed != null ? (
                <div className={s.jsonPreviewSection}>
                  <div className={s.previewHeader}>
                    <span className={s.fieldLabel}>Preview</span>
                  </div>
                  <div className={s.jsonPre}><JsonViewer data={parsed as JSON} /></div>
                </div>
              ) : null;
            })()}

            {isApiNode && projectId && (
              <div className={s.jsonPreviewSection}>
                <div className={s.previewHeader}>
                  <span className={s.fieldLabel}>Response</span>
                  <button
                    type="button"
                    className={s.fetchButton}
                    onClick={handleConnFetch}
                    disabled={connFetching || !((selectedNode?.data?.connectionId as string) ?? '')}
                  >
                    <FontAwesomeIcon icon={faArrowsRotate} spin={connFetching} />
                    {connFetching ? 'Fetching…' : 'Fetch'}
                  </button>
                </div>
                {connError && <p className={s.previewError}>{connError}</p>}
                {connResult != null
                  ? <div className={s.jsonPre}><JsonViewer data={connResult as JSON} /></div>
                  : !connError && <p className={s.jsonEmptyNote}>Click Fetch to preview the API response.</p>
                }
              </div>
            )}

            {canSave && (
              <div className={s.panelActions}>
                <button className={s.saveButton} onClick={handleSave} type="button"><FontAwesomeIcon icon={faFloppyDisk} /> Save Changes</button>
              </div>
            )}
            {editMode && isCoreNode && !onSave && (
              <div className={s.editHint}><FontAwesomeIcon icon={faInfoCircle} /><span>Reposiciona y conecta nodos en modo edición.</span></div>
            )}
          </div>
        )}
      </div>
    </div>
  );
});

NodeViewer.displayName = 'NodeViewer';
