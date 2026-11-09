import { describe, expect, it } from 'vitest';
import { resolveContentType } from './contentType';

describe('resolveContentType', () => {
  it("keeps the browser's type when it has one", () => {
    expect(resolveContentType({ name: 'rock.png', type: 'image/png' })).toBe('image/png');
  });

  it("takes a 3D model's from its extension when the browser gives none, whatever its case", () => {
    expect(resolveContentType({ name: 'rock.glb', type: '' })).toBe('model/gltf-binary');
    expect(resolveContentType({ name: 'ROCK.GLTF', type: '' })).toBe('model/gltf+json');
    expect(resolveContentType({ name: 'rock.stl', type: '' })).toBe('model/stl');
  });

  it("is a generic binary for what it doesn't know, or a name with no extension", () => {
    expect(resolveContentType({ name: 'rock.xyz', type: '' })).toBe('application/octet-stream');
    expect(resolveContentType({ name: 'glb', type: '' })).toBe('application/octet-stream');
  });
});
