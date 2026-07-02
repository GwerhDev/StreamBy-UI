import React, { memo } from 'react';
import { NodeProps, Handle, Position } from 'reactflow';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import {
  faUser, faBolt, faDatabase, faGlobe, faCode,
  faCloudArrowDown, faFilm, faClosedCaptioning, faImage,
  faMicrochip, faArrowsRotate, faLayerGroup, faDiagramProject,
  faCircleCheck, faCommentDots,
  faBoxArchive, faRocket, faShieldHalved,
  faMicrophone, faExpand, faWandMagicSparkles, faBrain,
} from '@fortawesome/free-solid-svg-icons';
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
export const H_JOB    = '#f97316';
export const H_REVIEW = '#e879f9';

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

// ─── Media pipeline nodes ─────────────────────────────────────────────────────

// Ingests a file from an external source into StorageDrive — sits below streambyNode
export const IngestNode = memo(({ data, selected }: NodeProps<BaseNodeData>) => (
  <div className={`${s.customNode} ${selected ? s.nodeSelected : ''}`}>
    <Handle type="target" position={Position.Left} id="in-left"    className={s.handle} style={hIn(H_LEFT)} />
    <Handle type="source" position={Position.Top}  id="out-stream" className={s.handle} style={hOut(H_BOTTOM)} />
    <div className={s.nodeIconBar} style={{ backgroundColor: '#1a0d00' }}>
      <div className={s.nodeIcon} style={{ color: H_JOB }}><FontAwesomeIcon icon={faCloudArrowDown} /></div>
    </div>
    <div className={s.nodeBody}>
      <div className={s.nodeLabel}>{data.label}</div>
      <div className={s.nodeSubtitle}>{data.subtitle}</div>
    </div>
  </div>
));
IngestNode.displayName = 'IngestNode';

// Transcodes audio/video — sits above streambyNode in the process lane
export const TranscodeNode = memo(({ data, selected }: NodeProps<BaseNodeData>) => (
  <div className={`${s.customNode} ${selected ? s.nodeSelected : ''}`}>
    <Handle type="target" position={Position.Bottom} id="in-process"  className={s.handle} style={{ ...hIn(H_TOP),  left: '35%' }} />
    <Handle type="source" position={Position.Bottom} id="out-process" className={s.handle} style={{ ...hOut(H_TOP), left: '65%' }} />
    <div className={s.nodeIconBar} style={{ backgroundColor: '#14103a' }}>
      <div className={s.nodeIcon} style={{ color: H_TOP }}><FontAwesomeIcon icon={faFilm} /></div>
    </div>
    <div className={s.nodeBody}>
      <div className={s.nodeLabel}>{data.label}</div>
      <div className={s.nodeSubtitle}>{data.subtitle}</div>
    </div>
  </div>
));
TranscodeNode.displayName = 'TranscodeNode';

// Generates captions (SRT/VTT) — sits above streambyNode; emits caption file to the right output lane
export const CaptionNode = memo(({ data, selected }: NodeProps<BaseNodeData>) => (
  <div className={`${s.customNode} ${selected ? s.nodeSelected : ''}`}>
    <Handle type="target" position={Position.Bottom} id="in-process"   className={s.handle} style={{ ...hIn(H_TOP),  left: '35%' }} />
    <Handle type="source" position={Position.Bottom} id="out-process"  className={s.handle} style={{ ...hOut(H_TOP), left: '65%' }} />
    <Handle type="source" position={Position.Right}  id="out-captions" className={s.handle} style={hOut(H_RIGHT)} />
    <div className={s.nodeIconBar} style={{ backgroundColor: '#1a0f2e' }}>
      <div className={s.nodeIcon} style={{ color: '#c084fc' }}><FontAwesomeIcon icon={faClosedCaptioning} /></div>
    </div>
    <div className={s.nodeBody}>
      <div className={s.nodeLabel}>{data.label}</div>
      <div className={s.nodeSubtitle}>{data.subtitle}</div>
    </div>
  </div>
));
CaptionNode.displayName = 'CaptionNode';

