import React, { memo, useState, useCallback, useEffect, useMemo } from 'react';
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
import { API_BASE } from '../../../config/api';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import {
  faUser,
  faBolt,
  faDatabase,
  faGlobe,
  faCircleCheck,
  faXmark,
  faFloppyDisk,
  faInfoCircle,
  faArrowsRotate,
  faFilter,
  faKey,
  faWrench,
  faPlus,
} from '@fortawesome/free-solid-svg-icons';

// ─── Custom Node Components ────────────────────────────────────────────────

interface CustomNodeData {
  label: string;
  subtitle: string;
  isApi?: boolean;
}

interface ProcessNodeData {
  label: string;
  subtitle: string;
  icon: IconDefinition;
  bgColor: string;
  iconColor: string;
}

const ClientNode = memo(({ data, selected }: NodeProps<CustomNodeData>) => (
  <div className={`${s.customNode} ${selected ? s.nodeSelected : ''}`}>
    <Handle type="source" position={Position.Right} className={s.handle} />
    <div className={s.nodeIconBar} style={{ backgroundColor: '#0e2537' }}>
      <div className={s.nodeIcon} style={{ color: '#38B6FF' }}>
        <FontAwesomeIcon icon={faUser} />
      </div>
    </div>
    <div className={s.nodeBody}>
      <div className={s.nodeLabel}>{data.label}</div>
      <div className={s.nodeSubtitle}>{data.subtitle}</div>
    </div>
  </div>
));
ClientNode.displayName = 'ClientNode';

const StreamByNode = memo(({ data, selected }: NodeProps<CustomNodeData>) => (
  <div className={`${s.customNode} ${s.streambyNode} ${selected ? s.nodeSelected : ''}`}>
    <Handle type="target" position={Position.Left} id="in-left" className={s.handle} />
    <Handle type="source" position={Position.Right} id="out-right" className={s.handle} />
    <Handle type="source" position={Position.Bottom} id="out-ds" className={s.handle} style={{ left: '38%' }} />
    <Handle type="target" position={Position.Bottom} id="in-ds" className={s.handle} style={{ left: '62%' }} />
    <div className={s.nodeIconBar} style={{ backgroundColor: '#14103a' }}>
      <div className={s.nodeIcon} style={{ color: '#a78bfa' }}>
        <FontAwesomeIcon icon={faBolt} />
      </div>
    </div>
    <div className={s.nodeBody}>
      <div className={s.nodeLabel}>{data.label}</div>
      <div className={s.nodeSubtitle}>{data.subtitle}</div>
    </div>
  </div>
));
StreamByNode.displayName = 'StreamByNode';

const DataSourceNode = memo(({ data, selected }: NodeProps<CustomNodeData>) => (
  <div className={`${s.customNode} ${selected ? s.nodeSelected : ''}`}>
    <Handle type="target" position={Position.Top} id="in-top" className={s.handle} style={{ left: '38%' }} />
    <Handle type="source" position={Position.Top} id="out-top" className={s.handle} style={{ left: '62%' }} />
    <div className={s.nodeIconBar} style={{ backgroundColor: '#0d2a1e' }}>
      <div className={s.nodeIcon} style={{ color: '#34d399' }}>
        <FontAwesomeIcon icon={data.isApi ? faGlobe : faDatabase} />
      </div>
    </div>
    <div className={s.nodeBody}>
      <div className={s.nodeLabel}>{data.label}</div>
      <div className={s.nodeSubtitle}>{data.subtitle}</div>
    </div>
  </div>
));
DataSourceNode.displayName = 'DataSourceNode';

const ResponseNode = memo(({ data, selected }: NodeProps<CustomNodeData>) => (
  <div className={`${s.customNode} ${selected ? s.nodeSelected : ''}`}>
    <Handle type="target" position={Position.Left} className={s.handle} />
    <div className={s.nodeIconBar} style={{ backgroundColor: '#261409' }}>
      <div className={s.nodeIcon} style={{ color: '#fb923c' }}>
        <FontAwesomeIcon icon={faCircleCheck} />
      </div>
    </div>
    <div className={s.nodeBody}>
      <div className={s.nodeLabel}>{data.label}</div>
      <div className={s.nodeSubtitle}>{data.subtitle}</div>
    </div>
  </div>
));
ResponseNode.displayName = 'ResponseNode';

