import type { AnimationClip, Material, Object3D, Texture } from 'three';
import type { Measurements, MeasuredTexture } from '../services/assetMeasurements';

// What a loaded glTF measures, as the inspector sends it: its meshes' triangles and vertices
// (an instanced mesh counted once per instance), its materials and the textures they use, each
// once, and its animations.

type Loaded = { scene: Object3D; animations?: AnimationClip[] };

const isTexture = (value: unknown): value is Texture => !!value && (value as Texture).isTexture === true;

function textureOf(texture: Texture): MeasuredTexture {
  const image = texture.image as { width?: number; height?: number } | undefined;
  return {
    name: texture.name || null,
    width: image?.width ?? 0,
    height: image?.height ?? 0,
    // Set by GLTFLoader from the image's MIME type (image/png, image/jpeg, image/ktx2...).
    format: (texture.userData?.mimeType as string | undefined) ?? null,
  };
}

export function measureGltf(gltf: Loaded, tool = 'streamby-inspector'): Measurements {
  let triangles = 0;
  let vertices = 0;
  let meshes = 0;
  const materials = new Map<string, Material>();
  gltf.scene.traverse(object => {
    const mesh = object as Object3D & { isMesh?: boolean; geometry?: any; material?: Material | Material[]; count?: number; isInstancedMesh?: boolean };
    if (!mesh.isMesh || !mesh.geometry) return;
    meshes++;
    const instances = mesh.isInstancedMesh ? mesh.count ?? 1 : 1;
    const position = mesh.geometry.attributes?.position;
    const indexed = mesh.geometry.index;
    const count = indexed ? indexed.count : position?.count ?? 0;
    triangles += Math.floor(count / 3) * instances;
    vertices += (position?.count ?? 0) * instances;
    for (const material of Array.isArray(mesh.material) ? mesh.material : mesh.material ? [mesh.material] : []) {
      materials.set(material.uuid, material);
    }
  });
  const textures = new Map<string, Texture>();
  for (const material of materials.values()) {
    for (const value of Object.values(material)) if (isTexture(value)) textures.set(value.uuid, value);
  }
  return {
    triangles, vertices, meshes,
    materials: materials.size,
    textures: [...textures.values()].map(textureOf),
    animations: (gltf.animations ?? []).map(clip => ({ name: clip.name || null, duration: Math.round(clip.duration * 1000) / 1000 })),
    tool,
  };
}

/** Whether two measurements are of the same thing (when, by whom and with what aside). */
export function sameMeasurements(a: Measurements | null | undefined, b: Measurements | null | undefined): boolean {
  const core = (m: Measurements) => JSON.stringify([m.triangles, m.vertices, m.meshes, m.materials, m.textures, m.animations]);
  return !!a && !!b && core(a) === core(b);
}
