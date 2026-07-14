import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import {
  faDatabase, faCode, faGlobe, faArrowsRotate, faKey, faWrench, faFilter, faArrowRight,
  faCloudArrowDown, faFilm, faClosedCaptioning, faImage,
  faMicrochip, faLayerGroup, faDiagramProject,
  faCircleCheck, faCommentDots,
  faBoxArchive, faRocket, faShieldHalved,
  faMicrophone, faExpand, faWandMagicSparkles, faBrain,
  faArrowRightToBracket, faArrowRightFromBracket,
  faFingerprint,
  faFileImport, faGears, faClapperboard, faCheckDouble,
} from '@fortawesome/free-solid-svg-icons';
import { H_LEFT, H_TOP, H_BOTTOM, H_RIGHT, H_JOB, H_REVIEW } from './nodes/nodeTypes';

// Export-context groups (request → process → response model)
export type ExportGroup = 'input' | 'data' | 'process' | 'output';
// Workflow-context groups (production pipeline model)
export type WorkflowGroup = 'ingest' | 'process' | 'render' | 'review' | 'delivery' | 'ai' | 'auth';

export type PaletteItem = {
  type: string;
  label: string;
  subtitle: string;
  icon: IconDefinition;
  bgColor: string;
  iconColor: string;
  // Group in the export palette. Items exclusive to the workflow palette use 'review' | 'delivery' | 'ai'
  // (which overlap conceptually) and are re-grouped for workflow via WORKFLOW_GROUP_BY_TYPE.
  group: ExportGroup | 'review' | 'delivery' | 'ai';
};

export const NODE_PALETTE: PaletteItem[] = [
  { type: 'requestNode',       label: 'Request',      subtitle: 'HTTP Request input',  icon: faArrowRightToBracket,  bgColor: '#0e2537', iconColor: H_LEFT,   group: 'input' },
  { type: 'credentialNode',    label: 'Credential',   subtitle: 'Project credential',  icon: faFingerprint,          bgColor: '#160e38', iconColor: '#818cf8', group: 'data' },
  { type: 'dataSourceNode',    label: 'Data Source',  subtitle: 'DB collection',       icon: faDatabase,     bgColor: '#0d2a1e', iconColor: H_BOTTOM, group: 'data' },
  { type: 'jsonInputNode',     label: 'JSON Data',    subtitle: 'Static data feed',    icon: faCode,         bgColor: '#1e1403', iconColor: H_RIGHT,  group: 'data' },
  { type: 'apiConnectionNode', label: 'API',          subtitle: 'External endpoint',   icon: faGlobe,        bgColor: '#0b1e35', iconColor: H_LEFT,   group: 'data' },
  { type: 'processNode',       label: 'Transform',    subtitle: 'Data transformation', icon: faArrowsRotate, bgColor: '#0e1f35', iconColor: '#60a5fa', group: 'process' },
  { type: 'processNode',       label: 'Auth',         subtitle: 'Authentication',      icon: faKey,          bgColor: '#1e1030', iconColor: H_TOP,    group: 'process' },
  { type: 'processNode',       label: 'Custom',       subtitle: 'Custom step',         icon: faWrench,       bgColor: '#251a0a', iconColor: H_RIGHT,  group: 'process' },
  { type: 'responseNode',      label: 'Response',     subtitle: 'HTTP Response output', icon: faArrowRightFromBracket, bgColor: '#1e1403', iconColor: H_RIGHT, group: 'output' },
  { type: 'filterNode',        label: 'Filter',       subtitle: 'Output filter',       icon: faFilter,           bgColor: '#1a1200', iconColor: H_RIGHT,  group: 'output' },
  { type: 'filterNode',        label: 'Transform',    subtitle: 'Output transform',    icon: faArrowRight,       bgColor: '#1a1200', iconColor: H_RIGHT,  group: 'output' },
  { type: 'ingestNode',        label: 'Ingest',       subtitle: 'Import asset',        icon: faCloudArrowDown,   bgColor: '#1a0d00', iconColor: H_JOB,    group: 'data' },
  { type: 'transcodeNode',     label: 'Transcode',    subtitle: 'Convert media',       icon: faFilm,             bgColor: '#14103a', iconColor: H_TOP,    group: 'process' },
  { type: 'captionNode',       label: 'Captions',     subtitle: 'Generate captions',   icon: faClosedCaptioning, bgColor: '#1a0f2e', iconColor: '#c084fc', group: 'process' },
  { type: 'thumbnailNode',      label: 'Thumbnail',     subtitle: 'Extract frame',       icon: faImage,          bgColor: '#0d2016', iconColor: '#4ade80', group: 'process' },
  { type: 'renderJobNode',      label: 'Render Job',    subtitle: 'Farm render job',     icon: faMicrochip,      bgColor: '#1a0d00', iconColor: H_JOB,    group: 'process' },
  { type: 'formatConvertNode',  label: 'Convert',       subtitle: '3D format convert',   icon: faArrowsRotate,   bgColor: '#0b1e35', iconColor: H_LEFT,   group: 'process' },
  { type: 'lodNode',            label: 'LOD',           subtitle: 'Generate LOD levels', icon: faLayerGroup,     bgColor: '#0d2216', iconColor: '#2dd4bf', group: 'process' },
  { type: 'assetDependencyNode', label: 'Dependencies',  subtitle: 'Resolve asset tree',  icon: faDiagramProject, bgColor: '#0d2a1e', iconColor: H_BOTTOM,  group: 'data' },
  { type: 'reviewGateNode',    label: 'Review Gate',   subtitle: 'Require approvals',    icon: faCircleCheck,  bgColor: '#1a0a2e', iconColor: H_REVIEW, group: 'review' },
  { type: 'annotationNode',    label: 'Annotations',   subtitle: 'Frame annotations',    icon: faCommentDots,  bgColor: '#1a0a2e', iconColor: H_REVIEW, group: 'review' },
  { type: 'qcCheckNode',          label: 'QC Check',       subtitle: 'Quality checks',       icon: faShieldHalved,     bgColor: '#0d2016', iconColor: H_BOTTOM, group: 'delivery' },
  { type: 'deliverableNode',      label: 'Deliverable',    subtitle: 'Package artifact',     icon: faBoxArchive,       bgColor: '#1e1300', iconColor: H_RIGHT,  group: 'delivery' },
  { type: 'distributionNode',     label: 'Distribution',   subtitle: 'Publish to platform',  icon: faRocket,           bgColor: '#1a0d00', iconColor: H_JOB,    group: 'delivery' },
  { type: 'transcriptionNode',    label: 'Transcription',  subtitle: 'Speech to text',       icon: faMicrophone,       bgColor: '#1a0a2e', iconColor: H_REVIEW, group: 'ai' },
  { type: 'upscaleNode',          label: 'Upscale',        subtitle: 'AI image upscaling',   icon: faExpand,           bgColor: '#0d2016', iconColor: H_BOTTOM, group: 'ai' },
  { type: 'proceduralAssetNode',  label: 'Generate Asset', subtitle: 'AI asset generation',  icon: faWandMagicSparkles, bgColor: '#1a0a2e', iconColor: H_REVIEW, group: 'ai' },
  { type: 'pipelineSuggestNode',  label: 'AI Suggest',     subtitle: 'Pipeline suggestions', icon: faBrain,     bgColor: '#1a0a2e', iconColor: H_REVIEW, group: 'ai' },
];

