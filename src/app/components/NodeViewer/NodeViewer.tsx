import React, { useState, useCallback, useEffect, useMemo, useRef, forwardRef, useImperativeHandle } from 'react';
import { DropdownInput } from '../Inputs/DropdownInput';
import { useSelector } from 'react-redux';
import { RootState } from '../../../store';
import { getConnectionResponse } from '../../../services/connections';
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
} from '@fortawesome/free-solid-svg-icons';
import { nodeTypes, H_LEFT, H_BOTTOM, H_RIGHT } from './nodes/nodeTypes';
import { NODE_PALETTE, PALETTE_GROUPS, PaletteItem, edgeColorForSource } from './nodePalette';
export { computeResponseFromSchema } from './nodeSchema';

// ─── Filter Node Config ────────────────────────────────────────────────────

interface FilterCondition { field: string; op: string; value: string; }
export interface FilterNodeConfig {
  conditions?:    FilterCondition[];
  includeFields?: string[];
  renameFields?:  Array<{ from: string; to: string }>;
  wrapKey?:       string;
  limit?:         number;
}

const EMPTY_FILTER_CONFIG: FilterNodeConfig = {
  conditions: [], includeFields: [], renameFields: [], wrapKey: '', limit: undefined,
};

const CONDITION_OPS = [
  { value: 'eq',         label: '= equals' },
  { value: 'neq',        label: '≠ not equals' },
  { value: 'gt',         label: '> greater than' },
  { value: 'lt',         label: '< less than' },
  { value: 'gte',        label: '>= ≥' },
  { value: 'lte',        label: '<= ≤' },
  { value: 'contains',   label: '⊃ contains' },
  { value: 'startsWith', label: '▷ starts with' },
  { value: 'endsWith',   label: '◁ ends with' },
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
}

export interface NodeViewerHandle {
  getSchema: () => { nodes: Node[]; edges: Edge[] };
}

const CORE_NODE_IDS = ['client', 'streamby'];
const HTTP_METHODS = ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'].map(m => ({ value: m, label: m }));

