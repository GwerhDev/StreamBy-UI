type SchemaNode = { id: string; type?: string; data?: Record<string, unknown> };
type SchemaEdge = { source?: string; sourceHandle?: string; target?: string; targetHandle?: string };

// Walks the saved node graph and computes a client-side preview of the response.
// Only JSON Data nodes can be evaluated here; API/DB nodes require server execution.
export function computeResponseFromSchema(
  schema: { nodes: object[]; edges: object[] } | null | undefined
): unknown {
  if (!schema) return null;
  const nodes = schema.nodes as SchemaNode[];
  const edges  = schema.edges as SchemaEdge[];

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
        return [];
      });
  };

  const dataLayer = collectJsonAt('streamby', 'in-bottom');
  if (dataLayer.length === 0) return null;

  const result: unknown = dataLayer.length === 1 ? dataLayer[0] : dataLayer;

  const walkFilters = (srcId: string, srcHandle: string): void => {
    const next = edges.find(e => e.source === srcId && e.sourceHandle === srcHandle);
    if (!next?.target) return;
    const filterNode = nodes.find(n => n.id === next.target);
    if (filterNode?.type === 'filterNode') {
      walkFilters(next.target, 'out-filter');
    }
  };
  walkFilters('streamby', 'out-right');

  return result;
}
