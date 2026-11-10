// Where a 3D asset is inspected: under its storage, in its category (so each breadcrumb leads
// somewhere: the storage, its 3D models, the asset).
export const inspectorPath = (projectId: string, connId: string | undefined, assetId: string) =>
  `/project/${projectId}/storage/${connId || 'builtin'}/3d-models/${assetId}`;
