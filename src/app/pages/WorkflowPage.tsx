import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import { RootState, AppDispatch } from '../../store';
import { setCurrentProject } from '../../store/currentProjectSlice';
import { addApiResponse } from '../../store/apiResponsesSlice';
import { getProjectWorkflow, createWorkflow, updateProjectWorkflow } from '../../services/workflows';
import { fetchBuiltinDatabases, fetchTables, fetchRecords } from '../../services/database';
import { Project, Workflow, DbConnection } from '../../interfaces';
import { buildSchemaFromProject, BuiltinDb, MgmtStorage, ProjectArchitecture } from '../components/Workflows/ProjectArchitecture';
import { Spinner } from '../components/Spinner';

// Derive a sorted fingerprint of all resource node IDs from the current project state.
function projectFingerprint(project: Project, mgmtStorages: MgmtStorage[], builtinDbs: BuiltinDb[]): string {
  const ids = [
    ...builtinDbs.map(db => `builtin-db-${db.name}`),
    ...(project.dbConnections ?? []).map((db: DbConnection) => `db-${db.id}`),
    ...(project.apiConnections ?? []).map((api: any) => `api-${api.id}`),
    ...mgmtStorages.map((_, i) => `mgmt-storage-${i}`),
    ...(project.storageConnections ?? []).map((s: any) => `storage-${s.id}`),
    ...(project.exports ?? []).map((exp: any) => `export-${exp.id}`),
  ];
  return ids.sort().join(',');
}

// Derive the same fingerprint from node IDs already saved in the schema.
function schemaFingerprint(schemaNodes: any[]): string {
  const prefixes = ['builtin-db-', 'db-', 'api-', 'mgmt-storage-', 'storage-', 'export-'];
  return schemaNodes
    .map((n: any) => n.id as string)
    .filter(id => prefixes.some(p => id?.startsWith(p)))
    .sort()
    .join(',');
}

async function buildInitialSchema(
  projectId: string,
  project: Project,
  mgmtStorages: MgmtStorage[],
  builtinDbs: BuiltinDb[],
) {
  const allDbs = [
    ...builtinDbs.map(db => ({ key: `builtin-db-${db.name}`, connId: db.name })),
    ...(project.dbConnections ?? []).map((db: DbConnection) => ({ key: `db-${db.id}`, connId: db.id })),
  ];

  const tableEntries = await Promise.all(
    allDbs.map(async ({ key, connId }) => {
      try { return { key, connId, tables: await fetchTables(projectId, connId) }; }
      catch { return { key, connId, tables: [] as string[] }; }
    }),
  );

  const dbTablesMap = Object.fromEntries(tableEntries.map(e => [e.key, e.tables]));

  const recordEntries = await Promise.all(
    tableEntries.flatMap(({ key, connId, tables }) =>
      tables.map(async table => {
        try {
          const records = await fetchRecords(projectId, connId, table, 5);
          const ids = records.map((r: any, i: number) => String(r._id ?? r.id ?? i));
          return { mapKey: `${key}:${table}`, ids };
        } catch {
          return { mapKey: `${key}:${table}`, ids: [] as string[] };
        }
      }),
    ),
  );

  const tableRecordsMap = Object.fromEntries(recordEntries.map(e => [e.mapKey, e.ids]));

  return buildSchemaFromProject(project, mgmtStorages, builtinDbs, dbTablesMap, tableRecordsMap);
}

export function WorkflowPage() {
  const { id: projectId } = useParams<{ id: string }>();
  const dispatch = useDispatch<AppDispatch>();
  const currentProject = useSelector((state: RootState) => state.currentProject.data);
  const mgmtStorages: MgmtStorage[] = useSelector((state: RootState) => {
    const extended = state as RootState & { management?: { storages?: MgmtStorage[] } };
    return extended.management?.storages ?? [];
  });

  const [workflow, setWorkflow] = useState<Workflow | null>(null);
  const [loading, setLoading] = useState(true);

  // Stable key that changes whenever the project's resources change (no builtinDbs here — those
  // are system-level and fetched async; changes to project-owned resources are enough to trigger).
  const resourceKey = [
    ...(currentProject?.dbConnections ?? []).map((db: DbConnection) => db.id),
    ...(currentProject?.apiConnections ?? []).map((api: any) => api.id),
    ...(currentProject?.storageConnections ?? []).map((s: any) => s.id),
    ...(currentProject?.exports ?? []).map((exp: any) => exp.id),
    ...mgmtStorages.map((_, i) => i),
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
        try {
          wf = await createWorkflow(projectId, {
            name: 'Architecture',
            description: 'Project architecture overview',
          });
        } catch (createErr: any) {
          if (!cancelled) dispatch(addApiResponse({ message: createErr?.message || 'Failed to create workflow', type: 'error' }));
          return;
        }
      }

      // Fetch builtinDbs once — needed for both staleness check and regeneration.
      const builtinDbs: BuiltinDb[] = await fetchBuiltinDatabases().catch(() => []);

      const schemaNodes: any[] = (wf.nodeSchema as any)?.nodes ?? [];
      // Also stale if export nodes are still using the old filterNode type (before exportNode was introduced)
      const hasLegacyExportNodes = schemaNodes.some(
        n => n.id?.startsWith('export-') && n.type === 'filterNode',
      );
      const isStale =
        !wf.nodeSchema ||
        hasLegacyExportNodes ||
        schemaFingerprint(schemaNodes) !== projectFingerprint(currentProject, mgmtStorages, builtinDbs);

      if (isStale) {
        try {
          const schema = await buildInitialSchema(projectId, currentProject, mgmtStorages, builtinDbs);
          wf = await updateProjectWorkflow(projectId, { nodeSchema: schema });
        } catch {
          // Best-effort — proceed without schema; ProjectArchitecture will show TemplatePicker
        }
      }

      if (!cancelled) {
        setWorkflow(wf);
        const existingWorkflows = currentProject.workflows ?? [];
        const synced = existingWorkflows.some(w => w.id === wf.id)
          ? existingWorkflows.map(w => w.id === wf.id ? wf : w)
          : [wf, ...existingWorkflows];
        dispatch(setCurrentProject({ ...currentProject, workflows: synced }));
      }
    };

    run().finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, currentProject?.id, resourceKey]);

  if (loading || !currentProject) return <Spinner bg={false} isLoading />;
  if (!workflow) return null;

  return <ProjectArchitecture workflow={workflow} />;
}