// Extracts a thumbnail frame — sits above streambyNode; accepts an asset ref from the data layer
export const ThumbnailNode = memo(({ data, selected }: NodeProps<BaseNodeData>) => (
  <div className={`${s.customNode} ${selected ? s.nodeSelected : ''}`}>
    <Handle type="target" position={Position.Bottom} id="in-process"  className={s.handle} style={{ ...hIn(H_TOP),  left: '35%' }} />
    <Handle type="source" position={Position.Bottom} id="out-process" className={s.handle} style={{ ...hOut(H_TOP), left: '65%' }} />
    <Handle type="target" position={Position.Right}  id="in-asset"   className={s.handle} style={hIn(H_BOTTOM)} />
    <Handle type="source" position={Position.Left}   id="out-thumb"  className={s.handle} style={hOut(H_RIGHT)} />
    <div className={s.nodeIconBar} style={{ backgroundColor: '#0d2016' }}>
      <div className={s.nodeIcon} style={{ color: '#4ade80' }}><FontAwesomeIcon icon={faImage} /></div>
    </div>
    <div className={s.nodeBody}>
      <div className={s.nodeLabel}>{data.label}</div>
      <div className={s.nodeSubtitle}>{data.subtitle}</div>
    </div>
  </div>
));
ThumbnailNode.displayName = 'ThumbnailNode';

// Dispatches a render job to a connected render farm
export const RenderJobNode = memo(({ data, selected }: NodeProps<BaseNodeData>) => (
  <div className={`${s.customNode} ${selected ? s.nodeSelected : ''}`}>
    <Handle type="target" position={Position.Bottom} id="in-process"  className={s.handle} style={{ ...hIn(H_TOP),  left: '35%' }} />
    <Handle type="source" position={Position.Bottom} id="out-process" className={s.handle} style={{ ...hOut(H_TOP), left: '65%' }} />
    <div className={s.nodeIconBar} style={{ backgroundColor: '#1a0d00' }}>
      <div className={s.nodeIcon} style={{ color: H_JOB }}><FontAwesomeIcon icon={faMicrochip} /></div>
    </div>
    <div className={s.nodeBody}>
      <div className={s.nodeLabel}>{data.label}</div>
      <div className={s.nodeSubtitle}>{data.subtitle}</div>
    </div>
  </div>
));
RenderJobNode.displayName = 'RenderJobNode';

// Converts between 3D / media formats (FBX, OBJ, GLB, USD, etc.)
export const FormatConvertNode = memo(({ data, selected }: NodeProps<BaseNodeData>) => (
  <div className={`${s.customNode} ${selected ? s.nodeSelected : ''}`}>
    <Handle type="target" position={Position.Bottom} id="in-process"  className={s.handle} style={{ ...hIn(H_TOP),  left: '35%' }} />
    <Handle type="source" position={Position.Bottom} id="out-process" className={s.handle} style={{ ...hOut(H_TOP), left: '65%' }} />
    <div className={s.nodeIconBar} style={{ backgroundColor: '#0b1e35' }}>
      <div className={s.nodeIcon} style={{ color: H_LEFT }}><FontAwesomeIcon icon={faArrowsRotate} /></div>
    </div>
    <div className={s.nodeBody}>
      <div className={s.nodeLabel}>{data.label}</div>
      <div className={s.nodeSubtitle}>{data.subtitle}</div>
    </div>
  </div>
));
FormatConvertNode.displayName = 'FormatConvertNode';

// Generates LOD levels for a 3D asset
export const LodNode = memo(({ data, selected }: NodeProps<BaseNodeData>) => (
  <div className={`${s.customNode} ${selected ? s.nodeSelected : ''}`}>
    <Handle type="target" position={Position.Bottom} id="in-process"  className={s.handle} style={{ ...hIn(H_TOP),  left: '35%' }} />
    <Handle type="source" position={Position.Bottom} id="out-process" className={s.handle} style={{ ...hOut(H_TOP), left: '65%' }} />
    <Handle type="source" position={Position.Right}  id="out-lod"    className={s.handle} style={hOut(H_BOTTOM)} />
    <div className={s.nodeIconBar} style={{ backgroundColor: '#0d2216' }}>
      <div className={s.nodeIcon} style={{ color: '#2dd4bf' }}><FontAwesomeIcon icon={faLayerGroup} /></div>
    </div>
    <div className={s.nodeBody}>
      <div className={s.nodeLabel}>{data.label}</div>
      <div className={s.nodeSubtitle}>{data.subtitle}</div>
    </div>
  </div>
));
LodNode.displayName = 'LodNode';

