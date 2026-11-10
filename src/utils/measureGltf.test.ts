import { describe, expect, it } from 'vitest';
import { AnimationClip, BoxGeometry, Group, InstancedMesh, Mesh, MeshStandardMaterial, PlaneGeometry, Texture } from 'three';
import { measureGltf, sameMeasurements } from './measureGltf';

const texture = (name: string, width: number, height: number, mimeType?: string) => {
  const t = new Texture({ width, height } as unknown as HTMLImageElement);
  t.name = name;
  if (mimeType) t.userData.mimeType = mimeType;
  return t;
};

describe('measureGltf', () => {
  it("counts a scene's triangles, vertices and meshes, instances included", () => {
    const scene = new Group();
    const skin = new MeshStandardMaterial();
    scene.add(new Mesh(new BoxGeometry(), skin)); // 12 triangles, 24 vertices (indexed)
    const inner = new Group();
    inner.add(new Mesh(new PlaneGeometry(), skin)); // 2 triangles, 4 vertices
    scene.add(inner);
    scene.add(new InstancedMesh(new PlaneGeometry(), new MeshStandardMaterial(), 3)); // 3 × 2 triangles
    const m = measureGltf({ scene });
    expect(m).toMatchObject({ triangles: 12 + 2 + 6, vertices: 24 + 4 + 12, meshes: 3, materials: 2, tool: 'streamby-inspector' });
  });

  it('lists each texture its materials use once, with its size and format', () => {
    const albedo = texture('goblin_albedo', 2048, 1024, 'image/png');
    const material = new MeshStandardMaterial({ map: albedo, normalMap: texture('goblin_normal', 512, 512, 'image/ktx2') });
    const other = new MeshStandardMaterial({ map: albedo, roughnessMap: texture('', 256, 256) });
    const scene = new Group();
    scene.add(new Mesh(new BoxGeometry(), material), new Mesh(new BoxGeometry(), other));
    expect(measureGltf({ scene }).textures).toEqual([
      { name: 'goblin_albedo', width: 2048, height: 1024, format: 'image/png' },
      { name: 'goblin_normal', width: 512, height: 512, format: 'image/ktx2' },
      { name: null, width: 256, height: 256, format: null },
    ]);
  });

  it('lists its animations, with their durations in seconds', () => {
    const clips = [new AnimationClip('Idle', 2.5, []), new AnimationClip('', 0.83333, [])];
    expect(measureGltf({ scene: new Group(), animations: clips }).animations).toEqual([
      { name: 'Idle', duration: 2.5 }, { name: null, duration: 0.833 },
    ]);
  });

  it("compares measurements by what's measured, not when or by whom", () => {
    const scene = new Group();
    scene.add(new Mesh(new BoxGeometry(), new MeshStandardMaterial()));
    const a = measureGltf({ scene });
    expect(sameMeasurements(a, { ...a, measuredAt: '2026-11-10', measuredBy: 'eli' })).toBe(true);
    expect(sameMeasurements(a, { ...a, triangles: 13 })).toBe(false);
    expect(sameMeasurements(a, null)).toBe(false);
  });
});
