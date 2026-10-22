import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import { RootState, AppDispatch } from '../../store';
import { setCurrentProject } from '../../store/currentProjectSlice';
import { addApiResponse } from '../../store/apiResponsesSlice';
import { getProjectWorkflow, updateProjectWorkflow } from '../../services/workflow';
import { Project, Workflow, DbConnection } from '../../interfaces';
import { rebuildSchemaFromProject, WorkflowCanvas } from '../components/Workflow/WorkflowCanvas';
import { NodeSkeleton } from '../components/NodeViewer/NodeSkeleton';

// Derive a sorted fingerprint of all resource node IDs from the current project state.
export function projectFingerprint(project: Project): string {
  const ids = [
    ...(project.dbConnections ?? []).map((db: DbConnection) => `db-${db.id}`),
    ...(project.connections ?? []).map((api: any) => `api-${api.id}`),
    ...(project.storageConnections ?? []).map((s: any) => `storage-${s.id}`),
    ...(project.exports ?? []).map((exp: any) => `export-${exp.id}`),
    ...(project.pipelines ?? []).map(p => `pipeline-${p.id}`),
  ];
  return ids.sort().join(',');
}

// Derive the same fingerprint from node IDs already saved in the schema.
export function schemaFingerprint(schemaNodes: any[]): string {
  const prefixes = ['db-', 'api-', 'storage-', 'export-', 'pipeline-'];
  return schemaNodes
    .map((n: any) => n.id as string)
    .filter(id => prefixes.some(p => id?.startsWith(p)))
    .sort()
    .join(',');
}

export function WorkflowPage() {
  const { id: projectId } = useParams<{ id: string }>();
  const dispatch = useDispatch<AppDispatch>();
  const currentProject = useSelector((state: RootState) => state.currentProject.data);

  const [workflow, setWorkflow] = useState<Workflow | null>(null);
  const [loading, setLoading] = useState(true);

  const resourceKey = [
    ...(currentProject?.dbConnections ?? []).map((db: DbConnection) => db.id),
    ...(currentProject?.connections ?? []).map((api: any) => api.id),
    ...(currentProject?.storageConnections ?? []).map((s: any) => s.id),
    ...(currentProject?.exports ?? []).map((exp: any) => exp.id),
    ...(currentProject?.pipelines ?? []).map(p => p.id),
  ].join(',');

  useEffect(() => {
    if (!projectId || !currentProject) return;

    let cancelled = false;
    setLoading(true);

    const run = async () => {
      let wf: Workflow;

      try {
        wf = await getProjectWorkflow(projectId);
      } catch {
        // No workflow yet — PATCH upserts the single project workflow.
        try {
          wf = await updateProjectWorkflow(projectId, {
            name: 'Workflow',
            description: 'Project workflow',
          });
        } catch (createErr: any) {
          if (!cancelled) dispatch(addApiResponse({ message: createErr?.message || 'Failed to create workflow', type: 'error' }));
          return;
        }
      }

      const schemaNodes: any[] = (wf.nodeSchema as any)?.nodes ?? [];
      // Stale if export nodes still use old filterNode type (before exportNode was introduced)
      const hasLegacyExportNodes = schemaNodes.some(
        n => n.id?.startsWith('export-') && n.type === 'filterNode',
      );
      // Stale if DB nodes were expanded into collection/record sub-nodes (old workflow schema)
      const hasLegacyCollectionNodes = schemaNodes.some(
        n => n.id?.startsWith('coll-') || n.id?.startsWith('rec-'),
      );
      // Stale if the central orchestrator node still uses the old streambyNode type
      const hasLegacyOrchestratorType = schemaNodes.some(
        n => n.id === 'streamby' && n.type === 'streambyNode',
      );
      // Stale if edges still use out-right sourceHandle (changed to out-stream)
      const hasLegacyOutRightEdges = ((wf.nodeSchema as any)?.edges ?? []).some(
        (e: any) => e.sourceHandle === 'out-right' && e.target === 'streamby',
      );
      // Stale if the orchestrator still uses the pre-TCORE-64 side layout (in-left for
      // inputs, out-right for exports) instead of in-top/out-bottom.
      const schemaEdges: any[] = (wf.nodeSchema as any)?.edges ?? [];
      const hasLegacyOrchestratorLayout = schemaEdges.some(
        (e: any) => (e.target === 'streamby' && e.targetHandle === 'in-left')
          || (e.source === 'streamby' && e.sourceHandle === 'out-right'),
      );
      // Stale without its orchestrator: a schema that only has nodes placed on it (an agent
      // adds a production node before anything is drawn) still needs its resources drawn.
      const hasOrchestrator = schemaNodes.some(n => n.id === 'streamby');
      const isStale =
        !wf.nodeSchema ||
        !hasOrchestrator ||
        hasLegacyExportNodes ||
        hasLegacyCollectionNodes ||
        hasLegacyOrchestratorType ||
        hasLegacyOutRightEdges ||
        hasLegacyOrchestratorLayout ||
        schemaFingerprint(schemaNodes) !== projectFingerprint(currentProject);

      if (isStale) {
        try {
          // The nodes placed on it (by a user, or an agent) stay; only the drawn ones change.
          const schema = rebuildSchemaFromProject(currentProject, wf.nodeSchema as Parameters<typeof rebuildSchemaFromProject>[1]);
          wf = await updateProjectWorkflow(projectId, { nodeSchema: schema });
        } catch {
          // Best-effort — proceed without schema; WorkflowCanvas will show TemplatePicker
        }
      }

      if (!cancelled) {
        setWorkflow(wf);
        dispatch(setCurrentProject({ ...currentProject, workflow: wf }));
      }
    };

    run().finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, currentProject?.id, resourceKey]);

  if (loading || !currentProject) return <NodeSkeleton />;
  if (!workflow) return null;

  return <WorkflowCanvas workflow={workflow} />;
}