// Resolves the dependency graph of a 3D asset tree — data layer node
export const AssetDependencyNode = memo(({ data, selected }: NodeProps<BaseNodeData>) => (
  <div className={`${s.customNode} ${selected ? s.nodeSelected : ''}`}>
    <Handle type="source" position={Position.Top}    id="out-stream" className={s.handle} style={hOut(H_BOTTOM)} />
    <Handle type="target" position={Position.Left}   id="in-left"   className={s.handle} style={hIn(H_LEFT)} />
    <div className={s.nodeIconBar} style={{ backgroundColor: '#0d2a1e' }}>
      <div className={s.nodeIcon} style={{ color: H_BOTTOM }}><FontAwesomeIcon icon={faDiagramProject} /></div>
    </div>
    <div className={s.nodeBody}>
      <div className={s.nodeLabel}>{data.label}</div>
      <div className={s.nodeSubtitle}>{data.subtitle}</div>
    </div>
  </div>
));
AssetDependencyNode.displayName = 'AssetDependencyNode';

// Transcribes audio/video using a speech-to-text AI provider
export const TranscriptionNode = memo(({ data, selected }: NodeProps<BaseNodeData>) => (
  <div className={`${s.customNode} ${selected ? s.nodeSelected : ''}`}>
    <Handle type="target" position={Position.Bottom} id="in-process"  className={s.handle} style={{ ...hIn(H_TOP),  left: '35%' }} />
    <Handle type="source" position={Position.Bottom} id="out-process" className={s.handle} style={{ ...hOut(H_TOP), left: '65%' }} />
    <Handle type="source" position={Position.Right}  id="out-transcript" className={s.handle} style={hOut(H_REVIEW)} />
    <div className={s.nodeIconBar} style={{ backgroundColor: '#1a0a2e' }}>
      <div className={s.nodeIcon} style={{ color: H_REVIEW }}><FontAwesomeIcon icon={faMicrophone} /></div>
    </div>
    <div className={s.nodeBody}>
      <div className={s.nodeLabel}>{data.label}</div>
      <div className={s.nodeSubtitle}>{data.subtitle}</div>
    </div>
  </div>
));
TranscriptionNode.displayName = 'TranscriptionNode';

// Upscales images or video frames using an AI model
export const UpscaleNode = memo(({ data, selected }: NodeProps<BaseNodeData>) => (
  <div className={`${s.customNode} ${selected ? s.nodeSelected : ''}`}>
    <Handle type="target" position={Position.Bottom} id="in-process"  className={s.handle} style={{ ...hIn(H_TOP),  left: '35%' }} />
    <Handle type="source" position={Position.Bottom} id="out-process" className={s.handle} style={{ ...hOut(H_TOP), left: '65%' }} />
    <div className={s.nodeIconBar} style={{ backgroundColor: '#0d2016' }}>
      <div className={s.nodeIcon} style={{ color: H_BOTTOM }}><FontAwesomeIcon icon={faExpand} /></div>
    </div>
    <div className={s.nodeBody}>
      <div className={s.nodeLabel}>{data.label}</div>
      <div className={s.nodeSubtitle}>{data.subtitle}</div>
    </div>
  </div>
));
UpscaleNode.displayName = 'UpscaleNode';

