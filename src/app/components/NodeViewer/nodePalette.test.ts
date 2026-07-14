import { getPaletteForContext, getGroupsForContext, EXPORT_PALETTE_TYPES, EXPORT_ONLY_TYPES } from './nodePalette';

const typesOf = (ctx: 'export' | 'workflow', mode: 'developer' | 'designer') =>
  new Set(getPaletteForContext(ctx, mode).map(i => i.type));

const groupKeysOf = (ctx: 'export' | 'workflow', mode: 'developer' | 'designer') =>
  getGroupsForContext(ctx, mode).map(g => g.key);

describe('getPaletteForContext', () => {
  describe('export context', () => {
    it('exposes exactly the 7 export palette types (mode-independent)', () => {
      const dev = typesOf('export', 'developer');
      const des = typesOf('export', 'designer');
      expect(dev).toEqual(EXPORT_PALETTE_TYPES);
      expect(des).toEqual(EXPORT_PALETTE_TYPES);
    });

    it('never exposes audiovisual production nodes', () => {
      const types = typesOf('export', 'developer');
      for (const t of ['shotNode', 'assemblyNode', 'masterNode', 'colorGradeNode', 'distributeNode']) {
        expect(types.has(t)).toBe(false);
      }
    });
  });

  describe('workflow context — developer mode', () => {
    const types = typesOf('workflow', 'developer');

    it('excludes export-only types (request, response, filter, jsonInput)', () => {
      for (const t of ['requestNode', 'responseNode', 'filterNode', 'jsonInputNode']) {
        expect(types.has(t)).toBe(false);
      }
    });

    it('includes the audiovisual production nodes', () => {
      for (const t of ['shotNode', 'assemblyNode', 'colorGradeNode', 'audioMixNode', 'subtitleNode', 'vfxNode', 'exportFormatNode', 'masterNode', 'distributeNode']) {
        expect(types.has(t)).toBe(true);
      }
    });

    it('no longer surfaces the generic StreamBy media nodes superseded by the AV nodes', () => {
      for (const t of ['transcodeNode', 'captionNode', 'thumbnailNode', 'renderJobNode', 'formatConvertNode', 'lodNode', 'qcCheckNode']) {
        expect(types.has(t)).toBe(false);
      }
    });

    it('keeps the shared ingest, AI and auth nodes', () => {
      for (const t of ['ingestNode', 'credentialNode', 'apiConnectionNode', 'dataSourceNode', 'proceduralAssetNode', 'pipelineSuggestNode', 'reviewGateNode', 'deliverableNode']) {
        expect(types.has(t)).toBe(true);
      }
    });

    it('does not surface orchestrator/streamby as draggable palette items', () => {
      expect(types.has('orchestratorNode')).toBe(false);
      expect(types.has('streambyNode')).toBe(false);
    });
  });

  describe('workflow context — designer mode', () => {
    const types = typesOf('workflow', 'designer');

    it('exposes only the production essentials (shot, assembly, review, master, deliverable)', () => {
      expect(types).toEqual(new Set([
        'shotNode', 'assemblyNode', 'masterNode',
        'reviewGateNode',
        'deliverableNode',
      ]));
    });

    it('hides technical process/AI/auth nodes', () => {
      for (const t of ['colorGradeNode', 'audioMixNode', 'vfxNode', 'credentialNode', 'apiConnectionNode', 'pipelineSuggestNode', 'distributeNode']) {
        expect(types.has(t)).toBe(false);
      }
    });
  });
});

describe('getGroupsForContext', () => {
  it('export context uses input/data/output groups', () => {
    expect(groupKeysOf('export', 'developer')).toEqual(['input', 'data', 'output']);
  });

  it('workflow developer context leads with the production group', () => {
    expect(groupKeysOf('workflow', 'developer')).toEqual(['production', 'ingest', 'process', 'review', 'delivery', 'ai', 'auth']);
  });

  it('workflow designer context surfaces only production, review, delivery', () => {
    expect(groupKeysOf('workflow', 'designer')).toEqual(['production', 'review', 'delivery']);
  });

  it('every palette item maps to an active group in its context', () => {
    for (const ctx of ['export', 'workflow'] as const) {
      for (const mode of ['developer', 'designer'] as const) {
        const groupKeys = new Set(groupKeysOf(ctx, mode));
        for (const item of getPaletteForContext(ctx, mode)) {
          expect(groupKeys.has(item.contextGroup)).toBe(true);
        }
      }
    }
  });
});

describe('EXPORT_ONLY_TYPES', () => {
  it('lists the export-exclusive node types for defensive cleanup', () => {
    expect(EXPORT_ONLY_TYPES).toEqual(new Set(['requestNode', 'responseNode', 'filterNode', 'streambyNode', 'jsonInputNode']));
  });
});
