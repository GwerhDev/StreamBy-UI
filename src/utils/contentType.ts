// The extensions of the 3D formats StreamBy takes, and their content types: a browser leaves a
// file's type empty for most of them (a .glb comes as ''), and the API needs one.
const EXTENSION_MIME: Record<string, string> = {
  glb: 'model/gltf-binary',
  gltf: 'model/gltf+json',
  obj: 'model/obj',
  fbx: 'application/octet-stream',
  stl: 'model/stl',
  ply: 'model/ply',
};

/** A file's content type: the browser's, or, when it has none, the one its extension says. */
export function resolveContentType(file: Pick<File, 'name' | 'type'>): string {
  if (file.type) return file.type;
  const ext = file.name.includes('.') ? file.name.split('.').pop()!.toLowerCase() : '';
  return EXTENSION_MIME[ext] ?? 'application/octet-stream';
}
