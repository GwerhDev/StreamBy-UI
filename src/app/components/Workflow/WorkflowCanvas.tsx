import s from './WorkflowCanvas.module.css';
import { useMemo, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye, faFloppyDisk, faPencil, faSpinner } from '@fortawesome/free-solid-svg-icons';
import { Node, Edge } from 'reactflow';
import { RootState, AppDispatch } from '../../../store';
import { setCurrentProject } from '../../../store/currentProjectSlice';
import { addApiResponse } from '../../../store/apiResponsesSlice';
import { ProjectLists, saveWorkflow, WorkflowConflict } from '../../../services/workflow';
import { Export, Workflow } from '../../../interfaces';
import { DrawnResource, NodeViewer, NodeViewerHandle } from '../NodeViewer/NodeViewer';
import { RemoveResourceModal } from '../Modals/RemoveResourceModal';
import { PROJECT_LIST } from '../../../services/projectResources';
import { TemplatePicker } from './TemplatePicker';
import { UnsavedChangesGuard, UnsavedChangesModal } from './UnsavedChanges';

interface Props {
  workflow: Workflow;
}

// What a schema is, for telling it changed: its nodes (where they are, what they hold) and its
// edges, not what the canvas adds to them (selection, measures).
export const schemaFingerprint = (schema: { nodes?: object[]; edges?: object[] } | null | undefined) => JSON.stringify({
  nodes: ((schema?.nodes ?? []) as Node[]).map(n => [n.id, n.type, n.position?.x, n.position?.y, n.data]),
  edges: ((schema?.edges ?? []) as Edge[]).map(e => [e.id, e.source, e.sourceHandle ?? null, e.target, e.targetHandle ?? null]),
});