const ProcessNode = memo(({ data, selected }: NodeProps<ProcessNodeData>) => (
  <div className={`${s.customNode} ${selected ? s.nodeSelected : ''}`}>
    <Handle type="target" position={Position.Left} className={s.handle} />
    <Handle type="source" position={Position.Right} className={s.handle} />
    <div className={s.nodeIconBar} style={{ backgroundColor: data.bgColor }}>
      <div className={s.nodeIcon} style={{ color: data.iconColor }}>
        <FontAwesomeIcon icon={data.icon} />
      </div>
    </div>
    <div className={s.nodeBody}>
      <div className={s.nodeLabel}>{data.label}</div>
      <div className={s.nodeSubtitle}>{data.subtitle}</div>
    </div>
  </div>
));
ProcessNode.displayName = 'ProcessNode';

const nodeTypes = {
  clientNode: ClientNode,
  streambyNode: StreamByNode,
  dataSourceNode: DataSourceNode,
  responseNode: ResponseNode,
  processNode: ProcessNode,
};

// ─── Node Palette Config ───────────────────────────────────────────────────

const NODE_PALETTE: { label: string; subtitle: string; icon: IconDefinition; bgColor: string; iconColor: string }[] = [
  { label: 'Transform', subtitle: 'Data transformation', icon: faArrowsRotate, bgColor: '#0e1f35', iconColor: '#60a5fa' },
  { label: 'Filter',    subtitle: 'Data filtering',      icon: faFilter,        bgColor: '#0d2218', iconColor: '#34d399' },
  { label: 'Auth',      subtitle: 'Authentication',      icon: faKey,           bgColor: '#1e1030', iconColor: '#c084fc' },
  { label: 'Custom',    subtitle: 'Custom step',         icon: faWrench,        bgColor: '#251a0a', iconColor: '#fbbf24' },
];

// ─── Types ─────────────────────────────────────────────────────────────────

interface DetailField {
  key: string;
  label: string;
  value: string;
  editable?: boolean;
  inputType?: 'text' | 'checkbox' | 'connection';
}

interface NodeDetail {
  title: string;
  description: string;
  fields: DetailField[];
}

// ─── NodeViewer ────────────────────────────────────────────────────────────

export interface NodeViewerProps {
  exportDetails: Export;
  editMode?: boolean;
  onSave?: (updates: Record<string, string | boolean>) => void;
  apiConnections?: ApiConnection[];
  onConnectionSelect?: (conn: ApiConnection) => void;
  selectedConnectionId?: string | null;
}

