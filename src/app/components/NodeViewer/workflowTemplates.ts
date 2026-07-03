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
];
