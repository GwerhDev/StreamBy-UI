import s from './ExportEditor.module.css';
import React, { DragEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../../store';
import { getExport, updateExport } from '../../../services/exports';
import { ActionButton } from '../Buttons/ActionButton';
import {
  faFileExport, faXmark, faCode, faSitemap,
  faTableColumns, faArrowLeft,
  faSave,
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
import { setCurrentExport, clearCurrentExport, setExportLoading, setExportError } from '../../../store/currentExportSlice';

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

export const ExportEditor: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const currentProject = useSelector((state: RootState) => state.currentProject);
  const { data: exportDetails, loading: sliceLoading } = useSelector((state: RootState) => state.currentExport);
  const { projectId, exportId } = useParams<{ projectId: string; exportId: string }>();

  const [submitting, setSubmitting] = useState(false);
  const [pendingSchema, setPendingSchema] = useState<{ nodes: object[]; edges: object[] } | null>(null);
  const liveSchemaRef = useRef<{ nodes: object[]; edges: object[] } | null>(null);
  const nodeViewerRef = useRef<NodeViewerHandle>(null);

  const [columns, setColumns] = useState<ColumnState[]>([
    { id: uid(), rows: [{ id: uid(), tabs: ALL_TABS, activeTab: 'nodes', isOriginal: true }] },
  ]);
  const dragRef = useRef<{ fromPanelId: string; tab: TabId; isOriginal: boolean } | null>(null);

  useEffect(() => {
    if (!projectId || !exportId) { dispatch(setExportError('Missing IDs.')); return; }
    if (exportDetails?.id === exportId) return;
    const doFetch = async () => {
      dispatch(setExportLoading());
      try {
        const data = await getExport(projectId, exportId);
        if (data) dispatch(setCurrentExport(data));
        else dispatch(setExportError('Export not found.'));
      } catch (err: unknown) {
        dispatch(setExportError((err as { message: string }).message || 'Failed to fetch export.'));
      }
    };
    doFetch();
    //eslint-disable-next-line
  }, [projectId, exportId]);

  useEffect(() => {
    return () => { dispatch(clearCurrentExport()); };
    //eslint-disable-next-line
  }, []);

  const exportForViewer = useMemo<Export | null>(() => {
    if (!exportDetails) return null;
    return { ...exportDetails, nodeSchema: pendingSchema ?? exportDetails.nodeSchema };
  }, [exportDetails, pendingSchema]);

  const handleNodeSave = () => { };

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
        allowedOrigin: exportDetails?.allowedOrigin ?? ['*'],
        private: exportDetails?.private ?? false,
        useConnections,
        useCredentials,
        ...(nodeSchema ? { nodeSchema } : {}),
      };
      await updateExport(projectId, exportId, payload);
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
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
      },
    }));

  const loading = sliceLoading || submitting;

  return (
    <div className={s.container}>
      <div className={s.pageHeader}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button
            type="button"
            className={s.tabActionBtn}
            title="Back to details"
            onClick={() => navigate(`/project/${projectId}/dashboard/exports/${exportId}`)}
          >
            <FontAwesomeIcon icon={faArrowLeft} />
          </button>
          <SectionHeader icon={faFileExport} title={exportDetails?.name ?? 'Editor'} subtitle={exportDetails?.description} />

          <div className={s.buttonsContainer}>
            <ActionButton isLoading={loading} icon={faSave} text="Save" onClick={handleSubmit} />
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
                                  <FontAwesomeIcon icon={faTableColumns} style={{ transform: 'rotate(90deg)' }} />
                                </button>
                                {!panel.isOriginal && (
                                  <button type="button" className={s.tabActionBtn} title="Close panel" onClick={() => closePanel(colIdx, rowIdx)}>
                                    <FontAwesomeIcon icon={faXmark} />
                                  </button>
                                )}
                              </>
                            }
                          />
                          <div className={s.panelBody}>
                            {panel.activeTab === 'nodes' && exportForViewer && (
                              <NodeViewer
                                ref={nodeViewerRef}
                                exportDetails={exportForViewer}
                                editMode
                                onSave={handleNodeSave}
                                onChange={schema => { liveSchemaRef.current = schema; }}
                                apiConnections={currentProject.data?.apiConnections || []}
                                projectId={projectId}
                              />
                            )}
                            {panel.activeTab === 'response' && exportDetails && (
                              <ResponsePreview
                                projectId={projectId!}
                                schema={liveSchemaRef.current}
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
    </div>
  );
};
