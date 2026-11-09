import { getPaletteForContext, getGroupsForContext, EXPORT_PALETTE_TYPES, EXPORT_ONLY_TYPES } from './nodePalette';
import { WORKFLOW_TEMPLATES } from './workflowTemplates';

const typesOf = (ctx: 'export' | 'workflow' | 'pipeline', mode: 'developer' | 'designer') =>
  new Set(getPaletteForContext(ctx, mode).map(i => i.type));

const groupKeysOf = (ctx: 'export' | 'workflow' | 'pipeline', mode: 'developer' | 'designer') =>
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
      for (const t of ['shotNode', 'assemblyNode', 'masterNode', 'colorGradeNode', 'distributionNode']) {
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

    it("doesn't offer Shot, Assembly or Master: they're steps of a pipeline", () => {
      for (const t of ['shotNode', 'assemblyNode', 'masterNode']) expect(types.has(t)).toBe(false);
    });

    it("offers no processing step: the workflow runs none (they're a pipeline's, done by a worker)", () => {
      for (const t of ['colorGradeNode', 'audioMixNode', 'subtitleNode', 'vfxNode', 'transcriptionNode', 'upscaleNode', 'proceduralAssetNode', 'pipelineSuggestNode']) {
        expect(types.has(t)).toBe(false);
      }
      expect(types.has('exportFormatNode')).toBe(true);
    });

    it("doesn't offer Distribution: StreamBy sends nothing to a platform", () => {
      expect(types.has('distributionNode')).toBe(false);
    });

    it('includes pipelineRefNode (workflow references pipelines)', () => {
      expect(types.has('pipelineRefNode')).toBe(true);
    });

    it('no longer surfaces the generic StreamBy media nodes superseded by the AV nodes', () => {
      for (const t of ['transcodeNode', 'captionNode', 'thumbnailNode', 'renderJobNode', 'formatConvertNode', 'lodNode', 'qcCheckNode']) {
        expect(types.has(t)).toBe(false);
      }
    });

    it('keeps the shared ingest, review and delivery nodes', () => {
      for (const t of ['ingestNode', 'connectionNode', 'dataSourceNode', 'reviewGateNode', 'deliverableNode']) {
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

    it('exposes only the essentials (pipeline ref, review, credits sheet, deliverable)', () => {
      expect(types).toEqual(new Set([
        'pipelineRefNode',
        'reviewGateNode', 'creditsSheetNode',
        'deliverableNode',
      ]));
    });

    it('hides technical process/AI nodes', () => {
      for (const t of ['colorGradeNode', 'audioMixNode', 'vfxNode', 'connectionNode', 'pipelineSuggestNode', 'distributionNode']) {
        expect(types.has(t)).toBe(false);
      }
    });
  });

  describe('pipeline context', () => {
    const dev = typesOf('pipeline', 'developer');
    const des = typesOf('pipeline', 'designer');

    it('developer exposes the steps people do, audiovisual, the process steps a worker does, review and delivery', () => {
      for (const t of [
        'meetingNode', 'tasksNode',
        'shotNode', 'assemblyNode', 'masterNode',
        'transcodeNode', 'thumbnailNode', 'formatConvertNode', 'lodNode',
        'colorGradeNode', 'audioMixNode', 'subtitleNode', 'vfxNode', 'transcriptionNode', 'upscaleNode',
        'reviewGateNode', 'annotationNode', 'creditsSheetNode',
        'exportFormatNode', 'deliverableNode',
      ]) {
        expect(dev.has(t)).toBe(true);
      }
    });

    it("doesn't offer Distribution: StreamBy sends nothing to a platform", () => {
      expect(dev.has('distributionNode')).toBe(false);
    });

    it('never nests pipelines (no pipelineRefNode) and excludes orchestration/infra + AI', () => {
      for (const t of ['pipelineRefNode', 'connectionNode', 'dataSourceNode', 'ingestNode', 'proceduralAssetNode', 'pipelineSuggestNode', 'captionNode', 'renderJobNode', 'qcCheckNode']) {
        expect(dev.has(t)).toBe(false);
      }
    });

    it('designer exposes the steps people do, audiovisual, review and delivery', () => {
      expect(des).toEqual(new Set([
        'meetingNode', 'tasksNode',
        'shotNode', 'assemblyNode', 'masterNode',
        'reviewGateNode', 'deliverableNode',
      ]));
    });
  });
});

describe('getGroupsForContext', () => {
  it('export context uses input/data/output groups', () => {
    expect(groupKeysOf('export', 'developer')).toEqual(['input', 'data', 'output']);
  });

  it('workflow developer context has no audiovisual group, its Pipeline node under process', () => {
    expect(groupKeysOf('workflow', 'developer')).toEqual(['ingest', 'process', 'review', 'delivery']);
    expect(getPaletteForContext('workflow', 'developer').find(i => i.type === 'pipelineRefNode')?.contextGroup).toBe('process');
  });

  it('workflow designer context surfaces only process, review, delivery', () => {
    expect(groupKeysOf('workflow', 'designer')).toEqual(['process', 'review', 'delivery']);
  });

  it('pipeline developer context surfaces people, audiovisual, process, review, delivery', () => {
    expect(groupKeysOf('pipeline', 'developer')).toEqual(['people', 'audiovisual', 'process', 'review', 'delivery']);
  });

  it('pipeline designer context surfaces people, audiovisual, review, delivery', () => {
    expect(groupKeysOf('pipeline', 'designer')).toEqual(['people', 'audiovisual', 'review', 'delivery']);
  });

  it("offers a pipeline's steps done by people under People, and none of them to the workflow", () => {
    const people = getPaletteForContext('pipeline', 'developer').filter(i => i.contextGroup === 'people').map(i => i.type);
    expect(people).toEqual(['meetingNode', 'tasksNode']);
    expect(typesOf('workflow', 'developer').has('tasksNode')).toBe(false);
  });

  it('labels the category of Shot, Assembly and Master "Audiovisual"; no palette has one called Production', () => {
    const labels = getGroupsForContext('pipeline', 'developer').map(g => g.label);
    expect(labels).toContain('Audiovisual');
    expect(labels).not.toContain('Production');
  });

  it('every palette item maps to an active group in its context', () => {
    for (const ctx of ['export', 'workflow', 'pipeline'] as const) {
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
    expect(EXPORT_ONLY_TYPES).toEqual(new Set(['requestNode', 'responseNode', 'filterNode', 'streambyNode', 'jsonInputNode', 'documentsNode']));
  });
});

describe('WORKFLOW_TEMPLATES', () => {
  const uses = (context: 'workflow' | 'pipeline') => WORKFLOW_TEMPLATES
    .filter(t => t.contexts.includes(context))
    .flatMap(t => t.schema.nodes.map(n => n.type));

  it("doesn't bring Shot, Assembly or Master to the workflow canvas; a pipeline's still do", () => {
    for (const t of ['shotNode', 'assemblyNode', 'masterNode']) {
      expect(uses('workflow')).not.toContain(t);
      expect(uses('pipeline')).toContain(t);
    }
  });
});