// ─── Export context ──────────────────────────────────────────────────────────

export const EXPORT_PALETTE_TYPES = new Set(['requestNode', 'responseNode', 'dataSourceNode', 'jsonInputNode', 'apiConnectionNode', 'credentialNode', 'filterNode']);

export const EXPORT_PALETTE_GROUPS: { key: ExportGroup; label: string; color: string }[] = [
  { key: 'input',   label: 'Input',   color: H_LEFT },
  { key: 'data',    label: 'Data',    color: H_BOTTOM },
  { key: 'process', label: 'Process', color: H_TOP },
  { key: 'output',  label: 'Output',  color: H_RIGHT },
];

// ─── Workflow context ──────────────────────────────────────────────────────────

// Types exclusive to the export editor — never shown or kept in the workflow canvas.
export const EXPORT_ONLY_TYPES = new Set(['requestNode', 'responseNode', 'filterNode', 'streambyNode', 'jsonInputNode']);

// Full workflow palette (developer mode). Order defines display order within groups.
export const WORKFLOW_DEVELOPER_TYPES = new Set([
  'ingestNode', 'dataSourceNode', 'apiConnectionNode',
  'transcodeNode', 'captionNode', 'thumbnailNode', 'formatConvertNode', 'lodNode', 'upscaleNode', 'transcriptionNode',
  'renderJobNode', 'qcCheckNode',
  'reviewGateNode', 'annotationNode',
  'deliverableNode', 'distributionNode',
  'proceduralAssetNode', 'pipelineSuggestNode',
  'credentialNode',
]);

// Designer mode — non-technical groups only (ingest, review, delivery, AI generation).
export const WORKFLOW_DESIGNER_TYPES = new Set([
  'ingestNode',
  'reviewGateNode', 'annotationNode',
  'deliverableNode', 'distributionNode',
  'proceduralAssetNode',
]);

