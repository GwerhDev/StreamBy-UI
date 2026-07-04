import React, { useState, useCallback, useEffect, useMemo, useRef, forwardRef, useImperativeHandle } from 'react';
import { DropdownInput } from '../Inputs/DropdownInput';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../../../store';
import { setCurrentProject } from '../../../store/currentProjectSlice';
import { getConnectionResponse, createApiConnection, updateApiConnection } from '../../../services/connections';
import { createCredential } from '../../../services/projects';
import JsonViewer from '../JsonViewer/JsonViewer';
import { JsonEditor } from '../JsonEditor/JsonEditor';
import ReactFlow, {
  Background,
  BackgroundVariant,
  Controls,
  Edge,
  Node,
  useNodesState,
  useEdgesState,
  useReactFlow,
  ReactFlowProvider,
  addEdge,
  Connection,
} from 'reactflow';
import 'reactflow/dist/style.css';
import s from './NodeViewer.module.css';
import { Export, ApiConnection, DbConnection } from '../../../interfaces';
import { fetchRecords, fetchBuiltinDatabases, fetchTables } from '../../../services/database';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faDatabase, faGlobe, faXmark, faFloppyDisk,
  faInfoCircle, faArrowsRotate, faFilter,
  faPlus, faCode, faGear, faUser, faWrench,
  faChevronRight,
  faChevronLeft,
} from '@fortawesome/free-solid-svg-icons';
import { nodeTypes as NODE_TYPES, H_LEFT, H_BOTTOM, H_RIGHT } from './nodes/nodeTypes';
import { PaletteItem, edgeColorForSource, getPaletteForMode, getGroupsForMode } from './nodePalette';
import { ResponsePreview } from '../Exports/ResponsePreview';
export { computeResponseFromSchema } from './nodeSchema';

// ─── Filter Node Config ────────────────────────────────────────────────────

interface FilterCondition { field: string; op: string; value: string; }
export interface FilterNodeConfig {
  conditions?: FilterCondition[];
  includeFields?: string[];
  renameFields?: Array<{ from: string; to: string }>;
  wrapKey?: string;
  limit?: number;
}

const EMPTY_FILTER_CONFIG: FilterNodeConfig = {
  conditions: [], includeFields: [], renameFields: [], wrapKey: '', limit: undefined,
};

const CONDITION_OPS = [
  { value: 'eq', label: '= equals' },
  { value: 'neq', label: '≠ not equals' },
  { value: 'gt', label: '> greater than' },
  { value: 'lt', label: '< less than' },
  { value: 'gte', label: '>= ≥' },
  { value: 'lte', label: '<= ≤' },
  { value: 'contains', label: '⊃ contains' },
  { value: 'startsWith', label: '▷ starts with' },
  { value: 'endsWith', label: '◁ ends with' },
];

// ─── Types ─────────────────────────────────────────────────────────────────

interface DetailField {
  key: string; label: string; value: string; displayValue?: string;
  editable?: boolean; disabled?: boolean; inputType?: 'text' | 'checkbox' | 'json' | 'select';
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
  dbConnections?: DbConnection[];
  projectId?: string;
  canvasOverlay?: React.ReactNode;
}

export interface NodeViewerHandle {
  getSchema: () => { nodes: Node[]; edges: Edge[] };
}

const CORE_NODE_IDS = ['client', 'request', 'response', 'streamby'];
const HTTP_METHODS = ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'].map(m => ({ value: m, label: m }));
const CREATE_NEW_SENTINEL = '__create_new__';
const CREATE_CRED_SENTINEL = '__create_cred__';

