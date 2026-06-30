import React, { memo } from 'react';
import { NodeProps, Handle, Position } from 'reactflow';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import { faUser, faBolt, faDatabase, faGlobe, faCode } from '@fortawesome/free-solid-svg-icons';
import s from '../NodeViewer.module.css';

// ─── Node Data Types ──────────────────────────────────────────────────────────

export interface BaseNodeData { label: string; subtitle: string; }
export interface ProcessNodeData extends BaseNodeData { icon: IconDefinition; bgColor: string; iconColor: string; }
export interface JsonInputNodeData extends BaseNodeData { jsonString: string; }

// ─── Handle color tokens ──────────────────────────────────────────────────────
// Left=input blue, Top=process purple, Bottom=data green, Right=output amber

export const H_LEFT   = '#38B6FF';
export const H_TOP    = '#a78bfa';
export const H_BOTTOM = '#34d399';
export const H_RIGHT  = '#fbbf24';

export const hIn  = (color: string): React.CSSProperties => ({ background: 'var(--color-surface-base)', borderColor: color });
export const hOut = (color: string): React.CSSProperties => ({ background: color, borderColor: color });

// ─── Custom Node Components ───────────────────────────────────────────────────

export const ClientNode = memo(({ data, selected }: NodeProps<BaseNodeData>) => (
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

export const StreamByNode = memo(({ data, selected }: NodeProps<BaseNodeData>) => (
  <div className={`${s.customNode} ${s.streambyNode} ${selected ? s.nodeSelected : ''}`}>
    <Handle type="target" position={Position.Left}   id="in-left"   className={s.handle} style={hIn(H_LEFT)} />
    <Handle type="source" position={Position.Top}    id="out-top"   className={s.handle} style={{ ...hOut(H_TOP),    left: '35%' }} />
    <Handle type="target" position={Position.Top}    id="in-top"    className={s.handle} style={{ ...hIn(H_TOP),     left: '65%' }} />
    <Handle type="source" position={Position.Bottom} id="out-bottom" className={s.handle} style={{ ...hOut(H_BOTTOM), left: '35%' }} />
    <Handle type="target" position={Position.Bottom} id="in-bottom"  className={s.handle} style={{ ...hIn(H_BOTTOM),  left: '65%' }} />
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
export const ProcessNode = memo(({ data, selected }: NodeProps<ProcessNodeData>) => (
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
export const DataSourceNode = memo(({ data, selected }: NodeProps<BaseNodeData>) => (
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
export const ApiConnectionNode = memo(({ data, selected }: NodeProps<BaseNodeData>) => (
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
export const JsonInputNode = memo(({ data, selected }: NodeProps<JsonInputNodeData>) => (
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
export const FilterNode = memo(({ data, selected }: NodeProps<ProcessNodeData>) => (
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

// ─── nodeTypes map ────────────────────────────────────────────────────────────

export const nodeTypes = {
  clientNode: ClientNode,
  streambyNode: StreamByNode,
  dataSourceNode: DataSourceNode,
  jsonInputNode: JsonInputNode,
  apiConnectionNode: ApiConnectionNode,
  processNode: ProcessNode,
  filterNode: FilterNode,
};
