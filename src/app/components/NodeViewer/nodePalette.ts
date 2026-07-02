import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import {
  faDatabase, faCode, faGlobe, faArrowsRotate, faKey, faWrench, faFilter, faArrowRight,
  faCloudArrowDown, faFilm, faClosedCaptioning, faImage,
} from '@fortawesome/free-solid-svg-icons';
import { H_LEFT, H_TOP, H_BOTTOM, H_RIGHT, H_JOB } from './nodes/nodeTypes';

export type PaletteItem = {
  type: string;
  label: string;
  subtitle: string;
  icon: IconDefinition;
  bgColor: string;
  iconColor: string;
  group: 'data' | 'process' | 'output';
};

export const NODE_PALETTE: PaletteItem[] = [
  { type: 'dataSourceNode',    label: 'Data Source',  subtitle: 'DB collection',       icon: faDatabase,     bgColor: '#0d2a1e', iconColor: H_BOTTOM, group: 'data' },
  { type: 'jsonInputNode',     label: 'JSON Data',    subtitle: 'Static data feed',    icon: faCode,         bgColor: '#1e1403', iconColor: H_RIGHT,  group: 'data' },
  { type: 'apiConnectionNode', label: 'API',          subtitle: 'External endpoint',   icon: faGlobe,        bgColor: '#0b1e35', iconColor: H_LEFT,   group: 'data' },
  { type: 'processNode',       label: 'Transform',    subtitle: 'Data transformation', icon: faArrowsRotate, bgColor: '#0e1f35', iconColor: '#60a5fa', group: 'process' },
  { type: 'processNode',       label: 'Auth',         subtitle: 'Authentication',      icon: faKey,          bgColor: '#1e1030', iconColor: H_TOP,    group: 'process' },
  { type: 'processNode',       label: 'Custom',       subtitle: 'Custom step',         icon: faWrench,       bgColor: '#251a0a', iconColor: H_RIGHT,  group: 'process' },
  { type: 'filterNode',        label: 'Filter',       subtitle: 'Output filter',       icon: faFilter,           bgColor: '#1a1200', iconColor: H_RIGHT,  group: 'output' },
  { type: 'filterNode',        label: 'Transform',    subtitle: 'Output transform',    icon: faArrowRight,       bgColor: '#1a1200', iconColor: H_RIGHT,  group: 'output' },
  { type: 'ingestNode',        label: 'Ingest',       subtitle: 'Import asset',        icon: faCloudArrowDown,   bgColor: '#1a0d00', iconColor: H_JOB,    group: 'data' },
  { type: 'transcodeNode',     label: 'Transcode',    subtitle: 'Convert media',       icon: faFilm,             bgColor: '#14103a', iconColor: H_TOP,    group: 'process' },
  { type: 'captionNode',       label: 'Captions',     subtitle: 'Generate captions',   icon: faClosedCaptioning, bgColor: '#1a0f2e', iconColor: '#c084fc', group: 'process' },
  { type: 'thumbnailNode',     label: 'Thumbnail',    subtitle: 'Extract frame',       icon: faImage,            bgColor: '#0d2016', iconColor: '#4ade80', group: 'process' },
];

export const PALETTE_GROUPS: { key: PaletteItem['group']; label: string; color: string }[] = [
  { key: 'data',    label: 'Data',    color: H_BOTTOM },
  { key: 'process', label: 'Process', color: H_TOP },
  { key: 'output',  label: 'Output',  color: H_RIGHT },
];

export const edgeColorForSource = (sourceHandle: string | null | undefined, srcType: string): string => {
  if (srcType === 'jsonInputNode') return H_RIGHT;
  if (sourceHandle === 'out-top' || sourceHandle === 'out-process') return H_TOP;
  if (sourceHandle === 'out-bottom' || sourceHandle === 'out-stream') return H_BOTTOM;
  if (sourceHandle === 'out-right' && srcType === 'streambyNode') return H_RIGHT;
  if (sourceHandle === 'out-captions') return H_RIGHT;
  if (sourceHandle === 'out-thumb') return H_RIGHT;
  return H_LEFT;
};