// Generates a 3D asset, texture or audio clip from a prompt via AI provider
export const ProceduralAssetNode = memo(({ data, selected }: NodeProps<BaseNodeData>) => (
  <div className={`${s.customNode} ${selected ? s.nodeSelected : ''}`}>
    <Handle type="source" position={Position.Top}  id="out-stream" className={s.handle} style={hOut(H_BOTTOM)} />
    <Handle type="target" position={Position.Left} id="in-left"   className={s.handle} style={hIn(H_LEFT)} />
    <div className={s.nodeIconBar} style={{ backgroundColor: '#1a0a2e' }}>
      <div className={s.nodeIcon} style={{ color: H_REVIEW }}><FontAwesomeIcon icon={faWandMagicSparkles} /></div>
    </div>
    <div className={s.nodeBody}>
      <div className={s.nodeLabel}>{data.label}</div>
      <div className={s.nodeSubtitle}>{data.subtitle}</div>
    </div>
  </div>
));
ProceduralAssetNode.displayName = 'ProceduralAssetNode';

// Analyses the current pipeline topology and suggests missing nodes (ephemeral)
export const PipelineSuggestNode = memo(({ data, selected }: NodeProps<BaseNodeData>) => (
  <div className={`${s.customNode} ${selected ? s.nodeSelected : ''}`}>
    <Handle type="target" position={Position.Bottom} id="in-process"  className={s.handle} style={{ ...hIn(H_TOP),  left: '35%' }} />
    <Handle type="source" position={Position.Bottom} id="out-process" className={s.handle} style={{ ...hOut(H_TOP), left: '65%' }} />
    <div className={s.nodeIconBar} style={{ backgroundColor: '#1a0a2e' }}>
      <div className={s.nodeIcon} style={{ color: H_REVIEW }}><FontAwesomeIcon icon={faBrain} /></div>
    </div>
    <div className={s.nodeBody}>
      <div className={s.nodeLabel}>{data.label}</div>
      <div className={s.nodeSubtitle}>{data.subtitle}</div>
    </div>
  </div>
));
PipelineSuggestNode.displayName = 'PipelineSuggestNode';

// Packages a pipeline output as a versioned deliverable artifact
export const DeliverableNode = memo(({ data, selected }: NodeProps<BaseNodeData>) => (
  <div className={`${s.customNode} ${selected ? s.nodeSelected : ''}`}>
    <Handle type="target" position={Position.Left}  id="in-filter"  className={s.handle} style={hIn(H_RIGHT)} />
    <Handle type="source" position={Position.Right} id="out-filter" className={s.handle} style={hOut(H_RIGHT)} />
    <div className={s.nodeIconBar} style={{ backgroundColor: '#1e1300' }}>
      <div className={s.nodeIcon} style={{ color: H_RIGHT }}><FontAwesomeIcon icon={faBoxArchive} /></div>
    </div>
    <div className={s.nodeBody}>
      <div className={s.nodeLabel}>{data.label}</div>
      <div className={s.nodeSubtitle}>{data.subtitle}</div>
    </div>
  </div>
));
DeliverableNode.displayName = 'DeliverableNode';

// Publishes a deliverable to one or more distribution targets
export const DistributionNode = memo(({ data, selected }: NodeProps<BaseNodeData>) => (
  <div className={`${s.customNode} ${selected ? s.nodeSelected : ''}`}>
    <Handle type="target" position={Position.Left}  id="in-filter"  className={s.handle} style={hIn(H_RIGHT)} />
    <Handle type="source" position={Position.Right} id="out-filter" className={s.handle} style={hOut(H_RIGHT)} />
    <div className={s.nodeIconBar} style={{ backgroundColor: '#1a0d00' }}>
      <div className={s.nodeIcon} style={{ color: H_JOB }}><FontAwesomeIcon icon={faRocket} /></div>
    </div>
    <div className={s.nodeBody}>
      <div className={s.nodeLabel}>{data.label}</div>
      <div className={s.nodeSubtitle}>{data.subtitle}</div>
    </div>
  </div>
));
DistributionNode.displayName = 'DistributionNode';