export const NodeViewer: React.FC<NodeViewerProps> = ({
  exportDetails,
  editMode = false,
  onSave,
  apiConnections,
  onConnectionSelect,
  selectedConnectionId,
}) => {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [localData, setLocalData] = useState<Record<string, string | boolean>>({});
  const [previewData, setPreviewData] = useState<unknown>(undefined);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);

  useEffect(() => {
    if (!editMode) {
      setLocalData({});
    }
  }, [editMode]);

  // Reset preview when user navigates away from the response node
  useEffect(() => {
    if (selectedNodeId !== 'response') {
      setPreviewData(undefined);
      setPreviewError(null);
    }
  }, [selectedNodeId]);

  const fetchPreview = useCallback(async () => {
    setPreviewLoading(true);
    setPreviewError(null);
    try {
      if (exportDetails.type === 'externalApi') {
        if (!exportDetails.apiUrl) throw new Error('No API URL configured. Select a connection first.');
        const res = await fetch(exportDetails.apiUrl, {
          method: exportDetails.method || 'GET',
        });
        if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
        const data = await res.json();
        setPreviewData(data);
      } else {
        if (!exportDetails.id || !exportDetails.projectId || !exportDetails.name) {
          throw new Error('Save the export first to preview JSON data.');
        }
        const res = await fetch(
          `${API_BASE}/streamby/${exportDetails.projectId}/get-export/${exportDetails.name}`,
          { credentials: 'include' },
        );
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error || `HTTP ${res.status}`);
        }
        const data = await res.json();
        setPreviewData(data);
      }
    } catch (err: unknown) {
      setPreviewError(err instanceof Error ? err.message : 'Failed to fetch');
    } finally {
      setPreviewLoading(false);
    }
  }, [exportDetails.type, exportDetails.apiUrl, exportDetails.method, exportDetails.id, exportDetails.projectId, exportDetails.name]);

  const initialNodes = useMemo((): Node[] => [
    {
      id: 'client',
      position: { x: 0, y: 60 },
      type: 'clientNode',
      data: { label: 'Client', subtitle: exportDetails.method || 'GET' },
    },
    {
      id: 'streamby',
      position: { x: 220, y: 60 },
      type: 'streambyNode',
      data: { label: 'StreamBy', subtitle: 'Middleware' },
    },
    {
      id: 'datasource',
      position: { x: 220, y: 220 },
      type: 'dataSourceNode',
      data: {
        label: exportDetails.type === 'json' ? 'Collection' : 'External API',
        subtitle: exportDetails.type === 'json'
          ? exportDetails.collectionName
          : (exportDetails.apiUrl || 'No URL set'),
        isApi: exportDetails.type === 'externalApi',
      },
    },
    {
      id: 'response',
      position: { x: 480, y: 60 },
      type: 'responseNode',
      data: { label: 'Response', subtitle: 'JSON Output' },
    },
  // eslint-disable-next-line react-hooks/exhaustive-deps
  ], []);

  const initialEdges = useMemo((): Edge[] => [
    {
      id: 'e1-2',
      source: 'client',
      target: 'streamby',
      targetHandle: 'in-left',
      animated: true,
      style: { stroke: '#38B6FF', strokeWidth: 2 },
    },
    {
      id: 'e2-3',
      source: 'streamby',
      sourceHandle: 'out-ds',
      target: 'datasource',
      targetHandle: 'in-top',
      animated: true,
      style: { stroke: '#34d399', strokeWidth: 2 },
    },
    {
      id: 'e3-2',
      source: 'datasource',
      sourceHandle: 'out-top',
      target: 'streamby',
      targetHandle: 'in-ds',
      animated: true,
      style: { stroke: '#34d399', strokeWidth: 2 },
    },
    {
      id: 'e2-4',
      source: 'streamby',
      sourceHandle: 'out-right',
      target: 'response',
      animated: true,
      style: { stroke: '#fb923c', strokeWidth: 2 },
    },
  ], []);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const onConnect = useCallback((connection: Connection) => {
    setEdges(prev => addEdge(
      { ...connection, animated: true, style: { stroke: '#38B6FF', strokeWidth: 2 } },
      prev
    ));
  }, [setEdges]);

  const addNode = useCallback((config: typeof NODE_PALETTE[0]) => {
    const id = `process-${Date.now()}`;
    const newNode: Node = {
      id,
      type: 'processNode',
      position: { x: 100 + Math.random() * 200, y: 100 + Math.random() * 80 },
      data: { ...config },
    };
    setNodes(prev => [...prev, newNode]);
  }, [setNodes]);

  const CORE_NODE_IDS = ['client', 'streamby', 'datasource', 'response'];

  const getNodeDetail = useCallback((id: string | null): NodeDetail | null => {
    if (!id) return null;

    if (!CORE_NODE_IDS.includes(id)) {
      const node = nodes.find(n => n.id === id);
      if (!node) return null;
      return {
        title: node.data.label,
        description: node.data.subtitle,
        fields: [
          { key: 'label', label: 'Name', value: node.data.label, editable: true, inputType: 'text' },
          { key: 'subtitle', label: 'Description', value: node.data.subtitle, editable: true, inputType: 'text' },
        ],
      };
    }

    switch (id) {
      case 'client':
        return {
          title: 'Client',
          description: 'Any consumer (browser, mobile app, or server) making a request to this StreamBy endpoint.',
          fields: [
            { key: 'method', label: 'HTTP Method', value: exportDetails.method || 'GET' },
            { key: 'endpoint', label: 'Endpoint', value: `/streamby/${exportDetails.projectId}/get-export/${exportDetails.name}` },
          ],
        };
      case 'streamby':
        return {
          title: 'StreamBy Middleware',
          description: 'Core processing engine. Validates requests, fetches data from the configured source, and returns the processed response.',
          fields: [
            { key: 'prefix',  label: 'Prefix',  value: exportDetails.prefix || '—', editable: true, inputType: 'text' },
            { key: 'private', label: 'Private', value: exportDetails.private ? 'Yes' : 'No', editable: true, inputType: 'checkbox' },
            { key: 'auth',    label: 'Authentication', value: exportDetails.credentialId ? 'Credential required' : 'None' },
            { key: 'allowedOrigin', label: 'Allowed Origins', value: exportDetails.allowedOrigin?.join(', ') || '*' },
          ],
        };
      case 'datasource':
        return {
          title: exportDetails.type === 'json' ? 'JSON Collection' : 'External API',
          description: exportDetails.type === 'json'
            ? 'Data is fetched from a JSON collection stored in the StreamBy database.'
            : 'Data is fetched from an external API and relayed back to the client.',
          fields: exportDetails.type === 'json'
            ? [
                { key: 'collectionName', label: 'Collection Name', value: exportDetails.collectionName, editable: true, inputType: 'text' as const },
                { key: 'sourceType',     label: 'Source Type',     value: 'JSON Collection' },
              ]
            : [
                {
                  key: 'apiUrl',
                  label: apiConnections ? 'API Connection' : 'API URL',
                  value: exportDetails.apiUrl || '—',
                  editable: true,
                  inputType: apiConnections ? ('connection' as const) : ('text' as const),
                },
                { key: 'sourceType', label: 'Source Type', value: 'External API' },
              ],
        };
      case 'response':
        return {
          title: 'Response',
          description: 'The final processed JSON data sent back to the client after middleware transformation.',
          fields: [
            { key: 'format',  label: 'Format',        value: 'JSON' },
            { key: 'status',  label: 'Export Status', value: exportDetails.status },
            { key: 'updated', label: 'Last Updated',  value: new Date(exportDetails.updatedAt).toLocaleString() },
          ],
        };
      default:
        return null;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exportDetails, nodes]);

  const selectedDetail = getNodeDetail(selectedNodeId);
  const hasChanges = Object.keys(localData).length > 0;
  const isProcessNode = selectedNodeId !== null && !CORE_NODE_IDS.includes(selectedNodeId);

  const handleNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    setSelectedNodeId(node.id);
  }, []);

  const handleClosePanel = useCallback(() => {
    setSelectedNodeId(null);
  }, []);

  const handleFieldChange = useCallback((key: string, value: string | boolean) => {
    setLocalData(prev => ({ ...prev, [key]: value }));
  }, []);

  const handleSave = useCallback(() => {
    if (isProcessNode && selectedNodeId) {
      // Update the process node's data in local state
      setNodes(prev => prev.map(n =>
        n.id === selectedNodeId
          ? { ...n, data: { ...n.data, ...localData } }
          : n
      ));
    } else if (onSave) {
      onSave(localData);
    }
    setLocalData({});
    setSelectedNodeId(null);
  }, [isProcessNode, selectedNodeId, localData, onSave, setNodes]);

  const getFieldDisplayValue = (field: DetailField): string | boolean => {
    if (localData[field.key] !== undefined) return localData[field.key];
    if (field.inputType === 'checkbox') return field.value === 'Yes';
    return field.value;
  };

  return (
    <div className={`${s.wrapper} ${editMode ? s.wrapperEditMode : ''}`}>
      <div className={s.canvasArea}>
        {/* Node palette — only in edit mode */}
        {editMode && (
          <div className={s.palette}>
            <span className={s.paletteLabel}>
              <FontAwesomeIcon icon={faPlus} />
              Add node
            </span>
            {NODE_PALETTE.map((config) => (
              <button
                key={config.label}
                type="button"
                className={s.paletteBtn}
                onClick={() => addNode(config)}
                title={`Add ${config.label} node`}
              >
                <span className={s.paletteBtnIcon} style={{ color: config.iconColor, backgroundColor: config.bgColor }}>
                  <FontAwesomeIcon icon={config.icon} />
                </span>
                {config.label}
              </button>
            ))}
          </div>
        )}

        <div className={s.flowContainer}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodeClick={handleNodeClick}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={editMode ? onConnect : undefined}
            nodeTypes={nodeTypes}
            nodesDraggable={editMode}
            nodesConnectable={editMode}
            elementsSelectable={true}
            deleteKeyCode={editMode ? 'Delete' : null}
            fitView
            fitViewOptions={{ padding: 0.35 }}
          >
            <Background variant={BackgroundVariant.Dots} color="var(--color-dark-400)" gap={22} size={1} />
            <Controls showInteractive={false} />
          </ReactFlow>
        </div>

        {/* Detail / Edit Panel */}
        {selectedDetail && (
          <div className={s.detailPanel}>
            <div className={s.detailHeader}>
              <span className={s.detailTitle}>{selectedDetail.title}</span>
              <button className={s.panelClose} onClick={handleClosePanel} type="button">
                <FontAwesomeIcon icon={faXmark} />
              </button>
            </div>

            <p className={s.detailDescription}>{selectedDetail.description}</p>

            <div className={s.detailFields}>
              {selectedDetail.fields.map(field => (
                <div key={field.key} className={s.detailField}>
                  <span className={s.fieldLabel}>{field.label}</span>
                  {editMode && field.inputType === 'connection' ? (
                    apiConnections && apiConnections.length > 0 ? (
                      <ul className={s.connPickerList}>
                        {apiConnections.map(conn => (
                          <li
                            key={conn.id}
                            className={`${s.connPickerItem} ${selectedConnectionId === conn.id ? s.connPickerSelected : ''}`}
                            onClick={() => { onConnectionSelect?.(conn); handleClosePanel(); }}
                          >
                            <span className={s.connMethodBadge}>{conn.method}</span>
                            <span className={s.connName}>{conn.name}</span>
                            <small className={s.connUrl}>{conn.baseUrl}</small>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <span className={s.fieldValue}>No connections configured for this project.</span>
                    )
                  ) : editMode && field.editable ? (
                    field.inputType === 'checkbox' ? (
                      <label className={s.checkboxRow}>
                        <input
                          type="checkbox"
                          checked={Boolean(getFieldDisplayValue(field))}
                          onChange={e => handleFieldChange(field.key, e.target.checked)}
                          className={s.fieldCheckbox}
                        />
                        <span className={s.checkboxLabel}>
                          {getFieldDisplayValue(field) ? 'Enabled' : 'Disabled'}
                        </span>
                      </label>
                    ) : (
                      <input
                        type="text"
                        defaultValue={String(getFieldDisplayValue(field))}
                        onChange={e => handleFieldChange(field.key, e.target.value)}
                        className={s.fieldInput}
                        placeholder={field.label}
                      />
                    )
                  ) : (
                    <span className={s.fieldValue}>{field.value}</span>
                  )}
                </div>
              ))}
            </div>

            {selectedNodeId === 'response' && (
              <div className={s.jsonPreviewSection}>
                <div className={s.previewHeader}>
                  <span className={s.fieldLabel}>Response Preview</span>
                  <button
                    type="button"
                    className={s.fetchButton}
                    onClick={fetchPreview}
                    disabled={previewLoading || (exportDetails.type === 'externalApi' ? !exportDetails.apiUrl : !exportDetails.id)}
                    title={
                      exportDetails.type === 'externalApi'
                        ? (!exportDetails.apiUrl ? 'Select a connection first' : `${exportDetails.method || 'GET'} ${exportDetails.apiUrl}`)
                        : (!exportDetails.id ? 'Save the export first' : 'Fetch stored JSON')
                    }
                  >
                    <FontAwesomeIcon icon={faArrowsRotate} spin={previewLoading} />
                    {previewLoading ? 'Fetching…' : 'Fetch'}
                  </button>
                </div>
                {previewError && (
                  <p className={s.previewError}>{previewError}</p>
                )}
                {previewData !== undefined && previewError == null && (() => {
                  const prefix = exportDetails.prefix;
                  const displayed =
                    prefix &&
                    previewData !== null &&
                    typeof previewData === 'object' &&
                    prefix in (previewData as Record<string, unknown>)
                      ? (previewData as Record<string, unknown>)[prefix]
                      : previewData;
                  return (
                    <pre className={s.jsonPre}>{JSON.stringify(displayed, null, 2)}</pre>
                  );
                })()}
                {previewData === undefined && !previewError && !previewLoading && (
                  <p className={s.jsonEmptyNote}>Click Fetch to load the live response.</p>
                )}
              </div>
            )}

            {editMode && hasChanges && (isProcessNode || onSave) && (
              <div className={s.panelActions}>
                <button className={s.saveButton} onClick={handleSave} type="button">
                  <FontAwesomeIcon icon={faFloppyDisk} />
                  Save Changes
                </button>
              </div>
            )}

            {editMode && !onSave && !isProcessNode && (
              <div className={s.editHint}>
                <FontAwesomeIcon icon={faInfoCircle} />
                <span>En modo edición puedes reposicionar y conectar nodos.</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
