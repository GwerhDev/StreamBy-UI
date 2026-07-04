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

async function buildInitialSchema(projectId: string, project: Project, mgmtStorages: MgmtStorage[]) {
  const builtinDbs: BuiltinDb[] = await fetchBuiltinDatabases().catch(() => []);

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

  useEffect(() => {
    if (!projectId || !currentProject) return;

    let cancelled = false;
    setLoading(true);

    const run = async () => {
      let wf: Workflow;

      try {
        wf = await getProjectWorkflow(projectId);
      } catch {
        // No workflow yet — create one
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

      // Generate schema if missing or stale (saved before databases/records were included)
      const schemaNodes: any[] = (wf.nodeSchema as any)?.nodes ?? [];
      const hasCollectionNodes = schemaNodes.some(n => n.data?.subtitle === 'collection');
      const hasRecordNodes = schemaNodes.some(n => n.id?.startsWith('rec-'));
      const isStale =
        wf.nodeSchema &&
        (!schemaNodes.some(n => n.type === 'dataSourceNode') || (hasCollectionNodes && !hasRecordNodes));
      if (!wf.nodeSchema || isStale) {
        try {
          const schema = await buildInitialSchema(projectId, currentProject, mgmtStorages);
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
  }, [projectId, currentProject?.id]);

  if (loading || !currentProject) return <Spinner bg isLoading />;
  if (!workflow) return null;

  return <ProjectArchitecture workflow={workflow} />;
}
