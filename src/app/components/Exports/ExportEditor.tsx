import s from './ExportEditor.module.css';
import React, { DragEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../../../store';
import { getExport, updateExport } from '../../../services/exports';
import { ActionButton } from '../Buttons/ActionButton';
import { SecondaryButton } from '../Buttons/SecondaryButton';
import {
  faXmark, faCode, faSitemap,
  faTableColumns, faArrowLeft,
  faSave, faTriangleExclamation,
  faTerminal, faCircleCheck, faCircleXmark, faSpinner,
} from '@fortawesome/free-solid-svg-icons';
import { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useNavigate, useParams } from 'react-router-dom';
import { NodeViewer, NodeViewerHandle } from '../NodeViewer/NodeViewer';
import { ResponsePreview } from './ResponsePreview';
import { Export } from '../../../interfaces';
import { Panel, Group as PanelGroup, Separator as PanelResizeHandle } from 'react-resizable-panels';
import { Tabs, TabItem } from '../Tabs/Tabs';
import { SectionHeader } from '../SectionHeader/SectionHeader';
import { setCurrentExport, setExportLoading, setExportError } from '../../../store/currentExportSlice';
import { ModalShell } from '../Modals/ModalShell';
import { PipelineRunLog } from './PipelineRunLog';

type TabId = 'nodes' | 'response';
interface PanelState { id: string; tabs: TabId[]; activeTab: TabId; isOriginal: boolean; }
interface ColumnState { id: string; rows: PanelState[]; }

const TAB_DEFS: Record<TabId, { label: string; icon: IconDefinition }> = {
  nodes: { label: 'Nodes', icon: faSitemap },
  response: { label: 'Response', icon: faCode },
};
const ALL_TABS: TabId[] = ['nodes', 'response'];

let _c = 0;
const uid = () => `e${++_c}`;

function schemaKey(nodeSchema: unknown): string {
  if (!nodeSchema) return '';
  const schema = nodeSchema as { nodes: Array<{ id?: string; type?: string; data?: Record<string, unknown> }>; edges: Array<{ id?: string }> };
  const edgesKey = schema.edges.map(e => e.id ?? '').sort().join(',');
  const filterKey = schema.nodes
    .filter(n => n.data?.filterConfig)
    .map(n => `${n.id}:${JSON.stringify(n.data!.filterConfig)}`)
    .join('|');
  const recordKey = schema.nodes
    .filter(n => n.type === 'dataSourceNode' && n.data?.recordId)
    .map(n => `${n.id}:${n.data!.recordId as string}`)
    .join('|');
  return `${edgesKey}~~${filterKey}~~${recordKey}`;
}

export const ExportEditor: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const currentProject = useSelector((state: RootState) => state.currentProject);
  const { data: exportDetails, loading: sliceLoading } = useSelector((state: RootState) => state.currentExport);
  const { id: projectId, exportId } = useParams<{ id: string; exportId: string }>();

  const [submitting,    setSubmitting]    = useState(false);
  const [isDirty,       setIsDirty]       = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [pendingSchema, setPendingSchema] = useState<{ nodes: object[]; edges: object[] } | null>(null);
  const [schemaVersion, setSchemaVersion] = useState(0);
  const [isDragging,   setIsDragging]   = useState(false);
  const [dropTarget,   setDropTarget]   = useState<{ panelId: string; zone: 'top' | 'bottom' | 'left' | 'right' } | null>(null);
  const [showLog,      setShowLog]      = useState(false);

  const jobs = useSelector((state: RootState) => state.currentJob.jobs);
  const jobList = Object.values(jobs);
  const pipelineStatus: 'idle' | 'running' | 'error' = jobList.some(j => j.error)
    ? 'error'
    : jobList.some(j => j.progress < 100 && !j.error)
      ? 'running'
      : 'idle';
  const liveSchemaRef = useRef<{ nodes: object[]; edges: object[] } | null>(null);
  // Initialize from whatever is already in the slice — avoids false dirty when NodeViewer
  // mounts immediately because a previous navigation left data in Redux.
  const prevEdgesKey  = useRef<string>(schemaKey(exportDetails?.nodeSchema));
  const nodeViewerRef = useRef<NodeViewerHandle>(null);

  const handleSchemaChange = useCallback((schema: { nodes: object[]; edges: object[] }) => {
    liveSchemaRef.current = schema;
    const key = schemaKey(schema);
    if (key !== prevEdgesKey.current) {
      prevEdgesKey.current = key;
      setSchemaVersion(v => v + 1);
      setIsDirty(true);
    }
  }, []);

  // Reset drag state on dragend (fires even if drop is cancelled)
  useEffect(() => {
    const onDragEnd = () => { setIsDragging(false); setDropTarget(null); dragRef.current = null; };
    window.addEventListener('dragend', onDragEnd);
    return () => window.removeEventListener('dragend', onDragEnd);
  }, []);

  const getDropZone = (e: React.DragEvent, el: HTMLElement): 'top' | 'bottom' | 'left' | 'right' => {
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width;
    const y = (e.clientY - r.top) / r.height;
    return Math.abs(x - 0.5) > Math.abs(y - 0.5)
      ? (x < 0.5 ? 'left' : 'right')
      : (y < 0.5 ? 'top' : 'bottom');
  };

  const handlePanelBodyDragOver = useCallback((e: React.DragEvent<HTMLDivElement>, panelId: string) => {
    if (!dragRef.current) return;
    e.preventDefault();
    e.stopPropagation();
    const zone = getDropZone(e, e.currentTarget);
    setDropTarget(prev => (prev?.panelId === panelId && prev?.zone === zone ? prev : { panelId, zone }));
  }, []);

  const handlePanelBodyDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) setDropTarget(null);
  }, []);

  const splitAndDropTab = useCallback((targetPanelId: string, zone: 'top' | 'bottom' | 'left' | 'right') => {
    const drag = dragRef.current;
    if (!drag) return;
    dragRef.current = null;
    setDropTarget(null);
    setIsDragging(false);

    setColumns(prev => {
      let next: ColumnState[] = prev.map(col => ({ ...col, rows: [...col.rows] }));

      // Remove tab from source if not original
      if (!drag.isOriginal) {
        next = next.map(col => ({
          ...col,
          rows: col.rows
            .map(row => {
              if (row.id !== drag.fromPanelId) return row;
              const tabs = row.tabs.filter(t => t !== drag.tab);
              if (!tabs.length) return null as unknown as PanelState;
              return { ...row, tabs, activeTab: row.activeTab === drag.tab ? tabs[0] : row.activeTab };
            })
            .filter(Boolean) as PanelState[],
        })).filter(col => col.rows.length > 0);
      }

      // Find target panel after possible source removal
      let tCol = -1, tRow = -1;
      for (let ci = 0; ci < next.length; ci++)
        for (let ri = 0; ri < next[ci].rows.length; ri++)
          if (next[ci].rows[ri].id === targetPanelId) { tCol = ci; tRow = ri; }
      if (tCol === -1) return next;

      const newPanel: PanelState = { id: uid(), tabs: [drag.tab], activeTab: drag.tab, isOriginal: false };

      if (zone === 'right') {
        next.splice(tCol + 1, 0, { id: uid(), rows: [newPanel] });
      } else if (zone === 'left') {
        next.splice(tCol, 0, { id: uid(), rows: [newPanel] });
      } else {
        next = next.map((col, ci) => {
          if (ci !== tCol) return col;
          const rows = [...col.rows];
          rows.splice(zone === 'bottom' ? tRow + 1 : tRow, 0, newPanel);
          return { ...col, rows };
        });
      }
      return next;
    });
  }, []);

  const handlePanelBodyDrop = useCallback((e: React.DragEvent<HTMLDivElement>, panelId: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!dragRef.current || !dropTarget) return;
    splitAndDropTab(panelId, dropTarget.zone);
  }, [dropTarget, splitAndDropTab]);

  const [columns, setColumns] = useState<ColumnState[]>([
    { id: uid(), rows: [{ id: uid(), tabs: ALL_TABS, activeTab: 'nodes', isOriginal: true }] },
  ]);
  const dragRef = useRef<{ fromPanelId: string; tab: TabId; isOriginal: boolean } | null>(null);

  useEffect(() => {
    if (!projectId || !exportId) { dispatch(setExportError('Missing IDs.')); return; }
    const doFetch = async () => {
      dispatch(setExportLoading());
      try {
        const data = await getExport(projectId, exportId);
        if (data) {
          prevEdgesKey.current = schemaKey(data.nodeSchema);
          dispatch(setCurrentExport(data));
        } else {
          dispatch(setExportError('Export not found.'));
        }
      } catch (err: unknown) {
        dispatch(setExportError((err as { message: string }).message || 'Failed to fetch export.'));
      }
    };
    doFetch();
    //eslint-disable-next-line
  }, [projectId, exportId]);

  const exportForViewer = useMemo<Export | null>(() => {
    if (!exportDetails) return null;
    return { ...exportDetails, nodeSchema: pendingSchema ?? exportDetails.nodeSchema };
  }, [exportDetails, pendingSchema]);

  const handleNodeSave = useCallback((updates: Record<string, string | boolean | object | null>) => {
    if (!exportDetails) return;
    const parsed: Record<string, unknown> = { ...updates };
    if (typeof parsed.allowedOrigin === 'string') {
      parsed.allowedOrigin = (parsed.allowedOrigin as string).split(',').map(s => s.trim()).filter(Boolean);
    }
    if (typeof parsed.devPorts === 'string') {
      parsed.devPorts = (parsed.devPorts as string).split(',').map(s => Number(s.trim())).filter(n => !isNaN(n) && n > 0);
    }
    dispatch(setCurrentExport({ ...exportDetails, ...parsed } as typeof exportDetails));
    setIsDirty(true);
  }, [dispatch, exportDetails]);

  const handleSubmit = async () => {
    if (!projectId || !exportId) return;
    setSubmitting(true);
    try {
      const nodeSchema = nodeViewerRef.current?.getSchema() ?? liveSchemaRef.current as { nodes: object[]; edges: object[] } | null;
      const apiConns = currentProject.data?.apiConnections || [];
      const useConnections = nodeSchema?.nodes.some((n: object) => (n as { type?: string }).type === 'apiConnectionNode') ?? false;
      const useCredentials = useConnections && nodeSchema!.nodes.some((n: object) => {
        const node = n as { type?: string; data?: { connectionId?: string } };
        if (node.type !== 'apiConnectionNode') return false;
        return !!apiConns.find(c => c.id === node.data?.connectionId)?.credentialId;
      });
      const payload = {
        name: exportDetails?.name ?? '',
        method: exportDetails?.method ?? 'GET',
        allowedOrigin: exportDetails?.allowedOrigin ?? ['*'],
        private: exportDetails?.private ?? false,
        devMode: exportDetails?.devMode ?? false,
        devPorts: exportDetails?.devPorts ?? [],
        useConnections,
        useCredentials,
        ...(nodeSchema ? { nodeSchema } : {}),
      };
      await updateExport(projectId, exportId, payload);
      setIsDirty(false);
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleBack = () => {
    if (isDirty) {
      setShowLeaveModal(true);
    } else {
      navigate(`/project/${projectId}/workflow/exports/${exportId}`, { replace: true });
    }
  };

  const handleLeaveConfirm = async () => {
    await handleSubmit();
    navigate(`/project/${projectId}/workflow/exports/${exportId}`, { replace: true });
  };

  const handleLeaveDiscard = () => {
    navigate(`/project/${projectId}/workflow/exports/${exportId}`, { replace: true });
  };

  // ── Panel management ──────────────────────────────────────────────────────
  const splitRight = useCallback((colIdx: number, rowIdx: number) => {
    setColumns(prev => {
      const tab = prev[colIdx].rows[rowIdx].activeTab;
      const next = [...prev];
      next.splice(colIdx + 1, 0, { id: uid(), rows: [{ id: uid(), tabs: [tab], activeTab: tab, isOriginal: false }] });
      return next;
    });
  }, []);

  const splitDown = useCallback((colIdx: number, rowIdx: number) => {
    setColumns(prev => {
      const tab = prev[colIdx].rows[rowIdx].activeTab;
      return prev.map((col, ci) => {
        if (ci !== colIdx) return col;
        const rows = [...col.rows];
        rows.splice(rowIdx + 1, 0, { id: uid(), tabs: [tab], activeTab: tab, isOriginal: false });
        return { ...col, rows };
      });
    });
  }, []);

  const closePanel = useCallback((colIdx: number, rowIdx: number) => {
    setColumns(prev => {
      if (prev[colIdx].rows[rowIdx].isOriginal) return prev;
      const col = prev[colIdx];
      if (col.rows.length === 1) return prev.filter((_, i) => i !== colIdx);
      return prev.map((col, ci) =>
        ci !== colIdx ? col : { ...col, rows: col.rows.filter((_, ri) => ri !== rowIdx) }
      );
    });
  }, []);

  const closeTab = useCallback((colIdx: number, rowIdx: number, tab: TabId) => {
    setColumns(prev => {
      const panel = prev[colIdx].rows[rowIdx];
      if (panel.isOriginal) return prev;
      const newTabs = panel.tabs.filter(t => t !== tab);
      if (newTabs.length === 0) {
        const col = prev[colIdx];
        if (col.rows.length === 1) return prev.filter((_, i) => i !== colIdx);
        return prev.map((col, ci) =>
          ci !== colIdx ? col : { ...col, rows: col.rows.filter((_, ri) => ri !== rowIdx) }
        );
      }
      const newActive = panel.activeTab === tab ? newTabs[0] : panel.activeTab;
      return prev.map((col, ci) =>
        ci !== colIdx ? col : {
          ...col,
          rows: col.rows.map((row, ri) =>
            ri !== rowIdx ? row : { ...row, tabs: newTabs, activeTab: newActive }
          ),
        }
      );
    });
  }, []);

  const setActiveTab = useCallback((colIdx: number, rowIdx: number, tab: TabId, currentActiveTab: TabId) => {
    if (currentActiveTab === 'nodes' && tab !== 'nodes') {
      const schema = nodeViewerRef.current?.getSchema() ?? liveSchemaRef.current;
      if (schema) setPendingSchema(schema);
    }
    setColumns(prev => prev.map((col, ci) =>
      ci !== colIdx ? col : {
        ...col,
        rows: col.rows.map((row, ri) => ri !== rowIdx ? row : { ...row, activeTab: tab }),
      }
    ));
  }, []);

  const dropTab = useCallback((e: DragEvent, toColIdx: number, toRowIdx: number) => {
    e.preventDefault();
    const drag = dragRef.current;
    if (!drag) return;
    dragRef.current = null;
    setColumns(prev => {
      const target = prev[toColIdx].rows[toRowIdx];
      if (target.id === drag.fromPanelId || target.tabs.includes(drag.tab)) return prev;
      let fromCol = -1, fromRow = -1;
      for (let ci = 0; ci < prev.length; ci++)
        for (let ri = 0; ri < prev[ci].rows.length; ri++)
          if (prev[ci].rows[ri].id === drag.fromPanelId) { fromCol = ci; fromRow = ri; }
      let next: ColumnState[] = prev.map((col, ci) =>
        ci !== toColIdx ? col : {
          ...col,
          rows: col.rows.map((row, ri) =>
            ri !== toRowIdx ? row : { ...row, tabs: [...row.tabs, drag.tab], activeTab: drag.tab }
          ),
        }
      );
      if (!drag.isOriginal && fromCol >= 0) {
        const src = next[fromCol].rows[fromRow];
        const newSrcTabs = src.tabs.filter(t => t !== drag.tab);
        if (newSrcTabs.length === 0) {
          if (next[fromCol].rows.length === 1) next = next.filter((_, i) => i !== fromCol);
          else next = next.map((col, ci) => ci !== fromCol ? col : { ...col, rows: col.rows.filter((_, ri) => ri !== fromRow) });
        } else {
          const newActive = src.activeTab === drag.tab ? newSrcTabs[0] : src.activeTab;
          next = next.map((col, ci) =>
            ci !== fromCol ? col : {
              ...col,
              rows: col.rows.map((row, ri) =>
                ri !== fromRow ? row : { ...row, tabs: newSrcTabs, activeTab: newActive }
              ),
            }
          );
        }
      }
      return next;
    });
  }, []);

  const buildTabItems = (panel: PanelState, colIdx: number, rowIdx: number): TabItem[] =>
    panel.tabs.map(tid => ({
      id: tid,
      label: TAB_DEFS[tid].label,
      icon: TAB_DEFS[tid].icon,
      onClose: !panel.isOriginal ? () => closeTab(colIdx, rowIdx, tid) : undefined,
      draggable: true,
      onDragStart: (e: DragEvent<HTMLButtonElement>) => {
        dragRef.current = { fromPanelId: panel.id, tab: tid, isOriginal: panel.isOriginal };
        e.dataTransfer.effectAllowed = 'move';
        setIsDragging(true);
      },
    }));

  const loading = sliceLoading || submitting;

  return (
    <div className={s.container}>
      <div className={s.pageHeader}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <SectionHeader
            icon={faArrowLeft}
            title={`/${exportDetails?.name}`}
            subtitle={exportDetails?.description}
            onIconClick={handleBack}
          />

          <div className={s.headerRight}>
            <span className={`${s.pipelineStatus} ${s[`pipelineStatus_${pipelineStatus}`]}`}>
              <FontAwesomeIcon
                icon={pipelineStatus === 'running' ? faSpinner : pipelineStatus === 'error' ? faCircleXmark : faCircleCheck}
                spin={pipelineStatus === 'running'}
              />
              {pipelineStatus}
            </span>
            <button
              type="button"
              className={`${s.logToggleBtn} ${showLog ? s.logToggleBtnActive : ''}`}
              title="Toggle pipeline log"
              onClick={() => setShowLog(v => !v)}
            >
              <FontAwesomeIcon icon={faTerminal} />
            </button>
            <div className={s.buttonsContainer}>
              <ActionButton isLoading={loading} disabled={!isDirty || loading} icon={faSave} text="Save" onClick={handleSubmit} />
            </div>
          </div>
        </div>
      </div>
      <form onSubmit={handleSubmit} className={s.form}>
        <PanelGroup orientation="horizontal" className={s.splitGroup}>
          {columns.map((col, colIdx) => (
            <React.Fragment key={col.id}>
              {colIdx > 0 && <PanelResizeHandle className={s.resizeHandle} />}
              <Panel minSize="15%">
                <PanelGroup orientation="vertical" className={s.colGroup}>
                  {col.rows.map((panel, rowIdx) => (
                    <React.Fragment key={panel.id}>
                      {rowIdx > 0 && <PanelResizeHandle className={s.resizeHandleH} />}
                      <Panel minSize="15%">
                        <div className={s.panelContent}>
                          <Tabs
                            tabs={buildTabItems(panel, colIdx, rowIdx)}
                            active={panel.activeTab}
                            onChange={tab => setActiveTab(colIdx, rowIdx, tab as TabId, panel.activeTab)}
                            onDrop={e => dropTab(e, colIdx, rowIdx)}
                            onDragOver={e => e.preventDefault()}
                            actions={
                              <>
                                <button type="button" className={s.tabActionBtn} title="Split right" onClick={() => splitRight(colIdx, rowIdx)}>
                                  <FontAwesomeIcon icon={faTableColumns} />
                                </button>
                                <button type="button" className={s.tabActionBtn} title="Split down" onClick={() => splitDown(colIdx, rowIdx)}>
                                  <FontAwesomeIcon icon={faTableColumns} className={s.iconRotated} />
                                </button>
                                {!panel.isOriginal && (
                                  <button type="button" className={s.tabActionBtn} title="Close panel" onClick={() => closePanel(colIdx, rowIdx)}>
                                    <FontAwesomeIcon icon={faXmark} />
                                  </button>
                                )}
                              </>
                            }
                          />
                          <div
                            className={s.panelBody}
                            onDragOver={isDragging ? e => handlePanelBodyDragOver(e, panel.id) : undefined}
                            onDragLeave={isDragging ? handlePanelBodyDragLeave : undefined}
                            onDrop={isDragging ? e => handlePanelBodyDrop(e, panel.id) : undefined}
                          >
                            {isDragging && (
                              <div
                                className={`${s.splitOverlay}${dropTarget?.panelId === panel.id ? ` ${s[`splitOverlay_${dropTarget.zone}`]}` : ''}`}
                                aria-hidden
                              />
                            )}
                            {panel.activeTab === 'nodes' && exportForViewer && (
                              <NodeViewer
                                ref={nodeViewerRef}
                                context="export"
                                exportDetails={exportForViewer}
                                editMode
                                onSave={handleNodeSave}
                                onChange={handleSchemaChange}
                                apiConnections={currentProject.data?.apiConnections || []}
                                dbConnections={currentProject.data?.dbConnections || []}
                                projectId={projectId}
                              />
                            )}
                            {panel.activeTab === 'response' && exportDetails && (
                              <ResponsePreview
                                projectId={projectId!}
                                schema={liveSchemaRef.current}
                                schemaVersion={schemaVersion}
                                savedApiResponse={exportDetails.apiResponse}
                              />
                            )}
                          </div>
                        </div>
                      </Panel>
                    </React.Fragment>
                  ))}
                </PanelGroup>
              </Panel>
            </React.Fragment>
          ))}
        </PanelGroup>
      </form>

      {showLog && <PipelineRunLog onClose={() => setShowLog(false)} />}

      {showLeaveModal && (
        <ModalShell
          title="Unsaved changes"
          icon={faTriangleExclamation}
          onClose={() => setShowLeaveModal(false)}
          footer={
            <>
              <SecondaryButton icon={faXmark} text="Discard" onClick={handleLeaveDiscard} />
              <ActionButton isLoading={submitting} icon={faSave} text="Save and leave" onClick={handleLeaveConfirm} />
            </>
          }
        >
          <p>You have unsaved changes. Do you want to save before leaving the editor?</p>
        </ModalShell>
      )}
    </div>
  );
};