// Workflow group assignment per node type — independent of the export-oriented `group` field.
const WORKFLOW_GROUP_BY_TYPE: Record<string, WorkflowGroup> = {
  ingestNode: 'ingest', dataSourceNode: 'ingest', apiConnectionNode: 'ingest',
  transcodeNode: 'process', captionNode: 'process', thumbnailNode: 'process', formatConvertNode: 'process', lodNode: 'process', upscaleNode: 'process', transcriptionNode: 'process',
  renderJobNode: 'render', qcCheckNode: 'render',
  reviewGateNode: 'review', annotationNode: 'review',
  deliverableNode: 'delivery', distributionNode: 'delivery',
  proceduralAssetNode: 'ai', pipelineSuggestNode: 'ai',
  credentialNode: 'auth',
};

export const WORKFLOW_PALETTE_GROUPS: { key: WorkflowGroup; label: string; icon: IconDefinition; color: string }[] = [
  { key: 'ingest',   label: 'Ingest',   icon: faFileImport,          color: H_JOB },
  { key: 'process',  label: 'Process',  icon: faGears,               color: H_TOP },
  { key: 'render',   label: 'Render',   icon: faClapperboard,        color: H_JOB },
  { key: 'review',   label: 'Review',   icon: faCheckDouble,         color: H_REVIEW },
  { key: 'delivery', label: 'Delivery', icon: faRocket,              color: H_JOB },
  { key: 'ai',       label: 'AI',       icon: faWandMagicSparkles,   color: H_REVIEW },
  { key: 'auth',     label: 'Auth',     icon: faKey,                 color: '#818cf8' },
];

// ─── Palette resolution ────────────────────────────────────────────────────────

export type NodeContext = 'export' | 'workflow';

// A palette item tagged with the group it belongs to in the active context.
export type ContextPaletteItem = PaletteItem & { contextGroup: string };

export function getPaletteForContext(ctx: NodeContext, mode: 'developer' | 'designer'): ContextPaletteItem[] {
  if (ctx === 'export') {
    return NODE_PALETTE
      .filter(item => EXPORT_PALETTE_TYPES.has(item.type))
      .map(item => ({ ...item, contextGroup: item.group }));
  }
  const allowed = mode === 'designer' ? WORKFLOW_DESIGNER_TYPES : WORKFLOW_DEVELOPER_TYPES;
  return NODE_PALETTE
    .filter(item => allowed.has(item.type) && WORKFLOW_GROUP_BY_TYPE[item.type] !== undefined)
    .map(item => ({ ...item, contextGroup: WORKFLOW_GROUP_BY_TYPE[item.type] }));
}

export function getGroupsForContext(ctx: NodeContext, mode: 'developer' | 'designer'): { key: string; label: string; color: string; icon?: IconDefinition }[] {
  if (ctx === 'export') {
    // Export never surfaces the standalone 'input' group beyond request; keep the historical 3-group set.
    return EXPORT_PALETTE_GROUPS.filter(g => g.key === 'input' || g.key === 'data' || g.key === 'output');
  }
  const allowed = mode === 'designer' ? WORKFLOW_DESIGNER_TYPES : WORKFLOW_DEVELOPER_TYPES;
  const activeGroups = new Set(
    NODE_PALETTE
      .filter(item => allowed.has(item.type))
      .map(item => WORKFLOW_GROUP_BY_TYPE[item.type])
      .filter((g): g is WorkflowGroup => g !== undefined),
  );
  return WORKFLOW_PALETTE_GROUPS.filter(g => activeGroups.has(g.key));
}

export const edgeColorForSource = (sourceHandle: string | null | undefined, srcType: string): string => {
  if (srcType === 'jsonInputNode') return H_RIGHT;
  if (srcType === 'credentialNode' || sourceHandle === 'out-credentials') return '#818cf8';
  if (sourceHandle === 'out-top' || sourceHandle === 'out-process') return H_TOP;
  if (sourceHandle === 'out-bottom' || sourceHandle === 'out-stream') return H_BOTTOM;
  if (sourceHandle === 'out-right' && srcType === 'streambyNode') return H_RIGHT;
  if (sourceHandle === 'out-captions') return H_RIGHT;
  if (sourceHandle === 'out-thumb') return H_RIGHT;
  if (sourceHandle === 'out-lod') return H_BOTTOM;
  if (sourceHandle === 'out-review') return H_REVIEW;
  if (sourceHandle === 'out-transcript') return H_REVIEW;
  return H_LEFT;
};
