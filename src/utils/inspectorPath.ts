// Where a 3D or audio asset is inspected: under its storage, in its category (so each breadcrumb
// leads somewhere: the storage, its 3D models or audios, the asset).
export const INSPECTED_CATEGORIES = ['3d-models', 'audios'] as const;
export const isInspected = (category: string) => (INSPECTED_CATEGORIES as readonly string[]).includes(category);

export const inspectorPath = (projectId: string, connId: string | undefined, assetId: string, category: string = '3d-models') =>
  `/project/${projectId}/storage/${connId || 'builtin'}/${category}/${assetId}`;