const NodeViewerInner = forwardRef<NodeViewerHandle, NodeViewerProps>(({
  exportDetails, editMode = false, onSave, onChange, apiConnections = [], dbConnections = [], projectId, canvasOverlay,
}, ref) => {
  const { screenToFlowPosition } = useReactFlow();
  const dispatch = useDispatch<AppDispatch>();
  const sessionUserId = useSelector((state: RootState) => state.session.userId ?? state.session.username);
  const workspaceMode = useSelector((state: RootState) => state.session.mode ?? 'developer');
  const currentProject = useSelector((state: RootState) => state.currentProject.data);

  const activePalette = getPaletteForMode(workspaceMode);
  const activeGroups = getGroupsForMode(workspaceMode);

  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [localData, setLocalData] = useState<Record<string, string | boolean>>({});
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [connFetching, setConnFetching] = useState(false);
  const [connResult, setConnResult] = useState<unknown>(null);
  const [connError, setConnError] = useState<string | null>(null);
  const [showJsonModal, setShowJsonModal] = useState(false);
  const [modalJsonValue, setModalJsonValue] = useState('{}');
  const [modalJsonValid, setModalJsonValid] = useState(true);
  const [builtinDbs, setBuiltinDbs] = useState<{ name: string; value: string }[]>([]);
  const [panelTables, setPanelTables] = useState<string[]>([]);
  const [panelTablesLoading, setPanelTablesLoading] = useState(false);
  const [panelRecords, setPanelRecords] = useState<Array<{ id: string; label: string }>>([]);
  const [panelRecordsLoading, setPanelRecordsLoading] = useState(false);
  const [paletteCollapsed, setPaletteCollapsed] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [configModalData, setConfigModalData] = useState({ private: false, allowedOrigin: '*', devMode: false, devPorts: '3000, 5173, 8080, 4200' });
  const [filterModalConfig, setFilterModalConfig] = useState<FilterNodeConfig>({ ...EMPTY_FILTER_CONFIG });
  const [includeFieldsText, setIncludeFieldsText] = useState('');
  const [filterModalLabel, setFilterModalLabel] = useState('');
  const [filterModalSubtitle, setFilterModalSubtitle] = useState('');
  const [showResponsePreviewModal, setShowResponsePreviewModal] = useState(false);
  const [showClientModal, setShowClientModal] = useState(false);
  const [clientModalData, setClientModalData] = useState({ name: '', description: '', method: 'GET' });
  const [showDataSourceModal, setShowDataSourceModal] = useState(false);
  const [showApiModal, setShowApiModal] = useState(false);
  const [apiCreateName, setApiCreateName] = useState('');
  const [apiCreateUrl, setApiCreateUrl] = useState('');
  const [apiCreateMethod, setApiCreateMethod] = useState('GET');
  const [apiCreating, setApiCreating] = useState(false);
  const [showCredentialModal, setShowCredentialModal] = useState(false);
  const [credPickId, setCredPickId] = useState('');
  const [credCreateKey, setCredCreateKey] = useState('');
  const [credCreateValue, setCredCreateValue] = useState('');
  const [credCreating, setCredCreating] = useState(false);
  const [showNodeLabelModal, setShowNodeLabelModal] = useState(false);
  const [nodeLabelModalData, setNodeLabelModalData] = useState({ label: '', subtitle: '' });

  // Built-in DBs + external connections combined
  const allDbConnections: DbConnection[] = useMemo(() => {
    const builtins: DbConnection[] = builtinDbs.map(db => ({
      id: db.name,
      name: db.name,
      dbType: db.value === 'sql' ? 'postgresql' : 'mongodb',
      isBuiltin: true,
      credentialId: '',
      projectId: projectId ?? '',
    }));
    return [...builtins, ...dbConnections];
  }, [builtinDbs, dbConnections, projectId]);

  // Fetch built-in DBs once
  useEffect(() => {
    if (projectId) fetchBuiltinDatabases().then(setBuiltinDbs);
  }, [projectId]);

  const initialJsonRef = useRef(exportDetails.json);
  const initialApiRef = useRef({ apiUrl: exportDetails.apiUrl, credentialId: exportDetails.credentialId });
  const apiConnectionsRef = useRef(apiConnections);
  const credentialsRef = useRef(currentProject?.credentials ?? []);
  const initialSchemaRef = useRef(exportDetails.nodeSchema);

  const initialNodes = useMemo((): Node[] => {
    const schemaEdges = (initialSchemaRef.current?.edges ?? []) as Edge[];

    const base: Node[] = initialSchemaRef.current?.nodes
      ? [...(initialSchemaRef.current.nodes as Node[])]
      : (() => {
          const nodes: Node[] = [
            { id: 'request',  type: 'requestNode',  position: { x: 0,   y: 100 }, data: { label: 'Request',  subtitle: exportDetails.method || 'GET' } },
            { id: 'streamby', type: 'streambyNode', position: { x: 280, y: 100 }, data: { label: 'StreamBy', subtitle: 'Middleware' } },
            { id: 'response', type: 'responseNode', position: { x: 560, y: 100 }, data: { label: 'Response', subtitle: 'HTTP Response' } },
          ];
          if (initialJsonRef.current) {
            nodes.push({ id: 'json-input', type: 'jsonInputNode', position: { x: 240, y: 320 }, data: { label: 'JSON Data', subtitle: 'Static data source', jsonString: JSON.stringify(initialJsonRef.current, null, 2) } });
          }
          if (initialApiRef.current.apiUrl) {
            const conn = apiConnectionsRef.current.find(c => c.apiUrl === initialApiRef.current.apiUrl);
            nodes.push({ id: 'api-conn', type: 'apiConnectionNode', position: { x: 240, y: 320 }, data: { label: conn?.name || 'API Connection', subtitle: initialApiRef.current.apiUrl || '', connectionId: conn?.id || '' } });
          }
          return nodes;
        })();

    // Auto-inject credentialNode for any apiConnectionNode whose ApiConnection already has a credentialId
    const extra: Node[] = [];
    for (const n of base) {
      if (n.type !== 'apiConnectionNode') continue;
      const connectionId = n.data.connectionId as string;
      if (!connectionId) continue;
      const conn = apiConnectionsRef.current.find(c => c.id === connectionId);
      if (!conn?.credentialId) continue;
      if (schemaEdges.some(e => e.target === n.id && e.targetHandle === 'in-credential')) continue;
      const cred = credentialsRef.current.find(c => c.id === conn.credentialId);
      extra.push({
        id: `credential-${conn.credentialId}-for-${n.id}`,
        type: 'credentialNode',
        position: { x: n.position.x - 220, y: n.position.y },
        data: { label: cred?.key ?? 'Credential', subtitle: 'Credential', credentialId: conn.credentialId },
      });
    }

    return extra.length ? [...base, ...extra] : base;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const initialEdges = useMemo((): Edge[] => {
    const schemaNodes = (initialSchemaRef.current?.nodes ?? []) as Node[];

    const base: Edge[] = initialSchemaRef.current?.edges
      ? [...(initialSchemaRef.current.edges as Edge[])]
      : (() => {
          const edges: Edge[] = [
            { id: 'e-request-streamby', source: 'request', sourceHandle: 'out-right', target: 'streamby', targetHandle: 'in-left', animated: true, style: { stroke: H_LEFT, strokeWidth: 2 } },
            { id: 'e-streamby-response', source: 'streamby', sourceHandle: 'out-right', target: 'response', targetHandle: 'in-left', animated: true, style: { stroke: H_RIGHT, strokeWidth: 2 } },
          ];
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
        })();

    // Auto-inject edges for the credential nodes injected in initialNodes
    const extra: Edge[] = [];
    for (const n of schemaNodes) {
      if (n.type !== 'apiConnectionNode') continue;
      const connectionId = n.data.connectionId as string;
      if (!connectionId) continue;
      const conn = apiConnectionsRef.current.find(c => c.id === connectionId);
      if (!conn?.credentialId) continue;
      if (base.some(e => e.target === n.id && e.targetHandle === 'in-credential')) continue;
      const credNodeId = `credential-${conn.credentialId}-for-${n.id}`;
      extra.push({
        id: `e-${credNodeId}`,
        source: credNodeId, sourceHandle: 'out-credential',
        target: n.id, targetHandle: 'in-credential',
        animated: true, style: { stroke: '#818cf8', strokeWidth: 2 },
      });
    }

    return extra.length ? [...base, ...extra] : base;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const noop = useCallback(() => { }, []);

  const visibleNodes = useMemo(() => {
    const connectorTypes = ['apiConnectionNode', 'dataSourceNode'];
    if (editMode) return nodes;
    const connected = new Set(edges.flatMap(e => [e.source, e.target].filter(Boolean) as string[]));
    return nodes.filter(n => !connectorTypes.includes(n.type ?? '') || connected.has(n.id));
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

    // Credential → API connection node
    if (st === 'credentialNode' && tt === 'apiConnectionNode') return sh === 'out-credential' && th === 'in-credential';

    // Client / Request → StreamBy left input
    if ((st === 'clientNode' || st === 'requestNode') && tt === 'streambyNode') return th === 'in-left';

    // StreamBy → Response
    if (st === 'streambyNode' && tt === 'responseNode') return sh === 'out-right' && th === 'in-left';

    // StreamBy top ↔ ProcessNode bottom
    if (st === 'streambyNode' && tt === 'processNode') return sh === 'out-top';
    if (st === 'processNode' && tt === 'streambyNode') return th === 'in-top';

    // StreamBy bottom ↔ DataSource/API top
    if (st === 'streambyNode' && (tt === 'dataSourceNode' || tt === 'apiConnectionNode')) return sh === 'out-bottom';
    if ((st === 'dataSourceNode' || st === 'apiConnectionNode') && tt === 'streambyNode') return th === 'in-bottom';

    // JsonInput → DataSource left or StreamBy bottom
    if (st === 'jsonInputNode' && tt === 'dataSourceNode') return th === 'in-json';
    if (st === 'jsonInputNode' && tt === 'streambyNode') return th === 'in-bottom';

    // StreamBy right → FilterNode left
    if (st === 'streambyNode' && tt === 'filterNode') return sh === 'out-right';

    // FilterNode can chain to another FilterNode or terminate at Response
    if (st === 'filterNode' && tt === 'filterNode') return sh === 'out-filter' && th === 'in-filter';
    if (st === 'filterNode' && tt === 'responseNode') return sh === 'out-filter' && th === 'in-left';

    // IngestNode: receives file ref from left, outputs to streamby bottom data lane
    if (st === 'streambyNode' && tt === 'ingestNode') return sh === 'out-bottom';
    if (st === 'ingestNode' && tt === 'streambyNode') return th === 'in-bottom';

    // Process-lane nodes (transcode, caption, thumbnail, render, convert, lod): same rules as processNode
    const processLaneTypes = ['transcodeNode', 'captionNode', 'thumbnailNode', 'renderJobNode', 'formatConvertNode', 'lodNode'];
    if (st === 'streambyNode' && processLaneTypes.includes(tt)) return sh === 'out-top';
    if (processLaneTypes.includes(st) && tt === 'streambyNode') return th === 'in-top';

    // CaptionNode out-captions → filterNode input lane
    if (st === 'captionNode' && tt === 'filterNode') return sh === 'out-captions' && th === 'in-filter';

    // ThumbnailNode in-asset: receives asset ref from dataSourceNode or apiConnectionNode
    if ((st === 'dataSourceNode' || st === 'apiConnectionNode') && tt === 'thumbnailNode') return sh === 'out-stream' && th === 'in-asset';

    // LodNode out-lod → filterNode (LOD manifest as output)
    if (st === 'lodNode' && tt === 'filterNode') return sh === 'out-lod' && th === 'in-filter';

    // AssetDependencyNode: data lane — same rules as dataSourceNode
    if (st === 'streambyNode' && tt === 'assetDependencyNode') return sh === 'out-bottom';
    if (st === 'assetDependencyNode' && tt === 'streambyNode') return th === 'in-bottom';

    // ReviewGateNode: process lane + right output to annotationNode
    if (st === 'streambyNode' && tt === 'reviewGateNode') return sh === 'out-top';
    if (st === 'reviewGateNode' && tt === 'streambyNode') return th === 'in-top';
    if (st === 'reviewGateNode' && tt === 'annotationNode') return sh === 'out-review' && th === 'in-review';

    // AnnotationNode: output lane (chained like filterNode)
    if (st === 'filterNode' && tt === 'annotationNode') return sh === 'out-filter' && th === 'in-filter';
    if (st === 'annotationNode' && tt === 'filterNode') return sh === 'out-filter' && th === 'in-filter';
    if (st === 'streambyNode' && tt === 'annotationNode') return sh === 'out-right' && th === 'in-filter';

    // QcCheckNode + AI process nodes: process lane — same as processNode
    const deliveryProcessTypes = ['qcCheckNode', 'transcriptionNode', 'upscaleNode', 'pipelineSuggestNode'];
    if (st === 'streambyNode' && deliveryProcessTypes.includes(tt)) return sh === 'out-top';
    if (deliveryProcessTypes.includes(st) && tt === 'streambyNode') return th === 'in-top';

    // TranscriptionNode out-transcript → filterNode / annotationNode (carries transcript file)
    if (st === 'transcriptionNode' && tt === 'filterNode') return sh === 'out-transcript' && th === 'in-filter';
    if (st === 'transcriptionNode' && tt === 'annotationNode') return sh === 'out-transcript' && th === 'in-review';

    // ProceduralAssetNode: data lane — same rules as dataSourceNode / ingestNode
    if (st === 'streambyNode' && tt === 'proceduralAssetNode') return sh === 'out-bottom';
    if (st === 'proceduralAssetNode' && tt === 'streambyNode') return th === 'in-bottom';

    // DeliverableNode and DistributionNode: output lane (chained left→right)
    const outputLaneTypes = ['filterNode', 'annotationNode', 'deliverableNode', 'distributionNode'];
    if (outputLaneTypes.includes(st) && tt === 'deliverableNode') return sh === 'out-filter' && th === 'in-filter';
    if (st === 'streambyNode' && tt === 'deliverableNode') return sh === 'out-right' && th === 'in-filter';
    if (outputLaneTypes.includes(st) && tt === 'distributionNode') return sh === 'out-filter' && th === 'in-filter';
    if (st === 'deliverableNode' && tt === 'distributionNode') return sh === 'out-filter' && th === 'in-filter';

    return false;
  }, [nodes]);

  const onEdgesDelete = useCallback((deletedEdges: Edge[]) => {
    if (!projectId) return;
    for (const edge of deletedEdges) {
      if (edge.targetHandle !== 'in-credential') continue;
      const apiNode = nodes.find(n => n.id === edge.target);
      const connectionId = (apiNode?.data?.connectionId as string) || '';
      if (connectionId) updateApiConnection(projectId, connectionId, { credentialId: '' }).catch(() => {});
    }
  }, [nodes, projectId]);

  const onConnect = useCallback((connection: Connection) => {
    const src = nodes.find(n => n.id === connection.source);
    const tgt = nodes.find(n => n.id === connection.target);
    const color = edgeColorForSource(connection.sourceHandle, src?.type ?? '');
    setEdges(prev => addEdge({ ...connection, animated: true, style: { stroke: color, strokeWidth: 2 } }, prev));
    if (src?.type === 'credentialNode' && tgt?.type === 'apiConnectionNode' && projectId) {
      const credentialId = (src.data.credentialId as string) || '';
      const connectionId = (tgt.data.connectionId as string) || '';
      if (credentialId && connectionId) {
        updateApiConnection(projectId, connectionId, { credentialId }).catch(() => {});
      }
    }
  }, [nodes, setEdges, projectId]);

  const addNode = useCallback((config: PaletteItem, position?: { x: number; y: number }) => {
    const id = `${config.type}-${crypto.randomUUID()}`;
    const pos = position ?? (
      config.group === 'process' ? { x: 240 + Math.random() * 60, y: -80 + Math.random() * 40 }
        : config.group === 'output' ? { x: 520 + Math.random() * 60, y: 100 + Math.random() * 40 }
          : { x: 240 + Math.random() * 60, y: 300 + Math.random() * 40 }
    );
    setNodes(prev => [...prev, {
      id, type: config.type, position: pos,
      data: { label: config.label, subtitle: config.subtitle, icon: config.icon, bgColor: config.bgColor, iconColor: config.iconColor, ...(config.type === 'jsonInputNode' ? { jsonString: '{}' } : {}) },
    }]);
  }, [setNodes]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    if (e.dataTransfer.types.includes('application/streamby-node')) e.preventDefault();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const raw = e.dataTransfer.getData('application/streamby-node');
    if (!raw) return;
    const config = JSON.parse(raw) as PaletteItem;
    const position = screenToFlowPosition({ x: e.clientX, y: e.clientY });
    addNode(config, position);
  }, [addNode, screenToFlowPosition]);

  // ─── Detail panel ─────────────────────────────────────────────────────

  const getNodeDetail = useCallback((nodeId: string | null): NodeDetail | null => {
    if (!nodeId) return null;
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return null;

    if (nodeId === 'client' || nodeId === 'request' || node.type === 'clientNode' || node.type === 'requestNode') return {
      title: node.type === 'requestNode' || nodeId === 'request' ? 'Request' : 'Client',
      description: 'Consumer making requests to this StreamBy endpoint.',
      fields: [
        { key: 'name', label: 'Export Name', value: exportDetails.name || '' },
        { key: 'method', label: 'HTTP Method', value: exportDetails.method || 'GET' },
        { key: 'endpoint', label: 'Endpoint', value: `/streamby/${projectId}/export/${exportDetails.name}` },
      ],
    };

    if (node.type === 'responseNode') return {
      title: 'Response',
      description: 'HTTP response sent back to the requester.',
      fields: [],
    };

    if (nodeId === 'streamby') return {
      title: 'StreamBy Middleware',
      description: 'Core engine. Connect data sources below, process nodes above, and output filters to the right.',
      fields: [
        { key: 'allowedOrigin', label: 'Allowed Origins', value: exportDetails.allowedOrigin?.join(', ') || '*' },
        { key: 'devMode', label: 'Dev Mode', value: exportDetails.devMode ? 'Enabled' : 'Disabled' },
      ],
    };

    if (node.type === 'jsonInputNode') return {
      title: 'JSON Data',
      description: 'Static JSON that feeds the data layer. Connect its output to a Data Source or directly to StreamBy bottom.',
      fields: [],
    };

    if (node.type === 'apiConnectionNode') {
      const conn = apiConnections.find(c => c.id === (node.data.connectionId as string));
      const displayValue = conn ? `${conn.name} — ${conn.apiUrl}` : ((node.data.connectionId as string) ? (node.data.connectionId as string) : 'Not configured');
      const credEdge = edges.find(e => e.target === node.id && e.targetHandle === 'in-credential');
      const credNode = credEdge ? nodes.find(n => n.id === credEdge.source) : undefined;
      const fields = [{ key: 'connectionId', label: 'Connection', value: (node.data.connectionId as string) || '', displayValue }];
      if (credNode) fields.push({ key: 'credentialId', label: 'Credential', value: (credNode.data.credentialId as string) || '', displayValue: (credNode.data.label as string) || 'Connected' });
      return {
        title: 'API Connection',
        description: 'External API that StreamBy queries via the data layer.',
        fields,
      };
    }

    if (node.type === 'credentialNode') {
      return {
        title: 'Credential',
        description: 'Project credential attached to an API connection node.',
        fields: [{ key: 'credentialId', label: 'Key', value: (node.data.credentialId as string) || '', displayValue: (node.data.label as string) || 'Not configured' }],
      };
    }

    if (node.type === 'dataSourceNode') {
      const selectedConnectionId = (node.data.connectionId as string) ?? '';
      const selectedTableName = (node.data.tableName as string) ?? '';
      const selectedRecordId = (node.data.recordId as string) ?? '';
      const connectionLabel = allDbConnections.find(c => c.id === selectedConnectionId)?.name ?? selectedConnectionId;
      const recordLabel = panelRecords.find(r => r.id === selectedRecordId)?.label ?? selectedRecordId;

      const fields: DetailField[] = [
        { key: 'connectionId', label: 'DB Connection', value: selectedConnectionId, displayValue: connectionLabel || 'Not configured' },
      ];
      if (selectedConnectionId) {
        fields.push({ key: 'tableName', label: 'Table / Collection', value: selectedTableName, displayValue: selectedTableName || 'Not selected' });
      }
      if (selectedConnectionId && selectedTableName) {
        fields.push({ key: 'recordId', label: 'Record', value: selectedRecordId, displayValue: recordLabel || 'All records' });
      }
      return {
        title: 'Data Source',
        description: 'External database table or collection used by this export.',
        fields,
      };
    }

    if (node.type === 'processNode') return {
      title: node.data.label,
      description: 'Processing step applied to data before it reaches the output layer.',
      fields: [
        { key: 'label', label: 'Name', value: node.data.label as string },
        { key: 'subtitle', label: 'Description', value: node.data.subtitle as string },
      ],
    };

    if (node.type === 'filterNode') {
      const cfg = (node.data.filterConfig as FilterNodeConfig) ?? {};
      const summary = [
        cfg.conditions?.length && `${cfg.conditions.length} condition(s)`,
        cfg.includeFields?.length && `pick ${cfg.includeFields.length} field(s)`,
        cfg.renameFields?.length && `rename ${cfg.renameFields.length} field(s)`,
        cfg.wrapKey && `wrap → "${cfg.wrapKey}"`,
        cfg.limit && `limit ${cfg.limit}`,
      ].filter(Boolean).join(' · ') || 'Not configured';
      return {
        title: node.data.label as string,
        description: summary,
        fields: [
          { key: 'label', label: 'Name', value: node.data.label as string },
          { key: 'subtitle', label: 'Description', value: node.data.subtitle as string },
        ],
      };
    }

    // ─── Phase 1 — Media Asset Pipeline ───────────────────────────────────────

    if (node.type === 'ingestNode') return {
      title: 'Ingest',
      description: 'Imports an uploaded file into the asset pipeline, extracts metadata and creates version 1.',
      fields: [
        { key: 'fileId', label: 'File ID', value: (node.data.fileId as string) || '' },
        { key: 'label', label: 'Name', value: (node.data.label as string) || '' },
        { key: 'subtitle', label: 'Description', value: (node.data.subtitle as string) || '' },
      ],
    };

    if (node.type === 'transcodeNode') return {
      title: 'Transcode',
      description: 'Converts a video or audio file. Actual encoding runs in the host worker (FFmpeg).',
      fields: [
        { key: 'fileId', label: 'File ID', value: (node.data.fileId as string) || '' },
        { key: 'codec', label: 'Output Codec', value: (node.data.codec as string) || 'h264' },
        { key: 'resolution', label: 'Resolution', value: (node.data.resolution as string) || 'original' },
        { key: 'outputFormat', label: 'Output Format', value: (node.data.outputFormat as string) || 'mp4' },
        { key: 'bitrate', label: 'Bitrate', value: (node.data.bitrate as string) || '' },
        { key: 'audioCodec', label: 'Audio Codec', value: (node.data.audioCodec as string) || 'aac' },
      ],
    };

    if (node.type === 'captionNode') return {
      title: 'Captions',
      description: 'Generates subtitle files (SRT/VTT) from a video or audio file.',
      fields: [
        { key: 'fileId', label: 'File ID', value: (node.data.fileId as string) || '' },
        { key: 'sourceLanguage', label: 'Source Language', value: (node.data.sourceLanguage as string) || 'auto' },
        { key: 'outputFormat', label: 'Output Format', value: (node.data.outputFormat as string) || 'srt' },
        { key: 'provider', label: 'Provider', value: (node.data.provider as string) || 'manual' },
      ],
    };

    if (node.type === 'thumbnailNode') return {
      title: 'Thumbnail',
      description: 'Extracts a frame or region from a video as a thumbnail image.',
      fields: [
        { key: 'fileId', label: 'File ID', value: (node.data.fileId as string) || '' },
        { key: 'timecode', label: 'Timecode', value: (node.data.timecode as string) || '00:00:01' },
        { key: 'resolution', label: 'Resolution', value: (node.data.resolution as string) || '1280x720' },
        { key: 'strategy', label: 'Strategy', value: (node.data.strategy as string) || 'timecode' },
      ],
    };

    // ─── Phase 2 — 3D & VFX Pipeline ──────────────────────────────────────────

    if (node.type === 'renderJobNode') return {
      title: 'Render Job',
      description: 'Dispatches a render task to the configured render farm (Flamenco, Deadline, etc.).',
      fields: [
        { key: 'fileId', label: 'File ID', value: (node.data.fileId as string) || '' },
        { key: 'renderer', label: 'Renderer', value: (node.data.renderer as string) || 'blender' },
        { key: 'renderFarmConnectionId', label: 'Farm Connection', value: (node.data.renderFarmConnectionId as string) || '' },
        { key: 'frameRange', label: 'Frame Range', value: (node.data.frameRange as string) || '1-1' },
        { key: 'resolution', label: 'Resolution', value: (node.data.resolution as string) || '1920x1080' },
        { key: 'samples', label: 'Samples', value: String(node.data.samples ?? 128) },
        { key: 'outputFormat', label: 'Output Format', value: (node.data.outputFormat as string) || 'png' },
      ],
    };

    if (node.type === 'formatConvertNode') return {
      title: 'Format Convert',
      description: 'Converts a 3D file between formats (FBX, OBJ, GLB, USD, USDZ, STL).',
      fields: [
        { key: 'fileId', label: 'File ID', value: (node.data.fileId as string) || '' },
        { key: 'inputFormat', label: 'Input Format', value: (node.data.inputFormat as string) || 'fbx' },
        { key: 'outputFormat', label: 'Output Format', value: (node.data.outputFormat as string) || 'glb' },
        { key: 'applyTransforms', label: 'Apply Transforms', value: String(node.data.applyTransforms ?? true) },
        { key: 'embedTextures', label: 'Embed Textures', value: String(node.data.embedTextures ?? true) },
      ],
    };

    if (node.type === 'lodNode') return {
      title: 'LOD',
      description: 'Generates multiple LOD levels for a 3D asset to optimize real-time performance.',
      fields: [
        { key: 'fileId', label: 'File ID', value: (node.data.fileId as string) || '' },
        { key: 'levels', label: 'LOD Levels', value: String(node.data.levels ?? 3) },
        { key: 'reductionRatios', label: 'Reduction Ratios', value: (node.data.reductionRatios as number[] | undefined)?.join(', ') ?? '0.5, 0.25, 0.1' },
        { key: 'algorithm', label: 'Algorithm', value: (node.data.algorithm as string) || 'quadric' },
        { key: 'outputFormat', label: 'Output Format', value: (node.data.outputFormat as string) || 'glb' },
      ],
    };

    if (node.type === 'assetDependencyNode') return {
      title: 'Asset Dependencies',
      description: 'Resolves the full dependency tree of a 3D asset (textures, materials, rigs).',
      fields: [
        { key: 'fileId', label: 'Root Asset ID', value: (node.data.fileId as string) || '' },
        { key: 'maxDepth', label: 'Max Depth', value: String(node.data.maxDepth ?? 5) },
      ],
    };

    // ─── Phase 3 — Collaboration & Review ─────────────────────────────────────

    if (node.type === 'reviewGateNode') return {
      title: 'Review Gate',
      description: 'Blocks the pipeline until the minimum number of approvals is collected.',
      fields: [
        { key: 'requiredApprovers', label: 'Required Approvers', value: String(node.data.requiredApprovers ?? 1) },
        { key: 'approverRoles', label: 'Approver Roles', value: (node.data.approverRoles as string) || '' },
        { key: 'deadlineHours', label: 'Deadline (hours)', value: String(node.data.deadlineHours ?? '') },
      ],
    };

    if (node.type === 'annotationNode') return {
      title: 'Annotations',
      description: 'Attaches frame-accurate or spatial annotations to the asset in the output lane.',
      fields: [
        { key: 'annotationType', label: 'Annotation Type', value: (node.data.annotationType as string) || 'timecoded' },
        { key: 'displayMode', label: 'Display Mode', value: (node.data.displayMode as string) || 'overlay' },
      ],
    };

    // ─── Phase 4 — Distribution & Delivery ────────────────────────────────────

    if (node.type === 'qcCheckNode') return {
      title: 'QC Check',
      description: 'Runs quality checks (resolution, bitrate, format, duration) before review or distribution.',
      fields: [
        { key: 'checks', label: 'Checks', value: (node.data.checks as string[] | undefined)?.join(', ') || '' },
        { key: 'failureAction', label: 'On Failure', value: (node.data.failureAction as string) || 'block' },
      ],
    };

    if (node.type === 'deliverableNode') return {
      title: 'Deliverable',
      description: 'Packages the pipeline output as a versioned deliverable artifact.',
      fields: [
        { key: 'deliverableType', label: 'Type', value: (node.data.deliverableType as string) || 'asset-bundle' },
        { key: 'deliverableVersion', label: 'Version', value: (node.data.deliverableVersion as string) || '1.0.0' },
        { key: 'changeNotes', label: 'Notes', value: (node.data.changeNotes as string) || '' },
      ],
    };

    if (node.type === 'distributionNode') return {
      title: 'Distribution',
      description: 'Publishes the deliverable to a platform (CDN, Steam, App Store, Google Play, itch.io).',
      fields: [
        { key: 'distributionConnectionId', label: 'Connection', value: (node.data.distributionConnectionId as string) || '' },
        { key: 'distributionTarget', label: 'Target', value: (node.data.distributionTarget as string) || 'cdnPush' },
        { key: 'channel', label: 'Channel', value: (node.data.channel as string) || '' },
        { key: 'autoPublish', label: 'Auto-publish', value: String(node.data.autoPublish ?? false) },
      ],
    };

    // ─── Phase 5 — AI-Augmented Production ────────────────────────────────────

    if (node.type === 'transcriptionNode') return {
      title: 'Transcription',
      description: 'Converts speech in a video or audio file to text using an AI provider.',
      fields: [
        { key: 'fileId', label: 'File ID', value: (node.data.fileId as string) || '' },
        { key: 'provider', label: 'Provider', value: (node.data.provider as string) || 'openai' },
        { key: 'model', label: 'Model', value: (node.data.model as string) || 'whisper-1' },
        { key: 'sourceLanguage', label: 'Source Language', value: (node.data.sourceLanguage as string) || 'auto' },
        { key: 'outputFormats', label: 'Output Formats', value: (node.data.outputFormats as string) || 'srt,vtt' },
        { key: 'credentialId', label: 'Credential', value: (node.data.credentialId as string) || '' },
      ],
    };

    if (node.type === 'upscaleNode') return {
      title: 'Upscale',
      description: 'AI-powered image or video upscaling (Real-ESRGAN, Topaz, custom).',
      fields: [
        { key: 'fileId', label: 'File ID', value: (node.data.fileId as string) || '' },
        { key: 'scale', label: 'Scale', value: String(node.data.scale ?? 4) },
        { key: 'model', label: 'Model', value: (node.data.model as string) || 'real-esrgan' },
        { key: 'mode', label: 'Mode', value: (node.data.mode as string) || 'images' },
        { key: 'credentialId', label: 'Credential', value: (node.data.credentialId as string) || '' },
      ],
    };

    if (node.type === 'proceduralAssetNode') return {
      title: 'Generate Asset',
      description: 'Generates a 3D model, texture or audio clip from a prompt via an AI provider.',
      fields: [
        { key: 'assetType', label: 'Asset Type', value: (node.data.assetType as string) || '3d' },
        { key: 'provider', label: 'Provider', value: (node.data.provider as string) || 'meshy' },
        { key: 'prompt', label: 'Prompt', value: (node.data.prompt as string) || '' },
        { key: 'seed', label: 'Seed', value: String(node.data.seed ?? '') },
        { key: 'credentialId', label: 'Credential', value: (node.data.credentialId as string) || '' },
      ],
    };

    if (node.type === 'pipelineSuggestNode') return {
      title: 'AI Suggest',
      description: 'Analyses the current pipeline topology and suggests missing nodes. Remove this node after applying the suggestion.',
      fields: [],
    };

    return null;
  }, [exportDetails, nodes, edges, apiConnections, allDbConnections, panelRecords, projectId]);

  const selectedDetail = getNodeDetail(selectedNodeId);
  const selectedNode = nodes.find(n => n.id === selectedNodeId) ?? null;
  const hasChanges = Object.keys(localData).length > 0;
  const isJsonNode = selectedNode?.type === 'jsonInputNode';
  const isApiNode = selectedNode?.type === 'apiConnectionNode';
  const isDbSourceNode = selectedNode?.type === 'dataSourceNode';
  const isCredentialNode = selectedNode?.type === 'credentialNode';
  const isCoreNode = selectedNodeId !== null && CORE_NODE_IDS.includes(selectedNodeId);
  const canSave = editMode && hasChanges && !isApiNode && !isDbSourceNode && !isCredentialNode && (isJsonNode || !isCoreNode || !!onSave);
  const credentialConnected = isCredentialNode && edges.some(e => e.source === selectedNodeId && e.sourceHandle === 'out-credential');

  // Stable primitives from the saved node data — avoids re-running effects on every ReactFlow state update
  const savedNodeConnId = (selectedNode?.data?.connectionId as string) ?? '';
  const savedNodeTable = (selectedNode?.data?.tableName as string) ?? '';

  // Auto-fetch tables/collections for the selected DB connection in the DataSource panel
  useEffect(() => {
    if (!isDbSourceNode || !projectId) return;
    const connId = (localData.connectionId as string) ?? savedNodeConnId;
    if (!connId) { setPanelTables([]); return; }
    let cancelled = false;
    setPanelTablesLoading(true);
    fetchTables(projectId, connId)
      .then(tables => { if (!cancelled) setPanelTables(tables); })
      .catch(() => { if (!cancelled) setPanelTables([]); })
      .finally(() => { if (!cancelled) setPanelTablesLoading(false); });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDbSourceNode, selectedNodeId, localData.connectionId, savedNodeConnId, projectId]);

  useEffect(() => {
    if (!isDbSourceNode || !projectId) return;
    const connId = (localData.connectionId as string) ?? savedNodeConnId;
    const table = (localData.tableName as string) ?? savedNodeTable;
    if (!connId || !table) { setPanelRecords([]); return; }
    let cancelled = false;
    setPanelRecordsLoading(true);
    fetchRecords(projectId, connId, table, 200).then(records => {
      if (cancelled) return;
      setPanelRecords(records.map((r: any) => {
        const id = String(r._id ?? r.id ?? '');
        const display = r._name || r.name || r.title || r.label || r.email || r.slug || r.key;
        return { id, label: display ? `${display}` : id };
      }));
    }).catch(() => { if (!cancelled) setPanelRecords([]); })
      .finally(() => { if (!cancelled) setPanelRecordsLoading(false); });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDbSourceNode, selectedNodeId, localData.connectionId, localData.tableName, savedNodeConnId, savedNodeTable, projectId]);

  const resetConnFetch = () => { setConnFetching(false); setConnResult(null); setConnError(null); };
  const handleNodeClick = useCallback((_: React.MouseEvent, node: Node) => { setSelectedNodeId(node.id); setLocalData({}); setJsonError(null); resetConnFetch(); }, []);
  const handleClosePanel = useCallback(() => { setSelectedNodeId(null); setLocalData({}); setJsonError(null); resetConnFetch(); }, []);
  const handleFieldChange = useCallback((key: string, value: string | boolean) => { setLocalData(prev => ({ ...prev, [key]: value })); if (key === 'jsonString') setJsonError(null); }, []);

  const handleOpenJsonModal = useCallback(() => {
    const node = nodes.find(n => n.id === selectedNodeId);
    const current = (localData.jsonString as string) ?? (node?.data?.jsonString as string) ?? '{}';
    setModalJsonValue(current);
    setModalJsonValid(true);
    setShowJsonModal(true);
  }, [nodes, selectedNodeId, localData]);

  const handleJsonModalSave = useCallback(() => {
    if (!selectedNodeId) return;
    try {
      JSON.parse(modalJsonValue);
      setNodes(prev => prev.map(n =>
        n.id === selectedNodeId ? { ...n, data: { ...n.data, jsonString: modalJsonValue } } : n
      ));
      setShowJsonModal(false);
      setJsonError(null);
      setLocalData({});
      setSelectedNodeId(null);
    } catch {
      setJsonError('Invalid JSON — fix the syntax before saving.');
    }
  }, [modalJsonValue, selectedNodeId, setNodes]);

  const handleSave = useCallback(() => {
    if (!selectedNodeId) return;
    const node = nodes.find(n => n.id === selectedNodeId);

    if (node?.type === 'jsonInputNode') {
      const jsonStr = (localData.jsonString as string) ?? node.data.jsonString ?? '{}';
      try {
        JSON.parse(jsonStr);
        setNodes(prev => prev.map(n => n.id === selectedNodeId ? { ...n, data: { ...n.data, jsonString: jsonStr } } : n));
        setJsonError(null); setLocalData({});
      } catch { setJsonError('Invalid JSON — fix the syntax.'); }
      return;
    }

    if (node?.type === 'apiConnectionNode') {
      const connId = (localData.connectionId as string) ?? node.data.connectionId;
      const conn = apiConnections.find(c => c.id === connId);
      if (conn) setNodes(prev => prev.map(n => n.id === selectedNodeId ? { ...n, data: { ...n.data, label: conn.name, subtitle: conn.apiUrl, connectionId: conn.id } } : n));
      setLocalData({});
      return;
    }

    if (node?.type === 'dataSourceNode') {
      const connectionId = (localData.connectionId as string) ?? (node.data.connectionId as string) ?? '';
      const tableName = (localData.tableName as string) ?? (node.data.tableName as string) ?? '';
      const recordId = (localData.recordId as string) ?? (node.data.recordId as string) ?? '';
      const dbConn = allDbConnections.find(c => c.id === connectionId);
      setNodes(prev => prev.map(n => n.id === selectedNodeId ? {
        ...n,
        data: { ...n.data, connectionId, tableName, recordId, subtitle: tableName, ...(dbConn && { label: dbConn.name }) },
      } : n));
      setLocalData({});
      return;
    }

    if (!CORE_NODE_IDS.includes(selectedNodeId)) {
      setNodes(prev => prev.map(n => n.id === selectedNodeId ? { ...n, data: { ...n.data, ...localData } } : n));
    } else if (onSave) {
      onSave(localData as Record<string, string | boolean>);
    }
    setLocalData({});
  }, [selectedNodeId, localData, nodes, apiConnections, allDbConnections, onSave, setNodes]);

  const handleOpenApiPreview = useCallback(async () => {
    if (!projectId || !selectedNodeId) return;
    const node = nodes.find(n => n.id === selectedNodeId);
    const connectionId = (node?.data?.connectionId as string) ?? '';
    if (!connectionId) return;
    setConnResult(null);
    setConnError(null);
    setShowPreviewModal(true);
    setConnFetching(true);
    try {
      const result = await getConnectionResponse(projectId, connectionId);
      setConnResult(result);
    } catch (err: unknown) {
      setConnError((err as { message: string }).message || 'Fetch failed.');
    } finally {
      setConnFetching(false);
    }
  }, [projectId, selectedNodeId, nodes]);

  const handleOpenPreview = useCallback(async () => {
    if (!projectId || !selectedNodeId) return;
    const node = nodes.find(n => n.id === selectedNodeId);
    const connectionId = (node?.data?.connectionId as string) ?? '';
    const tableName = (node?.data?.tableName as string) ?? '';
    if (!connectionId || !tableName) return;
    setConnResult(null);
    setConnError(null);
    setShowPreviewModal(true);
    setConnFetching(true);
    try {
      const records = await fetchRecords(projectId, connectionId, tableName, 10);
      setConnResult(records);
    } catch (err: unknown) {
      setConnError((err as { message: string }).message || 'Fetch failed.');
    } finally {
      setConnFetching(false);
    }
  }, [projectId, selectedNodeId, nodes]);

  const handleOpenFilterModal = useCallback(() => {
    const node = nodes.find(n => n.id === selectedNodeId);
    const existing = (node?.data?.filterConfig as FilterNodeConfig) ?? {};
    setFilterModalConfig({
      conditions: existing.conditions ?? [],
      renameFields: existing.renameFields ?? [],
      wrapKey: existing.wrapKey ?? '',
      limit: existing.limit,
    });
    setIncludeFieldsText((existing.includeFields ?? []).join(', '));
    setFilterModalLabel((node?.data?.label as string) ?? '');
    setFilterModalSubtitle((node?.data?.subtitle as string) ?? '');
    setShowFilterModal(true);
  }, [nodes, selectedNodeId]);

  const handleOpenConfigModal = useCallback(() => {
    setConfigModalData({
      private: false,
      allowedOrigin: exportDetails.allowedOrigin?.join(', ') || '*',
      devMode: exportDetails.devMode ?? false,
      devPorts: (exportDetails.devPorts ?? [3000, 5173, 8080, 4200]).join(', '),
    });
    setShowConfigModal(true);
  }, [exportDetails]);

  const handleSaveConfigModal = useCallback(() => {
    if (!onSave) return;
    onSave({
      allowedOrigin: configModalData.allowedOrigin.split(',').map(s => s.trim()).filter(Boolean),
      devMode: configModalData.devMode,
      devPorts: configModalData.devPorts.split(',').map(s => Number(s.trim())).filter(n => !isNaN(n) && n > 0),
    });
    setShowConfigModal(false);
  }, [configModalData, onSave]);

  const handleOpenClientModal = useCallback(() => {
    setClientModalData({ name: exportDetails.name || '', description: exportDetails.description || '', method: exportDetails.method || 'GET' });
    setShowClientModal(true);
  }, [exportDetails]);

  const handleSaveClientModal = useCallback(() => {
    if (!onSave) return;
    onSave({ name: clientModalData.name, description: clientModalData.description, method: clientModalData.method });
    setShowClientModal(false);
  }, [clientModalData, onSave]);

  const handleOpenDataSourceModal = useCallback(() => {
    setLocalData({});
    setShowDataSourceModal(true);
  }, []);

  const handleSaveDataSourceModal = useCallback(() => {
    handleSave();
    setShowDataSourceModal(false);
  }, [handleSave]);

  const handleOpenCredentialModal = useCallback(() => {
    const node = nodes.find(n => n.id === selectedNodeId);
    setCredPickId((node?.data?.credentialId as string) || '');
    setCredCreateKey('');
    setCredCreateValue('');
    setShowCredentialModal(true);
  }, [nodes, selectedNodeId]);

  const handleSaveCredentialModal = useCallback(async () => {
    const node = nodes.find(n => n.id === selectedNodeId);
    if (!node || !projectId || !currentProject) return;
    let credentialId = credPickId;
    let credKey = '';
    if (credPickId === CREATE_CRED_SENTINEL) {
      if (!credCreateKey || !credCreateValue) return;
      setCredCreating(true);
      try {
        const newCred = await createCredential(projectId, credCreateKey, credCreateValue);
        const updatedCreds = [...(currentProject.credentials ?? []), newCred];
        dispatch(setCurrentProject({ ...currentProject, credentials: updatedCreds }));
        credentialsRef.current = updatedCreds;
        credentialId = newCred.id;
        credKey = newCred.key;
      } catch { setCredCreating(false); return; }
      setCredCreating(false);
    } else {
      credKey = currentProject.credentials?.find(c => c.id === credPickId)?.key ?? '';
    }
    setNodes(prev => prev.map(n => n.id === selectedNodeId
      ? { ...n, data: { ...n.data, label: credKey, credentialId } }
      : n
    ));
    const credEdge = edges.find(e => e.source === selectedNodeId && e.sourceHandle === 'out-credential');
    const apiNode = credEdge ? nodes.find(n => n.id === credEdge.target) : undefined;
    const connectionId = (apiNode?.data?.connectionId as string) || '';
    if (connectionId) {
      updateApiConnection(projectId, connectionId, { credentialId }).catch(() => {});
    }
    setCredPickId('');
    setCredCreateKey('');
    setCredCreateValue('');
    setShowCredentialModal(false);
  }, [nodes, selectedNodeId, projectId, currentProject, credPickId, credCreateKey, credCreateValue, edges, dispatch, setNodes]);

  const handleOpenApiModal = useCallback(() => {
    setLocalData({});
    setApiCreateName('');
    setApiCreateUrl('');
    setApiCreateMethod('GET');
    setShowApiModal(true);
  }, []);

  const handleSaveApiModal = useCallback(async () => {
    const connId = (localData.connectionId as string) ?? '';
    if (connId === CREATE_NEW_SENTINEL) {
      if (!apiCreateName || !apiCreateUrl || !projectId || !currentProject) return;
      setApiCreating(true);
      try {
        const newConn = await createApiConnection(projectId, { name: apiCreateName, apiUrl: apiCreateUrl, method: apiCreateMethod as 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE' });
        dispatch(setCurrentProject({ ...currentProject, apiConnections: [...(currentProject.apiConnections ?? []), newConn] }));
        setNodes(prev => prev.map(n => n.id === selectedNodeId
          ? { ...n, data: { ...n.data, label: newConn.name, subtitle: newConn.apiUrl, connectionId: newConn.id } }
          : n
        ));
      } catch { /* ignore */ } finally {
        setApiCreating(false);
      }
    } else {
      handleSave();
    }
    setLocalData({});
    setApiCreateName('');
    setApiCreateUrl('');
    setApiCreateMethod('GET');
    setShowApiModal(false);
  }, [localData, apiCreateName, apiCreateUrl, apiCreateMethod, projectId, currentProject, selectedNodeId, handleSave, dispatch, setNodes]);

  const handleOpenNodeLabelModal = useCallback(() => {
    const node = nodes.find(n => n.id === selectedNodeId);
    setNodeLabelModalData({
      label: (node?.data?.label as string) ?? '',
      subtitle: (node?.data?.subtitle as string) ?? '',
    });
    setShowNodeLabelModal(true);
  }, [nodes, selectedNodeId]);

  const handleSaveNodeLabelModal = useCallback(() => {
    if (!selectedNodeId) return;
    setNodes(prev => prev.map(n =>
      n.id === selectedNodeId
        ? { ...n, data: { ...n.data, label: nodeLabelModalData.label, subtitle: nodeLabelModalData.subtitle } }
        : n,
    ));
    setShowNodeLabelModal(false);
  }, [nodeLabelModalData, selectedNodeId, setNodes]);

  const handleFilterModalSave = useCallback(() => {
    if (!selectedNodeId) return;
    const includeFields = includeFieldsText.split(',').map(f => f.trim()).filter(Boolean);
    const clean: FilterNodeConfig = {};
    if (filterModalConfig.conditions?.length) clean.conditions = filterModalConfig.conditions;
    if (includeFields.length) clean.includeFields = includeFields;
    if (filterModalConfig.renameFields?.length) clean.renameFields = filterModalConfig.renameFields;
    if (filterModalConfig.wrapKey) clean.wrapKey = filterModalConfig.wrapKey;
    if (filterModalConfig.limit) clean.limit = filterModalConfig.limit;
    setNodes(prev => prev.map(n =>
      n.id === selectedNodeId
        ? { ...n, data: { ...n.data, filterConfig: clean, label: filterModalLabel, subtitle: filterModalSubtitle } }
        : n
    ));
    setShowFilterModal(false);
  }, [selectedNodeId, filterModalConfig, includeFieldsText, filterModalLabel, filterModalSubtitle, setNodes]);

  const getFieldDisplayValue = (field: DetailField): string | boolean => {
    if (localData[field.key] !== undefined) return localData[field.key];
    if (field.inputType === 'checkbox') return field.value === 'Yes';
    return field.value;
  };

  return (
    <>
      <div className={`${s.wrapper} ${editMode ? s.wrapperEditMode : ''}`}>
        <div className={s.canvasArea}>

          <div
            className={s.flowContainer}
            style={{ '--rp-offset': selectedDetail ? '256px' : '0px' } as React.CSSProperties}
            onDragOver={editMode ? handleDragOver : undefined}
            onDrop={editMode ? handleDrop : undefined}
          >
            <ReactFlow
              nodes={visibleNodes} edges={edges}
              onNodeClick={handleNodeClick}
              onNodesChange={editMode ? onNodesChange : noop}
              onEdgesChange={editMode ? onEdgesChange : noop}
              onEdgesDelete={editMode ? onEdgesDelete : undefined}
              onConnect={editMode ? onConnect : undefined}
              isValidConnection={editMode ? isValidConnection : undefined}
              nodeTypes={NODE_TYPES}
              nodesDraggable={editMode} nodesConnectable={editMode}
              elementsSelectable deleteKeyCode={editMode ? 'Delete' : null}
              fitView fitViewOptions={{ padding: 0.35 }}
            >
              <Background variant={BackgroundVariant.Dots} color="var(--color-surface-sunken)" gap={22} size={1} />
              <Controls showInteractive={false} />
            </ReactFlow>

            {selectedDetail && (
              <div className={s.detailPanel}>
                <div className={s.detailHeader}>
                  <span className={s.detailTitle}>{selectedDetail.title}</span>
                  <button className={s.panelClose} onClick={handleClosePanel} type="button"><FontAwesomeIcon icon={faXmark} /></button>
                </div>

                <p className={s.detailDescription}>{selectedDetail.description}</p>

                {selectedNodeId === 'streamby' && onSave && (
                  <div className={s.nodeActions}>
                    <button type="button" className={s.actionButton} onClick={handleOpenConfigModal}>
                      <FontAwesomeIcon icon={faGear} />
                      Configure
                    </button>
                  </div>
                )}

                {(selectedNodeId === 'client' || selectedNodeId === 'request' || selectedNode?.type === 'clientNode' || selectedNode?.type === 'requestNode') && onSave && editMode && (
                  <div className={s.nodeActions}>
                    <button type="button" className={s.actionButton} onClick={handleOpenClientModal}>
                      <FontAwesomeIcon icon={faGear} />
                      Configure
                    </button>
                  </div>
                )}

                {(selectedNodeId === 'response' || selectedNode?.type === 'responseNode') && projectId && (
                  <div className={s.nodeActions}>
                    <button
                      type="button"
                      className={s.actionButton}
                      onClick={() => setShowResponsePreviewModal(true)}
                      disabled={!edges.some(e => e.target === selectedNodeId)}
                    >
                      <FontAwesomeIcon icon={faArrowsRotate} />
                      Preview
                    </button>
                  </div>
                )}

                {isJsonNode && (
                  <div className={s.nodeActions}>
                    <button type="button" className={s.actionButton} onClick={handleOpenJsonModal}>
                      <FontAwesomeIcon icon={faCode} />
                      {editMode ? 'Edit JSON' : 'View JSON'}
                    </button>
                  </div>
                )}

                {(isDbSourceNode || isApiNode) && projectId && (() => {
                  const credentialed = edges.some(
                    e => e.source === 'streamby' && e.sourceHandle === 'out-bottom' && e.target === selectedNodeId,
                  );
                  const hasConnection = !!(selectedNode?.data?.connectionId as string);
                  const hasTable = !!(selectedNode?.data?.tableName as string);
                  return (
                    <div className={s.nodeActions}>
                      {editMode && credentialed && (
                        <button
                          type="button"
                          className={s.actionButton}
                          onClick={isApiNode ? handleOpenApiModal : handleOpenDataSourceModal}
                        >
                          <FontAwesomeIcon icon={faGear} />
                          Configure
                        </button>
                      )}
                      <button
                        type="button"
                        className={s.actionButton}
                        onClick={isApiNode ? handleOpenApiPreview : handleOpenPreview}
                        disabled={!credentialed || !hasConnection || (isDbSourceNode && !hasTable)}
                      >
                        <FontAwesomeIcon icon={faArrowsRotate} />
                        Preview
                      </button>
                    </div>
                  );
                })()}

                {selectedNode?.type === 'processNode' && editMode && (
                  <div className={s.nodeActions}>
                    <button type="button" className={s.actionButton} onClick={handleOpenNodeLabelModal}>
                      <FontAwesomeIcon icon={faGear} />
                      Configure
                    </button>
                  </div>
                )}

                {selectedNode?.type === 'filterNode' && editMode && (
                  <div className={s.nodeActions}>
                    <button type="button" className={s.actionButton} onClick={handleOpenFilterModal}>
                      <FontAwesomeIcon icon={faFilter} />
                      Configure
                    </button>
                  </div>
                )}

                {isCredentialNode && projectId && (
                  <div className={s.nodeActions}>
                    <button
                      type="button"
                      className={s.actionButton}
                      onClick={handleOpenCredentialModal}
                      disabled={!editMode || !credentialConnected}
                    >
                      <FontAwesomeIcon icon={faGear} />
                      Configure
                    </button>
                  </div>
                )}

                {selectedDetail.fields.length > 0 && (
                  <div className={s.detailFields}>
                    {selectedDetail.fields.map(field => (
                      <div key={field.key} className={s.detailField}>
                        <span className={s.fieldLabel}>{field.label}</span>
                        {editMode && field.editable ? (
                          field.inputType === 'checkbox' ? (
                            <label className={s.checkboxRow}>
                              <input type="checkbox" checked={Boolean(getFieldDisplayValue(field))} onChange={e => handleFieldChange(field.key, e.target.checked)} className={s.fieldCheckbox} />
                              <span className={s.checkboxLabel}>{getFieldDisplayValue(field) ? 'Enabled' : 'Disabled'}</span>
                            </label>
                          ) : field.inputType === 'select' && field.options?.length ? (
                            <DropdownInput
                              value={String(getFieldDisplayValue(field))}
                              onChange={v => handleFieldChange(field.key, v)}
                              options={field.options}
                              disabled={field.disabled}
                            />
                          ) : (
                            <input type="text" defaultValue={String(getFieldDisplayValue(field))} onChange={e => handleFieldChange(field.key, e.target.value)} className={s.fieldInput} placeholder={field.label} />
                          )
                        ) : (
                          <span className={s.fieldValue}>{field.displayValue ?? field.value}</span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                {jsonError && <p className={s.jsonError}>{jsonError}</p>}

                {canSave && (
                  <div className={s.panelActions}>
                    <button className={s.saveButton} onClick={handleSave} type="button"><FontAwesomeIcon icon={faFloppyDisk} /> Save Changes</button>
                  </div>
                )}
                {editMode && isCoreNode && !onSave && (
                  <div className={s.editHint}><FontAwesomeIcon icon={faInfoCircle} /><span>Reposition and connect nodes in edit mode.</span></div>
                )}
              </div>
            )}
            {canvasOverlay}
          </div>

          {editMode && (
            <div className={`${s.palette} ${paletteCollapsed ? s.paletteCollapsed : ''}`}>
              <button
                type="button"
                tabIndex={0}
                className={s.paletteToggle}
                onClick={() => setPaletteCollapsed(c => !c)}
                onKeyDown={e => e.key === 'Enter' && setPaletteCollapsed(c => !c)}
                title={paletteCollapsed ? 'Expand palette' : 'Collapse palette'}
              >
                <FontAwesomeIcon icon={paletteCollapsed ? faChevronLeft : faChevronRight} className={s.paletteToggleIcon} />
              </button>
              <div className={s.paletteList}>
                {activeGroups.map(group => (
                  <React.Fragment key={group.key}>
                    {!paletteCollapsed && (
                      <span className={s.paletteGroupLabel} style={{ color: group.color }}>{group.label}</span>
                    )}
                    {activePalette.filter(p => p.group === group.key).map(config => (
                      <button
                        key={`${config.type}-${config.label}`} type="button"
                        className={s.paletteBtn} onClick={() => addNode(config)}
                        title={paletteCollapsed ? `${config.label} — ${config.subtitle}` : config.subtitle}
                        draggable
                        onDragStart={e => {
                          e.dataTransfer.setData('application/streamby-node', JSON.stringify(config));
                          e.dataTransfer.effectAllowed = 'copy';
                        }}
                      >
                        <span className={s.paletteBtnIcon} style={{ color: config.iconColor, backgroundColor: config.bgColor }}>
                          <FontAwesomeIcon icon={config.icon} />
                        </span>
                        {!paletteCollapsed && config.label}
                      </button>
                    ))}
                  </React.Fragment>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>

      {showJsonModal && (
        <div className={s.modalOverlay} onClick={() => { setShowJsonModal(false); setJsonError(null); }}>
          <div className={s.modalContainer} onClick={e => e.stopPropagation()}>
            <div className={s.modalHeader}>
              <span className={s.modalTitle}>
                <FontAwesomeIcon icon={faCode} style={{ color: H_RIGHT }} />
                {editMode ? 'Edit JSON Data' : 'View JSON Data'}
              </span>
              <button className={s.panelClose} type="button" onClick={() => { setShowJsonModal(false); setJsonError(null); }}>
                <FontAwesomeIcon icon={faXmark} />
              </button>
            </div>
            <div className={s.modalBody}>
              <JsonEditor
                value={modalJsonValue}
                onChange={(jsonString, _, isValid) => {
                  setModalJsonValue(jsonString);
                  setModalJsonValid(isValid);
                }}
                jsonError={null}
                className={s.modalEditor}
                readOnly={!editMode}
                userId={sessionUserId}
                projectId={projectId}
              />
            </div>
            {jsonError && <p className={s.modalError}>{jsonError}</p>}
            <div className={s.modalFooter}>
              <button type="button" className={s.cancelButton} onClick={() => { setShowJsonModal(false); setJsonError(null); }}>
                {editMode ? 'Cancel' : 'Close'}
              </button>
              {editMode && (
                <button
                  type="button"
                  className={s.saveButton}
                  onClick={handleJsonModalSave}
                  disabled={!modalJsonValid}
                >
                  <FontAwesomeIcon icon={faFloppyDisk} /> Save Changes
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {showResponsePreviewModal && projectId && (
        <div className={s.modalOverlay} onClick={() => setShowResponsePreviewModal(false)}>
          <div className={s.modalContainer} onClick={e => e.stopPropagation()} style={{ maxWidth: 720, width: '90vw' }}>
            <div className={s.modalHeader}>
              <span className={s.modalTitle}>
                <FontAwesomeIcon icon={faArrowsRotate} style={{ color: H_RIGHT }} />
                Response Preview
              </span>
              <button className={s.panelClose} type="button" onClick={() => setShowResponsePreviewModal(false)}>
                <FontAwesomeIcon icon={faXmark} />
              </button>
            </div>
            <div className={s.modalBody}>
              <ResponsePreview
                projectId={projectId}
                schema={{ nodes: nodes as object[], edges: edges as object[] }}
              />
            </div>
            <div className={s.modalFooter}>
              <button type="button" className={s.cancelButton} onClick={() => setShowResponsePreviewModal(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {showPreviewModal && (
        <div className={s.modalOverlay} onClick={() => { setShowPreviewModal(false); setConnResult(null); setConnError(null); }}>
          <div className={s.modalContainer} onClick={e => e.stopPropagation()}>
            <div className={s.modalHeader}>
              <span className={s.modalTitle}>
                <FontAwesomeIcon icon={isApiNode ? faGlobe : faDatabase} style={{ color: isApiNode ? H_LEFT : H_BOTTOM }} />
                {isApiNode ? 'Preview Response' : 'Preview Records'}
              </span>
              <button className={s.panelClose} type="button" onClick={() => { setShowPreviewModal(false); setConnResult(null); setConnError(null); }}>
                <FontAwesomeIcon icon={faXmark} />
              </button>
            </div>
            <div className={s.modalBody}>
              {connFetching && <p className={s.jsonEmptyNote}><FontAwesomeIcon icon={faArrowsRotate} spin /> Fetching records…</p>}
              {connError && <p className={s.modalError}>{connError}</p>}
              {!connFetching && connResult != null && (
                <JsonViewer data={connResult as JSON} />
              )}
              {!connFetching && connResult == null && !connError && (
                <p className={s.jsonEmptyNote}>No records returned.</p>
              )}
            </div>
            <div className={s.modalFooter}>
              <button type="button" className={s.cancelButton} onClick={() => { setShowPreviewModal(false); setConnResult(null); setConnError(null); }}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {showConfigModal && (
        <div className={s.modalOverlay} onClick={() => setShowConfigModal(false)}>
          <div className={s.configModalContainer} onClick={e => e.stopPropagation()}>
            <div className={s.modalHeader}>
              <span className={s.modalTitle}>
                <FontAwesomeIcon icon={faGear} />
                StreamBy Configuration
              </span>
              <button className={s.panelClose} type="button" onClick={() => setShowConfigModal(false)}>
                <FontAwesomeIcon icon={faXmark} />
              </button>
            </div>

            <div className={s.configModalBody}>
              <div className={s.configRow}>
                <div className={s.configRowHeader}>
                  <div>
                    <label className={s.configLabel}>Allowed Origins</label>
                    <p className={s.configHint}>Comma-separated list of origins. Use <code>*</code> to inherit from the project settings.</p>
                  </div>
                </div>
                <input type="text" className={s.configInput}
                  value={configModalData.allowedOrigin}
                  onChange={e => setConfigModalData(p => ({ ...p, allowedOrigin: e.target.value }))}
                  placeholder="https://example.com, https://other.com" />
              </div>

              <div className={s.configRow}>
                <div className={s.configRowHeader}>
                  <div>
                    <label className={s.configLabel}>Dev Mode</label>
                    <p className={s.configHint}>Auto-allow requests from localhost on the ports below — no need to add them to allowed origins.</p>
                  </div>
                  <button
                    type="button"
                    className={`${s.toggle} ${configModalData.devMode ? s.toggleOn : ''}`}
                    onClick={() => setConfigModalData(p => ({ ...p, devMode: !p.devMode }))}
                    aria-pressed={configModalData.devMode}
                  >
                    <span className={s.toggleThumb} />
                  </button>
                </div>
                {configModalData.devMode && (
                  <input type="text" className={s.configInput}
                    value={configModalData.devPorts}
                    onChange={e => setConfigModalData(p => ({ ...p, devPorts: e.target.value }))}
                    placeholder="3000, 5173, 8080, 4200" />
                )}
              </div>
            </div>

            <div className={s.modalFooter}>
              <button type="button" className={s.cancelButton} onClick={() => setShowConfigModal(false)}>Cancel</button>
              <button type="button" className={s.saveButton} onClick={handleSaveConfigModal}>
                <FontAwesomeIcon icon={faFloppyDisk} /> Save
              </button>
            </div>
          </div>
        </div>
      )}

      {showFilterModal && (
        <div className={s.modalOverlay} onClick={() => setShowFilterModal(false)}>
          <div className={s.filterModalContainer} onClick={e => e.stopPropagation()}>
            <div className={s.modalHeader}>
              <span className={s.modalTitle}>
                <FontAwesomeIcon icon={faFilter} style={{ color: H_RIGHT }} />
                Configure {nodes.find(n => n.id === selectedNodeId)?.data?.label as string ?? 'Filter'}
              </span>
              <button className={s.panelClose} type="button" onClick={() => setShowFilterModal(false)}>
                <FontAwesomeIcon icon={faXmark} />
              </button>
            </div>

            <div className={s.filterModalBody}>
              {/* NODE LABEL */}
              <div className={s.filterSection}>
                <div className={s.filterSectionTitle}>Node Label</div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input type="text" placeholder="Name" className={s.fieldInput}
                    value={filterModalLabel}
                    onChange={e => setFilterModalLabel(e.target.value)}
                  />
                  <input type="text" placeholder="Description" className={s.fieldInput}
                    value={filterModalSubtitle}
                    onChange={e => setFilterModalSubtitle(e.target.value)}
                  />
                </div>
              </div>

              {/* CONDITIONS */}
              <div className={s.filterSection}>
                <div className={s.filterSectionTitle}>Conditions</div>
                <p className={s.filterSectionHint}>Filter array records where all conditions match.</p>
                {(filterModalConfig.conditions ?? []).map((cond, i) => (
                  <div key={i} className={s.conditionRow}>
                    <input
                      type="text" placeholder="field" value={cond.field}
                      className={s.fieldInput}
                      onChange={e => setFilterModalConfig(prev => {
                        const c = [...(prev.conditions ?? [])];
                        c[i] = { ...c[i], field: e.target.value };
                        return { ...prev, conditions: c };
                      })}
                    />
                    <select
                      value={cond.op} className={s.fieldSelect}
                      onChange={e => setFilterModalConfig(prev => {
                        const c = [...(prev.conditions ?? [])];
                        c[i] = { ...c[i], op: e.target.value };
                        return { ...prev, conditions: c };
                      })}
                    >
                      {CONDITION_OPS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                    <input
                      type="text" placeholder="value" value={cond.value}
                      className={s.fieldInput}
                      onChange={e => setFilterModalConfig(prev => {
                        const c = [...(prev.conditions ?? [])];
                        c[i] = { ...c[i], value: e.target.value };
                        return { ...prev, conditions: c };
                      })}
                    />
                    <button type="button" className={s.conditionRemoveBtn}
                      onClick={() => setFilterModalConfig(prev => ({ ...prev, conditions: (prev.conditions ?? []).filter((_, j) => j !== i) }))}>
                      <FontAwesomeIcon icon={faXmark} />
                    </button>
                  </div>
                ))}
                <button type="button" className={s.addRowBtn}
                  onClick={() => setFilterModalConfig(prev => ({ ...prev, conditions: [...(prev.conditions ?? []), { field: '', op: 'eq', value: '' }] }))}>
                  <FontAwesomeIcon icon={faPlus} /> Add condition
                </button>
              </div>

              {/* INCLUDE FIELDS */}
              <div className={s.filterSection}>
                <div className={s.filterSectionTitle}>Include Fields</div>
                <p className={s.filterSectionHint}>Comma-separated field names to include. Leave empty to include all fields.</p>
                <input
                  type="text" placeholder="e.g. name, email, status"
                  className={s.fieldInput}
                  value={includeFieldsText}
                  onChange={e => setIncludeFieldsText(e.target.value)}
                />
              </div>

              {/* RENAME FIELDS */}
              <div className={s.filterSection}>
                <div className={s.filterSectionTitle}>Rename Fields</div>
                <p className={s.filterSectionHint}>Rename output field keys.</p>
                {(filterModalConfig.renameFields ?? []).map((pair, i) => (
                  <div key={i} className={s.renameRow}>
                    <input
                      type="text" placeholder="from" value={pair.from}
                      className={s.fieldInput}
                      onChange={e => setFilterModalConfig(prev => {
                        const r = [...(prev.renameFields ?? [])];
                        r[i] = { ...r[i], from: e.target.value };
                        return { ...prev, renameFields: r };
                      })}
                    />
                    <span className={s.renameArrow}>→</span>
                    <input
                      type="text" placeholder="to" value={pair.to}
                      className={s.fieldInput}
                      onChange={e => setFilterModalConfig(prev => {
                        const r = [...(prev.renameFields ?? [])];
                        r[i] = { ...r[i], to: e.target.value };
                        return { ...prev, renameFields: r };
                      })}
                    />
                    <button type="button" className={s.conditionRemoveBtn}
                      onClick={() => setFilterModalConfig(prev => ({ ...prev, renameFields: (prev.renameFields ?? []).filter((_, j) => j !== i) }))}>
                      <FontAwesomeIcon icon={faXmark} />
                    </button>
                  </div>
                ))}
                <button type="button" className={s.addRowBtn}
                  onClick={() => setFilterModalConfig(prev => ({ ...prev, renameFields: [...(prev.renameFields ?? []), { from: '', to: '' }] }))}>
                  <FontAwesomeIcon icon={faPlus} /> Add rename
                </button>
              </div>

              {/* WRAP KEY */}
              <div className={s.filterSection}>
                <div className={s.filterSectionTitle}>Wrap in Key</div>
                <p className={s.filterSectionHint}>Wrap the entire response in an object key. E.g. "data" → {`{ data: [...] }`}</p>
                <input
                  type="text" placeholder='e.g. data'
                  className={s.fieldInput}
                  value={filterModalConfig.wrapKey ?? ''}
                  onChange={e => setFilterModalConfig(prev => ({ ...prev, wrapKey: e.target.value }))}
                />
              </div>

              {/* LIMIT */}
              <div className={s.filterSection}>
                <div className={s.filterSectionTitle}>Limit Records</div>
                <p className={s.filterSectionHint}>Truncate arrays to this many items. Leave empty for no limit.</p>
                <input
                  type="number" min={1} placeholder='e.g. 100'
                  className={s.fieldInput}
                  style={{ width: '100px' }}
                  value={filterModalConfig.limit ?? ''}
                  onChange={e => setFilterModalConfig(prev => ({ ...prev, limit: e.target.value ? Number(e.target.value) : undefined }))}
                />
              </div>
            </div>

            <div className={s.modalFooter}>
              <button type="button" className={s.cancelButton} onClick={() => setShowFilterModal(false)}>Cancel</button>
              <button type="button" className={s.saveButton} onClick={handleFilterModalSave}>
                <FontAwesomeIcon icon={faFloppyDisk} /> Save
              </button>
            </div>
          </div>
        </div>
      )}
      {showClientModal && (
        <div className={s.modalOverlay} onClick={() => setShowClientModal(false)}>
          <div className={s.configModalContainer} onClick={e => e.stopPropagation()}>
            <div className={s.modalHeader}>
              <span className={s.modalTitle}>
                <FontAwesomeIcon icon={faUser} />
                Client Configuration
              </span>
              <button className={s.panelClose} type="button" onClick={() => setShowClientModal(false)}>
                <FontAwesomeIcon icon={faXmark} />
              </button>
            </div>
            <div className={s.configModalBody}>
              <div className={s.configRow}>
                <label className={s.configLabel}>Export Name</label>
                <input type="text" className={s.configInput}
                  value={clientModalData.name}
                  onChange={e => setClientModalData(p => ({ ...p, name: e.target.value }))}
                  placeholder="export-name"
                />
              </div>
              <div className={s.configRow}>
                <label className={s.configLabel}>Description</label>
                <textarea className={s.configInput}
                  value={clientModalData.description}
                  onChange={e => setClientModalData(p => ({ ...p, description: e.target.value }))}
                  placeholder="Optional description"
                  rows={2}
                />
              </div>
              <div className={s.configRow}>
                <label className={s.configLabel}>HTTP Method</label>
                <DropdownInput
                  value={clientModalData.method}
                  onChange={v => setClientModalData(p => ({ ...p, method: v }))}
                  options={HTTP_METHODS}
                />
              </div>
              <div className={s.configRow}>
                <label className={s.configLabel}>Endpoint</label>
                <p className={s.configHint}>{`/streamby/${projectId}/export/${clientModalData.name || exportDetails.name || '…'}`}</p>
              </div>
            </div>
            <div className={s.modalFooter}>
              <button type="button" className={s.cancelButton} onClick={() => setShowClientModal(false)}>Cancel</button>
              <button type="button" className={s.saveButton} onClick={handleSaveClientModal}>
                <FontAwesomeIcon icon={faFloppyDisk} /> Save
              </button>
            </div>
          </div>
        </div>
      )}

      {showDataSourceModal && selectedNodeId && (() => {
        const node = nodes.find(n => n.id === selectedNodeId);
        const connId = (localData.connectionId as string) ?? (node?.data?.connectionId as string) ?? '';
        const table = (localData.tableName as string) ?? (node?.data?.tableName as string) ?? '';
        const recId = (localData.recordId as string) ?? (node?.data?.recordId as string) ?? '';
        const dbOptionsFull = [
          { value: '', label: 'Select a connection' },
          ...allDbConnections.map(c => ({ value: c.id, label: `${c.name} (${c.dbType})` })),
        ];
        const tableOpts = panelTablesLoading
          ? [{ value: '', label: 'Loading…' }]
          : [{ value: '', label: 'Select a table / collection' }, ...panelTables.map(t => ({ value: t, label: t }))];
        const recordOpts = panelRecordsLoading
          ? [{ value: '', label: 'Loading…' }]
          : [{ value: '', label: 'All records' }, ...panelRecords.map(r => ({ value: r.id, label: r.label }))];
        return (
          <div className={s.modalOverlay} onClick={() => { setLocalData({}); setShowDataSourceModal(false); }}>
            <div className={s.configModalContainer} onClick={e => e.stopPropagation()}>
              <div className={s.modalHeader}>
                <span className={s.modalTitle}>
                  <FontAwesomeIcon icon={faDatabase} style={{ color: 'var(--color-badge-builtin)' }} />
                  Data Source Configuration
                </span>
                <button className={s.panelClose} type="button" onClick={() => { setLocalData({}); setShowDataSourceModal(false); }}>
                  <FontAwesomeIcon icon={faXmark} />
                </button>
              </div>
              <div className={s.configModalBody}>
                <div className={s.configRow}>
                  <label className={s.configLabel}>DB Connection</label>
                  <DropdownInput value={connId} onChange={v => handleFieldChange('connectionId', v)} options={dbOptionsFull} />
                </div>
                {connId && (
                  <div className={s.configRow}>
                    <label className={s.configLabel}>Table / Collection</label>
                    <DropdownInput value={table} onChange={v => handleFieldChange('tableName', v)} options={tableOpts} />
                  </div>
                )}
                {connId && table && (
                  <div className={s.configRow}>
                    <label className={s.configLabel}>Record</label>
                    <DropdownInput value={recId} onChange={v => handleFieldChange('recordId', v)} options={recordOpts} />
                  </div>
                )}
              </div>
              <div className={s.modalFooter}>
                <button type="button" className={s.cancelButton} onClick={() => { setLocalData({}); setShowDataSourceModal(false); }}>Cancel</button>
                <button type="button" className={s.saveButton} onClick={handleSaveDataSourceModal}>
                  <FontAwesomeIcon icon={faFloppyDisk} /> Save
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {showApiModal && selectedNodeId && (() => {
        const node = nodes.find(n => n.id === selectedNodeId);
        const connId = (localData.connectionId as string) ?? (node?.data?.connectionId as string) ?? '';
        const isCreatingNew = connId === CREATE_NEW_SENTINEL;
        const canSaveApiModal = isCreatingNew ? !!apiCreateName && !!apiCreateUrl && !apiCreating : true;
        const options = [
          { value: '', label: 'Select a connection' },
          ...apiConnections.map(c => ({ value: c.id, label: `${c.name} — ${c.apiUrl}` })),
          { value: CREATE_NEW_SENTINEL, label: '+ Create new connection...' },
        ];
        return (
          <div className={s.modalOverlay} onClick={() => { setLocalData({}); setShowApiModal(false); }}>
            <div className={s.configModalContainer} onClick={e => e.stopPropagation()}>
              <div className={s.modalHeader}>
                <span className={s.modalTitle}>
                  <FontAwesomeIcon icon={faGlobe} style={{ color: 'var(--color-accent)' }} />
                  API Connection Configuration
                </span>
                <button className={s.panelClose} type="button" onClick={() => { setLocalData({}); setShowApiModal(false); }}>
                  <FontAwesomeIcon icon={faXmark} />
                </button>
              </div>
              <div className={s.configModalBody}>
                <div className={s.configRow}>
                  <label className={s.configLabel}>Connection</label>
                  <DropdownInput value={connId} onChange={v => handleFieldChange('connectionId', v)} options={options} />
                </div>
                {isCreatingNew && (<>
                  <div className={s.configRow}>
                    <label className={s.configLabel}>Name</label>
                    <input className={s.configInput} type="text" value={apiCreateName} onChange={e => setApiCreateName(e.target.value)} placeholder="My API" />
                  </div>
                  <div className={s.configRow}>
                    <label className={s.configLabel}>URL</label>
                    <input className={s.configInput} type="text" value={apiCreateUrl} onChange={e => setApiCreateUrl(e.target.value)} placeholder="https://api.example.com/endpoint" />
                  </div>
                  <div className={s.configRow}>
                    <label className={s.configLabel}>Method</label>
                    <DropdownInput value={apiCreateMethod} onChange={setApiCreateMethod} options={HTTP_METHODS} />
                  </div>
                </>)}
              </div>
              <div className={s.modalFooter}>
                <button type="button" className={s.cancelButton} onClick={() => { setLocalData({}); setShowApiModal(false); }}>Cancel</button>
                <button type="button" className={s.saveButton} onClick={handleSaveApiModal} disabled={!canSaveApiModal}>
                  <FontAwesomeIcon icon={faFloppyDisk} /> {apiCreating ? 'Creating…' : 'Save'}
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {showCredentialModal && selectedNodeId && (() => {
        const isCreatingNew = credPickId === CREATE_CRED_SENTINEL;
        const canSaveCredModal = isCreatingNew ? !!credCreateKey && !!credCreateValue && !credCreating : !!credPickId && credPickId !== CREATE_CRED_SENTINEL;
        const options = [
          { value: '', label: 'Select a credential' },
          ...(currentProject?.credentials ?? []).map(c => ({ value: c.id, label: c.key })),
          { value: CREATE_CRED_SENTINEL, label: '+ Create new credential...' },
        ];
        return (
          <div className={s.modalOverlay} onClick={() => setShowCredentialModal(false)}>
            <div className={s.configModalContainer} onClick={e => e.stopPropagation()}>
              <div className={s.modalHeader}>
                <span className={s.modalTitle}>
                  <FontAwesomeIcon icon={faGear} style={{ color: '#818cf8' }} />
                  Credential Configuration
                </span>
                <button className={s.panelClose} type="button" onClick={() => setShowCredentialModal(false)}>
                  <FontAwesomeIcon icon={faXmark} />
                </button>
              </div>
              <div className={s.configModalBody}>
                <div className={s.configRow}>
                  <label className={s.configLabel}>Credential</label>
                  <DropdownInput value={credPickId} onChange={setCredPickId} options={options} />
                </div>
                {isCreatingNew && (<>
                  <div className={s.configRow}>
                    <label className={s.configLabel}>Key</label>
                    <input className={s.configInput} type="text" value={credCreateKey} onChange={e => setCredCreateKey(e.target.value)} placeholder="MY_API_KEY" />
                  </div>
                  <div className={s.configRow}>
                    <label className={s.configLabel}>Value</label>
                    <input className={s.configInput} type="password" value={credCreateValue} onChange={e => setCredCreateValue(e.target.value)} placeholder="••••••••" />
                  </div>
                </>)}
              </div>
              <div className={s.modalFooter}>
                <button type="button" className={s.cancelButton} onClick={() => setShowCredentialModal(false)}>Cancel</button>
                <button type="button" className={s.saveButton} onClick={handleSaveCredentialModal} disabled={!canSaveCredModal}>
                  <FontAwesomeIcon icon={faFloppyDisk} /> {credCreating ? 'Creating…' : 'Save'}
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {showNodeLabelModal && (
        <div className={s.modalOverlay} onClick={() => setShowNodeLabelModal(false)}>
          <div className={s.configModalContainer} onClick={e => e.stopPropagation()}>
            <div className={s.modalHeader}>
              <span className={s.modalTitle}>
                <FontAwesomeIcon icon={faWrench} />
                Configure Node
              </span>
              <button className={s.panelClose} type="button" onClick={() => setShowNodeLabelModal(false)}>
                <FontAwesomeIcon icon={faXmark} />
              </button>
            </div>
            <div className={s.configModalBody}>
              <div className={s.configRow}>
                <label className={s.configLabel}>Name</label>
                <input type="text" className={s.configInput}
                  value={nodeLabelModalData.label}
                  onChange={e => setNodeLabelModalData(p => ({ ...p, label: e.target.value }))}
                  placeholder="Node name"
                />
              </div>
              <div className={s.configRow}>
                <label className={s.configLabel}>Description</label>
                <input type="text" className={s.configInput}
                  value={nodeLabelModalData.subtitle}
                  onChange={e => setNodeLabelModalData(p => ({ ...p, subtitle: e.target.value }))}
                  placeholder="Short description"
                />
              </div>
            </div>
            <div className={s.modalFooter}>
              <button type="button" className={s.cancelButton} onClick={() => setShowNodeLabelModal(false)}>Cancel</button>
              <button type="button" className={s.saveButton} onClick={handleSaveNodeLabelModal}>
                <FontAwesomeIcon icon={faFloppyDisk} /> Save
              </button>
            </div>
          </div>
        </div>
      )}

    </>
  );
});

NodeViewerInner.displayName = 'NodeViewerInner';

export const NodeViewer = forwardRef<NodeViewerHandle, NodeViewerProps>((props, ref) => (
  <ReactFlowProvider>
    <NodeViewerInner {...props} ref={ref} />
  </ReactFlowProvider>
));

NodeViewer.displayName = 'NodeViewer';