// The project's workflow, edited: it defines the project. Saving it is one change on the server,
// made on the version it was opened at, that makes the project what it defines; until then,
// nothing in the project changes.
export function WorkflowCanvas({ workflow }: Props) {
  const { id: projectId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const currentProject = useSelector((state: RootState) => state.currentProject.data);

  // The workflow as last saved (or read): shown from it again after each save.
  const [current, setCurrent] = useState<Workflow>(workflow);
  const [localSchema, setLocalSchema] = useState<{ nodes: Node[]; edges: Edge[] } | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const nodeViewerRef = useRef<NodeViewerHandle>(null);
  // A resource's node deleted on the canvas, asked about before it goes (it's removed with the save).
  const [toRemove, setToRemove] = useState<DrawnResource | null>(null);
  // Whether the canvas has changes the workflow saved doesn't: the save button says so.
  const [dirty, setDirty] = useState(false);
  // Leaving edit mode with changes asks what to do with them; discarding them shows the canvas
  // as saved again (drawn anew).
  const [leaving, setLeaving] = useState(false);
  const [discards, setDiscards] = useState(0);
  const savedFingerprint = useMemo(() => schemaFingerprint(current.nodeSchema), [current.nodeSchema]);

  const displaySchema = useMemo<{ nodes: Node[]; edges: Edge[] } | null>(() => {
    if (localSchema !== null) return localSchema;
    const saved = current.nodeSchema as { nodes: Node[]; edges: Edge[] } | null | undefined;
    return saved?.nodes?.length ? saved : null;
  }, [localSchema, current.nodeSchema]);

  const nodeViewerKey = localSchema ? 'template' : `saved-${current.id}-${current.updatedAt}-${discards}`;

  const exportAdapter = useMemo<Export>(() => ({
    id: current.id,
    name: current.name,
    description: current.description ?? '',
    status: 'completed',
    createdAt: '',
    updatedAt: '',
    projectId: projectId ?? '',
    exportedBy: '',
    nodeSchema: displaySchema,
  }), [current, projectId, displaySchema]);

  const handleTemplateSelect = (schema: { nodes: Node[]; edges: Edge[] }) => {
    setLocalSchema(schema);
    setEditMode(true);
  };

  // The workflow and the project's lists as the server answers them.
  const show = (saved: Workflow, lists: ProjectLists) => {
    if (!projectId || !currentProject) return;
    setDirty(false);
    setLocalSchema(null);
    setCurrent(saved);
    dispatch(setCurrentProject({ ...currentProject, ...lists, workflow: saved }));
  };

  // Whether it was saved.
  const handleSave = async (): Promise<boolean> => {
    if (!projectId || !currentProject) return false;
    setSaving(true);
    try {
      const nodeSchema = nodeViewerRef.current?.getSchema() ?? null;
      const { data, project, errors } = await saveWorkflow(projectId, nodeSchema, current.updatedAt);
      show(data, project);
      for (const message of errors) dispatch(addApiResponse({ message, type: 'error' }));
      if (!errors.length) dispatch(addApiResponse({ message: 'Workflow saved.', type: 'success' }));
      return true;
    } catch (err: unknown) {
      if (err instanceof WorkflowConflict) {
        dispatch(addApiResponse({ message: err.message, type: 'error' }));
        if (err.workflow) setCurrent(err.workflow);
        setLocalSchema(null);
        setDirty(false);
      } else {
        dispatch(addApiResponse({ message: err instanceof Error ? err.message : 'Failed to save.', type: 'error' }));
      }
      return false;
    } finally {
      setSaving(false);
    }
  };

  const toggleMode = () => {
    if (editMode && dirty) { setLeaving(true); return; }
    setEditMode(e => !e);
  };
  const saveAndLeave = async () => {
    if (await handleSave()) { setLeaving(false); setEditMode(false); }
  };
  const discardAndLeave = () => {
    setLocalSchema(null);
    setDirty(false);
    setDiscards(n => n + 1);
    setLeaving(false);
    setEditMode(false);
  };

  if (displaySchema === null) {
    return (
      <div className={s.container}>
        <TemplatePicker context="workflow" onSelect={handleTemplateSelect} />
      </div>
    );
  }

  const saveButton = editMode ? (
    <button
      className={s.saveBtn}
      onClick={() => { handleSave(); }}
      disabled={saving || !dirty}
      title={saving ? 'Saving…' : dirty ? 'Save (unsaved changes)' : 'No changes to save'}
      data-testid="workflow-save"
    >
      <FontAwesomeIcon icon={saving ? faSpinner : faFloppyDisk} spin={saving} />
      {dirty && !saving && <span className={s.saveDot} data-testid="workflow-unsaved" />}
    </button>
  ) : null;

  return (
    <div className={s.container}>
      <NodeViewer
        key={nodeViewerKey}
        ref={nodeViewerRef}
        context="workflow"
        exportDetails={exportAdapter}
        editMode={editMode}
        dbConnections={currentProject?.dbConnections || []}
        storageConnections={currentProject?.storageConnections || []}
        integrationConnections={currentProject?.integrationConnections || []}
        projectId={projectId}
        canvasOverlay={saveButton}
        onOpenPipeline={pipelineId => navigate(`/project/${projectId}/workflow/pipelines/${pipelineId}/editor`)}
        onOpenExport={exportId => navigate(`/project/${projectId}/workflow/exports/${exportId}/editor`)}
        onRemoveResource={setToRemove}
        onChange={schema => setDirty(!!localSchema || schemaFingerprint(schema) !== savedFingerprint)}
      />

      {toRemove && (() => {
        const listed = ((currentProject?.[PROJECT_LIST[toRemove.kind]] ?? []) as { id: string; name?: string; integrationId?: string; isBuiltin?: boolean; source?: string }[])
          .find(r => String(r.id) === toRemove.id);
        return (
          <RemoveResourceModal
            kind={toRemove.kind}
            resource={{ id: toRemove.id, name: listed?.name ?? toRemove.name, integrationId: listed?.integrationId, isBuiltin: listed?.isBuiltin || listed?.source === 'builtin' }}
            onClose={() => setToRemove(null)}
            onConfirm={() => nodeViewerRef.current?.removeNodes([toRemove.nodeId])}
          />
        );
      })()}

      {leaving && (
        <UnsavedChangesModal saving={saving} leaving="going to view mode" onKeep={() => setLeaving(false)} onDiscard={discardAndLeave} onSave={saveAndLeave} />
      )}
      <UnsavedChangesGuard when={dirty} saving={saving} onSave={handleSave} onDiscard={() => setDirty(false)} />

      {/* Mode toggle — top center */}
      <div className={s.toggleOverlay}>
        <div
          className={s.track}
          role="switch"
          aria-checked={editMode}
          tabIndex={0}
          onClick={toggleMode}
          onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && toggleMode()}
          title={editMode ? 'Switch to view mode' : 'Switch to edit mode'}
        >
          <span className={`${s.thumb} ${editMode ? s.thumbRight : ''}`} />
          <div className={s.trackLabels}>
            <span className={`${s.trackLabel} ${!editMode ? s.trackLabelActive : s.trackLabelInactive}`}>
              <FontAwesomeIcon icon={faEye} />
              View
            </span>
            <span className={`${s.trackLabel} ${editMode ? s.trackLabelActive : s.trackLabelInactive}`}>
              <FontAwesomeIcon icon={faPencil} />
              Edit
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
