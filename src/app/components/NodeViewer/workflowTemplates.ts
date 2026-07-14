import { Node, Edge } from 'reactflow';

export interface WorkflowTemplate {
  id: string;
  label: string;
  description: string;
  schema: { nodes: Node[]; edges: Edge[] };
}

export const BLANK_SCHEMA: { nodes: Node[]; edges: Edge[] } = { nodes: [], edges: [] };

export const WORKFLOW_TEMPLATES: WorkflowTemplate[] = [
  {
    id: 'api-data-service',
    label: 'API / Data Service',
    description: 'Load data with a defined shape, store it, and expose it through exports.',
    schema: {
      nodes: [
        {
          id: 'ds-1',
          type: 'dataSourceNode',
          position: { x: 0, y: 100 },
          data: { label: 'Data Source', subtitle: 'Database / API' },
        },
        {
          id: 'transform-1',
          type: 'processNode',
          position: { x: 320, y: 100 },
          data: { label: 'Transform', subtitle: 'Shape your data', bgColor: '#0e1f35', iconColor: '#60a5fa' },
        },
        {
          id: 'filter-1',
          type: 'filterNode',
          position: { x: 640, y: 100 },
          data: { label: 'Filter', subtitle: 'Expose to exports' },
        },
      ],
      edges: [
        {
          id: 'e-ds-transform',
          source: 'ds-1',
          sourceHandle: 'out-right',
          target: 'transform-1',
          targetHandle: 'in-left',
          animated: true,
          style: { stroke: '#34d399', strokeWidth: 2 },
        },
        {
          id: 'e-transform-filter',
          source: 'transform-1',
          sourceHandle: 'out-right',
          target: 'filter-1',
          targetHandle: 'in-left',
          animated: true,
          style: { stroke: '#fbbf24', strokeWidth: 2 },
        },
      ],
    },
  },
  {
    id: 'audiovisual-production',
    label: 'Audiovisual Production',
    description: 'Full audiovisual pipeline: shot → assembly → grade → mix → review → master → export → deliverable.',
    schema: {
      nodes: [
        { id: 'shot-1',      type: 'shotNode',       position: { x: 0,    y: 100 }, data: { label: 'Shot',         subtitle: 'Raw video clip',        fps: '24', resolution: '1920x1080' } },
        { id: 'assembly-1',  type: 'assemblyNode',   position: { x: 260,  y: 100 }, data: { label: 'Assembly',     subtitle: 'Edit timeline' } },
        { id: 'grade-1',     type: 'colorGradeNode', position: { x: 520,  y: 100 }, data: { label: 'Color Grade',  subtitle: 'LUT / colour adjust' } },
        { id: 'mix-1',       type: 'audioMixNode',   position: { x: 780,  y: 100 }, data: { label: 'Audio Mix',    subtitle: 'Mix audio tracks',      trackCount: '1' } },
        { id: 'review-1',    type: 'reviewGateNode', position: { x: 1040, y: 100 }, data: { label: 'Review Gate',  subtitle: 'Require approvals' } },
        { id: 'master-1',    type: 'masterNode',     position: { x: 1300, y: 100 }, data: { label: 'Master',       subtitle: 'Versioned master',      version: '1.0.0' } },
        { id: 'export-1',    type: 'exportFormatNode', position: { x: 1560, y: 100 }, data: { label: 'Export Format', subtitle: 'Codec / container',   codec: 'h264', container: 'mp4' } },
        { id: 'deliver-1',   type: 'deliverableNode', position: { x: 1820, y: 100 }, data: { label: 'Deliverable',  subtitle: 'Package artifact' } },
        { id: 'subtitle-1',  type: 'subtitleNode',   position: { x: 520,  y: 320 }, data: { label: 'Subtitles',    subtitle: 'SRT / VTT captions',    language: 'es', source: 'transcription', outputFormat: 'srt' } },
        { id: 'vfx-1',       type: 'vfxNode',        position: { x: 780,  y: 320 }, data: { label: 'VFX',          subtitle: 'Visual effects segment', status: 'pending' } },
      ],
      edges: [
        { id: 'e-shot-assembly',    source: 'shot-1',     sourceHandle: 'out-right',  target: 'assembly-1', targetHandle: 'in-left',    animated: true, style: { stroke: '#38B6FF', strokeWidth: 2 } },
        { id: 'e-assembly-grade',   source: 'assembly-1', sourceHandle: 'out-right',  target: 'grade-1',    targetHandle: 'in-left',    animated: true, style: { stroke: '#a78bfa', strokeWidth: 2 } },
        { id: 'e-grade-mix',        source: 'grade-1',    sourceHandle: 'out-right',  target: 'mix-1',      targetHandle: 'in-left',    animated: true, style: { stroke: '#34d399', strokeWidth: 2 } },
        { id: 'e-mix-review',       source: 'mix-1',      sourceHandle: 'out-right',  target: 'review-1',   targetHandle: 'in-process', animated: true, style: { stroke: '#34d399', strokeWidth: 2 } },
        { id: 'e-review-master',    source: 'review-1',   sourceHandle: 'out-review', target: 'master-1',   targetHandle: 'in-filter',  animated: true, style: { stroke: '#e879f9', strokeWidth: 2 } },
        { id: 'e-master-export',    source: 'master-1',   sourceHandle: 'out-filter', target: 'export-1',   targetHandle: 'in-filter',  animated: true, style: { stroke: '#fbbf24', strokeWidth: 2 } },
        { id: 'e-export-deliver',   source: 'export-1',   sourceHandle: 'out-filter', target: 'deliver-1',  targetHandle: 'in-filter',  animated: true, style: { stroke: '#fbbf24', strokeWidth: 2 } },
        { id: 'e-assembly-subtitle', source: 'assembly-1', sourceHandle: 'out-right', target: 'subtitle-1', targetHandle: 'in-left',    animated: true, style: { stroke: '#34d399', strokeWidth: 2 } },
        { id: 'e-assembly-vfx',     source: 'assembly-1', sourceHandle: 'out-right',  target: 'vfx-1',      targetHandle: 'in-left',    animated: true, style: { stroke: '#f97316', strokeWidth: 2 } },
      ],
    },
  },
];