// Runs quality checks before the deliverable reaches review or distribution
export const QcCheckNode = memo(({ data, selected }: NodeProps<BaseNodeData>) => (
  <div className={`${s.customNode} ${selected ? s.nodeSelected : ''}`}>
    <Handle type="target" position={Position.Bottom} id="in-process"  className={s.handle} style={{ ...hIn(H_TOP),  left: '35%' }} />
    <Handle type="source" position={Position.Bottom} id="out-process" className={s.handle} style={{ ...hOut(H_TOP), left: '65%' }} />
    <div className={s.nodeIconBar} style={{ backgroundColor: '#0d2016' }}>
      <div className={s.nodeIcon} style={{ color: H_BOTTOM }}><FontAwesomeIcon icon={faShieldHalved} /></div>
    </div>
    <div className={s.nodeBody}>
      <div className={s.nodeLabel}>{data.label}</div>
      <div className={s.nodeSubtitle}>{data.subtitle}</div>
    </div>
  </div>
));
QcCheckNode.displayName = 'QcCheckNode';

// Blocks pipeline progression until the required approvals are collected
export const ReviewGateNode = memo(({ data, selected }: NodeProps<BaseNodeData>) => (
  <div className={`${s.customNode} ${selected ? s.nodeSelected : ''}`}>
    <Handle type="target" position={Position.Bottom} id="in-process"  className={s.handle} style={{ ...hIn(H_TOP),    left: '35%' }} />
    <Handle type="source" position={Position.Bottom} id="out-process" className={s.handle} style={{ ...hOut(H_TOP),   left: '65%' }} />
    <Handle type="source" position={Position.Right}  id="out-review"  className={s.handle} style={hOut(H_REVIEW)} />
    <div className={s.nodeIconBar} style={{ backgroundColor: '#1a0a2e' }}>
      <div className={s.nodeIcon} style={{ color: H_REVIEW }}><FontAwesomeIcon icon={faCircleCheck} /></div>
    </div>
    <div className={s.nodeBody}>
      <div className={s.nodeLabel}>{data.label}</div>
      <div className={s.nodeSubtitle}>{data.subtitle}</div>
    </div>
  </div>
));
ReviewGateNode.displayName = 'ReviewGateNode';

// Attaches frame-accurate or spatial annotations to an asset in the output lane
export const AnnotationNode = memo(({ data, selected }: NodeProps<BaseNodeData>) => (
  <div className={`${s.customNode} ${selected ? s.nodeSelected : ''}`}>
    <Handle type="target" position={Position.Left}  id="in-filter"   className={s.handle} style={hIn(H_RIGHT)} />
    <Handle type="source" position={Position.Right} id="out-filter"  className={s.handle} style={hOut(H_RIGHT)} />
    <Handle type="target" position={Position.Top}   id="in-review"   className={s.handle} style={hIn(H_REVIEW)} />
    <div className={s.nodeIconBar} style={{ backgroundColor: '#1a0a2e' }}>
      <div className={s.nodeIcon} style={{ color: H_REVIEW }}><FontAwesomeIcon icon={faCommentDots} /></div>
    </div>
    <div className={s.nodeBody}>
      <div className={s.nodeLabel}>{data.label}</div>
      <div className={s.nodeSubtitle}>{data.subtitle}</div>
    </div>
  </div>
));
AnnotationNode.displayName = 'AnnotationNode';

// ─── nodeTypes map ────────────────────────────────────────────────────────────

export const nodeTypes = {
  clientNode: ClientNode,
  streambyNode: StreamByNode,
  dataSourceNode: DataSourceNode,
  jsonInputNode: JsonInputNode,
  apiConnectionNode: ApiConnectionNode,
  processNode: ProcessNode,
  filterNode: FilterNode,
  ingestNode: IngestNode,
  transcodeNode: TranscodeNode,
  captionNode: CaptionNode,
  thumbnailNode: ThumbnailNode,
  renderJobNode: RenderJobNode,
  formatConvertNode: FormatConvertNode,
  lodNode: LodNode,
  assetDependencyNode: AssetDependencyNode,
  reviewGateNode: ReviewGateNode,
  annotationNode: AnnotationNode,
  deliverableNode: DeliverableNode,
  distributionNode: DistributionNode,
  qcCheckNode: QcCheckNode,
  transcriptionNode: TranscriptionNode,
  upscaleNode: UpscaleNode,
  proceduralAssetNode: ProceduralAssetNode,
  pipelineSuggestNode: PipelineSuggestNode,
};