export const NodeViewer = forwardRef<NodeViewerHandle, NodeViewerProps>(({
  exportDetails, editMode = false, onSave, onChange, apiConnections = [], dbConnections = [], projectId,
}, ref) => {
  const sessionUserId = useSelector((state: RootState) => state.session.userId ?? state.session.username);

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
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [configModalData, setConfigModalData] = useState({ private: false, allowedOrigin: '*', devMode: false, devPorts: '3000, 5173, 8080, 4200' });
  const [filterModalConfig, setFilterModalConfig] = useState<FilterNodeConfig>({ ...EMPTY_FILTER_CONFIG });
  const [includeFieldsText, setIncludeFieldsText] = useState('');
  const [filterModalLabel, setFilterModalLabel] = useState('');
  const [filterModalSubtitle, setFilterModalSubtitle] = useState('');
  const [showClientModal, setShowClientModal] = useState(false);
  const [clientModalData, setClientModalData] = useState({ name: '', description: '', method: 'GET' });
  const [showDataSourceModal, setShowDataSourceModal] = useState(false);
  const [showApiModal, setShowApiModal] = useState(false);
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

    // IngestNode: receives file ref from left, outputs to streamby bottom data lane
    if (st === 'streambyNode' && tt === 'ingestNode') return sh === 'out-bottom';
    if (st === 'ingestNode' && tt === 'streambyNode') return th === 'in-bottom';

    // Process-lane nodes (transcode, caption, thumbnail): same rules as processNode
    if (st === 'streambyNode' && (tt === 'transcodeNode' || tt === 'captionNode' || tt === 'thumbnailNode')) return sh === 'out-top';
    if ((st === 'transcodeNode' || st === 'captionNode' || st === 'thumbnailNode') && tt === 'streambyNode') return th === 'in-top';

    // CaptionNode out-captions → filterNode input lane
    if (st === 'captionNode' && tt === 'filterNode') return sh === 'out-captions' && th === 'in-filter';

    // ThumbnailNode in-asset: receives asset ref from dataSourceNode or apiConnectionNode
    if ((st === 'dataSourceNode' || st === 'apiConnectionNode') && tt === 'thumbnailNode') return sh === 'out-stream' && th === 'in-asset';

    return false;
  }, [nodes]);

  const onConnect = useCallback((connection: Connection) => {
    const src = nodes.find(n => n.id === connection.source);
    const color = edgeColorForSource(connection.sourceHandle, src?.type ?? '');
    setEdges(prev => addEdge({ ...connection, animated: true, style: { stroke: color, strokeWidth: 2 } }, prev));
  }, [nodes, setEdges]);

  const addNode = useCallback((config: PaletteItem) => {
    const id = `${config.type}-${crypto.randomUUID()}`;
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
        { key: 'name',     label: 'Export Name', value: exportDetails.name || '' },
        { key: 'method',   label: 'HTTP Method', value: exportDetails.method || 'GET' },
        { key: 'endpoint', label: 'Endpoint',    value: `/streamby/${projectId}/export/${exportDetails.name}` },
      ],
    };

    if (nodeId === 'streamby') return {
      title: 'StreamBy Middleware',
      description: 'Core engine. Connect data sources below, process nodes above, and output filters to the right.',
      fields: [
        { key: 'allowedOrigin', label: 'Allowed Origins', value: exportDetails.allowedOrigin?.join(', ') || '*' },
        { key: 'devMode',       label: 'Dev Mode',        value: exportDetails.devMode ? 'Enabled' : 'Disabled' },
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
      return {
        title: 'API Connection',
        description: 'External API that StreamBy queries via the data layer.',
        fields: [{ key: 'connectionId', label: 'Connection', value: (node.data.connectionId as string) || '', displayValue }],
      };
    }

    if (node.type === 'dataSourceNode') {
      const selectedConnectionId = (node.data.connectionId as string) ?? '';
      const selectedTableName    = (node.data.tableName    as string) ?? '';
      const selectedRecordId     = (node.data.recordId     as string) ?? '';
      const connectionLabel      = allDbConnections.find(c => c.id === selectedConnectionId)?.name ?? selectedConnectionId;
      const recordLabel          = panelRecords.find(r => r.id === selectedRecordId)?.label ?? selectedRecordId;

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
        { key: 'label',    label: 'Name',        value: node.data.label as string },
        { key: 'subtitle', label: 'Description', value: node.data.subtitle as string },
      ],
    };

    if (node.type === 'filterNode') {
      const cfg = (node.data.filterConfig as FilterNodeConfig) ?? {};
      const summary = [
        cfg.conditions?.length    && `${cfg.conditions.length} condition(s)`,
        cfg.includeFields?.length && `pick ${cfg.includeFields.length} field(s)`,
        cfg.renameFields?.length  && `rename ${cfg.renameFields.length} field(s)`,
        cfg.wrapKey               && `wrap → "${cfg.wrapKey}"`,
        cfg.limit                 && `limit ${cfg.limit}`,
      ].filter(Boolean).join(' · ') || 'Not configured';
      return {
        title: node.data.label as string,
        description: summary,
        fields: [
          { key: 'label',    label: 'Name',        value: node.data.label as string },
          { key: 'subtitle', label: 'Description', value: node.data.subtitle as string },
        ],
      };
    }

    return null;
  }, [exportDetails, nodes, edges, apiConnections, allDbConnections, panelRecords, projectId]);

  const selectedDetail = getNodeDetail(selectedNodeId);
  const selectedNode   = nodes.find(n => n.id === selectedNodeId) ?? null;
  const hasChanges     = Object.keys(localData).length > 0;
  const isJsonNode     = selectedNode?.type === 'jsonInputNode';
  const isApiNode      = selectedNode?.type === 'apiConnectionNode';
  const isDbSourceNode = selectedNode?.type === 'dataSourceNode';
  const isCoreNode     = selectedNodeId !== null && CORE_NODE_IDS.includes(selectedNodeId);
  const canSave        = editMode && hasChanges && !isApiNode && !isDbSourceNode && (isJsonNode || !isCoreNode || !!onSave);

  // Stable primitives from the saved node data — avoids re-running effects on every ReactFlow state update
  const savedNodeConnId  = (selectedNode?.data?.connectionId as string) ?? '';
  const savedNodeTable   = (selectedNode?.data?.tableName    as string) ?? '';

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
    const table  = (localData.tableName    as string) ?? savedNodeTable;
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
  const handleNodeClick   = useCallback((_: React.MouseEvent, node: Node) => { setSelectedNodeId(node.id); setLocalData({}); setJsonError(null); resetConnFetch(); }, []);
  const handleClosePanel  = useCallback(() => { setSelectedNodeId(null); setLocalData({}); setJsonError(null); resetConnFetch(); }, []);
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
      const tableName    = (localData.tableName as string)    ?? (node.data.tableName as string)    ?? '';
      const recordId     = (localData.recordId  as string)    ?? (node.data.recordId  as string)    ?? '';
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
      conditions:   existing.conditions   ?? [],
      renameFields: existing.renameFields ?? [],
      wrapKey:      existing.wrapKey      ?? '',
      limit:        existing.limit,
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

  const handleOpenApiModal = useCallback(() => {
    setLocalData({});
    setShowApiModal(true);
  }, []);

  const handleSaveApiModal = useCallback(() => {
    handleSave();
    setShowApiModal(false);
  }, [handleSave]);

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
    if (filterModalConfig.conditions?.length) clean.conditions    = filterModalConfig.conditions;
    if (includeFields.length)                 clean.includeFields = includeFields;
    if (filterModalConfig.renameFields?.length) clean.renameFields = filterModalConfig.renameFields;
    if (filterModalConfig.wrapKey)              clean.wrapKey      = filterModalConfig.wrapKey;
    if (filterModalConfig.limit)               clean.limit         = filterModalConfig.limit;
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
            <Background variant={BackgroundVariant.Dots} color="var(--color-surface-sunken)" gap={22} size={1} />
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

            {selectedNodeId === 'streamby' && onSave && (
              <div className={s.nodeActions}>
                <button type="button" className={s.actionButton} onClick={handleOpenConfigModal}>
                  <FontAwesomeIcon icon={faGear} />
                  Configure
                </button>
              </div>
            )}

            {selectedNodeId === 'client' && onSave && editMode && (
              <div className={s.nodeActions}>
                <button type="button" className={s.actionButton} onClick={handleOpenClientModal}>
                  <FontAwesomeIcon icon={faGear} />
                  Configure
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
              const hasTable      = !!(selectedNode?.data?.tableName as string);
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
            </div>}
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
      const connId   = (localData.connectionId as string) ?? (node?.data?.connectionId as string) ?? '';
      const table    = (localData.tableName    as string) ?? (node?.data?.tableName    as string) ?? '';
      const recId    = (localData.recordId     as string) ?? (node?.data?.recordId     as string) ?? '';
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
      const options = [
        { value: '', label: 'Select a connection' },
        ...apiConnections.map(c => ({ value: c.id, label: `${c.name} — ${c.apiUrl}` })),
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
            </div>
            <div className={s.modalFooter}>
              <button type="button" className={s.cancelButton} onClick={() => { setLocalData({}); setShowApiModal(false); }}>Cancel</button>
              <button type="button" className={s.saveButton} onClick={handleSaveApiModal}>
                <FontAwesomeIcon icon={faFloppyDisk} /> Save
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

NodeViewer.displayName = 'NodeViewer';
