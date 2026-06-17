import s from './ExportDetailsView.module.css';
import CopyButton from '../Buttons/CopyButton';

import React, { DragEvent, useCallback, useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { API_BASE } from '../../../config/api';
import { getExport } from '../../../services/exports';
import { Spinner } from '../Spinner';
import { ActionButton } from '../Buttons/ActionButton';
import { SecondaryButton } from '../Buttons/SecondaryButton';
import { DeleteExportModal } from '../Modals/DeleteExportModal';
import {
  faCode, faFileLines, faLink, faGlobe, faClock,
  faTrash, faSitemap, faTableColumns, faXmark,
  faFeather,
} from '@fortawesome/free-solid-svg-icons';
import { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../../store';
import { setCurrentExport, clearCurrentExport, setExportLoading, setExportError } from '../../../store/currentExportSlice';
import { NodeViewer } from '../NodeViewer/NodeViewer';
import { ResponsePreview } from './ResponsePreview';
import { Panel, Group as PanelGroup, Separator as PanelResizeHandle } from 'react-resizable-panels';
import { Tabs, TabItem } from '../Tabs/Tabs';
import { CustomForm } from '../Forms/CustomForm';
import { SectionHeader } from '../SectionHeader/SectionHeader';

type TabId = 'details' | 'nodes' | 'response';

interface PanelState {
  id: string;
  tabs: TabId[];
  activeTab: TabId;
  isOriginal: boolean;
}
interface ColumnState { id: string; rows: PanelState[]; }

const TAB_DEFS: Record<TabId, { label: string; icon: IconDefinition }> = {
  details: { label: 'Details', icon: faFileLines },
  nodes: { label: 'Nodes', icon: faSitemap },
  response: { label: 'Response', icon: faCode },
};
const ALL_TABS: TabId[] = ['details', 'nodes', 'response'];

let _c = 0;
const uid = () => `p${++_c}`;

export const ExportDetailsView: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { id, exportId } = useParams<{ id: string; exportId: string }>();

  const [columns, setColumns] = useState<ColumnState[]>([
    { id: uid(), rows: [{ id: uid(), tabs: ALL_TABS, activeTab: 'details', isOriginal: true }] },
  ]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const currentProject = useSelector((state: RootState) => state.currentProject);
  const { data: exportDetails, loading, error } = useSelector((state: RootState) => state.currentExport);
  const dragRef = useRef<{ fromPanelId: string; tab: TabId; isOriginal: boolean } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dropTarget, setDropTarget] = useState<{ panelId: string; zone: 'top' | 'bottom' | 'left' | 'right' } | null>(null);

  useEffect(() => {
    const onDragEnd = () => { setIsDragging(false); setDropTarget(null); dragRef.current = null; };
    window.addEventListener('dragend', onDragEnd);
    return () => window.removeEventListener('dragend', onDragEnd);
  }, []);

  useEffect(() => {
    if (!id || !exportId) {
      dispatch(clearCurrentExport());
      dispatch(setExportError('Project ID or Export ID is missing.'));
      return;
    }
    dispatch(clearCurrentExport());
    const doFetch = async () => {
      dispatch(setExportLoading());
      try {
        const data = await getExport(id, exportId);
        if (data) dispatch(setCurrentExport(data));
        else dispatch(setExportError('Export not found.'));
      } catch (err: unknown) {
        dispatch(setExportError((err as { message: string }).message || 'Failed to fetch export details.'));
      }
    };
    doFetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, exportId]);


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

  const setActiveTab = useCallback((colIdx: number, rowIdx: number, tab: TabId) => {
    setColumns(prev => prev.map((col, ci) =>
      ci !== colIdx ? col : {
        ...col,
        rows: col.rows.map((row, ri) =>
          ri !== rowIdx ? row : { ...row, activeTab: tab }
        ),
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
      if (target.id === drag.fromPanelId) return prev;
      if (target.tabs.includes(drag.tab)) return prev;

      let fromCol = -1, fromRow = -1;
      for (let ci = 0; ci < prev.length; ci++)
        for (let ri = 0; ri < prev[ci].rows.length; ri++)
          if (prev[ci].rows[ri].id === drag.fromPanelId) { fromCol = ci; fromRow = ri; }

      // Add tab to target
      let next: ColumnState[] = prev.map((col, ci) =>
        ci !== toColIdx ? col : {
          ...col,
          rows: col.rows.map((row, ri) =>
            ri !== toRowIdx ? row : { ...row, tabs: [...row.tabs, drag.tab], activeTab: drag.tab }
          ),
        }
      );

      // Remove tab from source (only if not original)
      if (!drag.isOriginal && fromCol >= 0) {
        const src = next[fromCol].rows[fromRow];
        const newSrcTabs = src.tabs.filter(t => t !== drag.tab);
        if (newSrcTabs.length === 0) {
          if (next[fromCol].rows.length === 1) {
            next = next.filter((_, i) => i !== fromCol);
          } else {
            next = next.map((col, ci) =>
              ci !== fromCol ? col : { ...col, rows: col.rows.filter((_, ri) => ri !== fromRow) }
            );
          }
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

  const getDropZone = (e: React.DragEvent, el: HTMLElement): 'top' | 'bottom' | 'left' | 'right' => {
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width;
    const y = (e.clientY - r.top) / r.height;
    return Math.abs(x - 0.5) > Math.abs(y - 0.5) ? (x < 0.5 ? 'left' : 'right') : (y < 0.5 ? 'top' : 'bottom');
  };

  const handlePanelBodyDragOver = useCallback((e: React.DragEvent<HTMLDivElement>, panelId: string) => {
    if (!dragRef.current) return;
    e.preventDefault(); e.stopPropagation();
    const zone = getDropZone(e, e.currentTarget);
    setDropTarget(prev => (prev?.panelId === panelId && prev?.zone === zone ? prev : { panelId, zone }));
  }, []);

  const handlePanelBodyDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) setDropTarget(null);
  }, []);

  const splitAndDropTab = useCallback((targetPanelId: string, zone: 'top' | 'bottom' | 'left' | 'right') => {
    const drag = dragRef.current;
    if (!drag) return;
    dragRef.current = null; setDropTarget(null); setIsDragging(false);
    setColumns(prev => {
      let next: ColumnState[] = prev.map(col => ({ ...col, rows: [...col.rows] }));
      if (!drag.isOriginal) {
        next = next.map(col => ({
          ...col,
          rows: col.rows.map(row => {
            if (row.id !== drag.fromPanelId) return row;
            const tabs = row.tabs.filter(t => t !== drag.tab);
            if (!tabs.length) return null as unknown as PanelState;
            return { ...row, tabs, activeTab: row.activeTab === drag.tab ? tabs[0] : row.activeTab };
          }).filter(Boolean) as PanelState[],
        })).filter(col => col.rows.length > 0);
      }
      let tCol = -1, tRow = -1;
      for (let ci = 0; ci < next.length; ci++)
        for (let ri = 0; ri < next[ci].rows.length; ri++)
          if (next[ci].rows[ri].id === targetPanelId) { tCol = ci; tRow = ri; }
      if (tCol === -1) return next;
      const newPanel: PanelState = { id: uid(), tabs: [drag.tab], activeTab: drag.tab, isOriginal: false };
      if (zone === 'right') next.splice(tCol + 1, 0, { id: uid(), rows: [newPanel] });
      else if (zone === 'left') next.splice(tCol, 0, { id: uid(), rows: [newPanel] });
      else next = next.map((col, ci) => {
        if (ci !== tCol) return col;
        const rows = [...col.rows];
        rows.splice(zone === 'bottom' ? tRow + 1 : tRow, 0, newPanel);
        return { ...col, rows };
      });
      return next;
    });
  }, []);

  const handlePanelBodyDrop = useCallback((e: React.DragEvent<HTMLDivElement>, panelId: string) => {
    e.preventDefault(); e.stopPropagation();
    if (!dragRef.current || !dropTarget) return;
    splitAndDropTab(panelId, dropTarget.zone);
  }, [dropTarget, splitAndDropTab]);

  if (loading) return <div className={s.container}><Spinner bg={false} isLoading /></div>;
  if (error) return <div>Error: {error}</div>;
  if (!exportDetails) return <div>Export details not available.</div>;

  const endpointPath = `/streamby/${id}/export/${exportDetails.name}`;
  const fullEndpoint = `${API_BASE}${endpointPath}`;

  return (
    <div className={s.container}>
      <div className={s.pageHeader}>
        <SectionHeader
          icon={faCode}
          title={`/${exportDetails.name}`}
          badge={exportDetails.method}
          subtitle={exportDetails.description}
        />
        <div className={s.buttonsContainer}>
          <ActionButton icon={faFeather} text="Editor" onClick={() => navigate(`/project/${id}/dashboard/exports/${exportId}/editor`)} />
          <SecondaryButton icon={faTrash} text="Delete" onClick={() => setShowDeleteModal(true)} />
        </div>
      </div>

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
                          onChange={tab => setActiveTab(colIdx, rowIdx, tab as TabId)}
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
                            <div className={`${s.splitOverlay}${dropTarget?.panelId === panel.id ? ` ${s[`splitOverlay_${dropTarget.zone}`]}` : ''}`} aria-hidden />
                          )}
                          {panel.activeTab === 'details' && (
                            <div className={s.detailsScroll}>
                              <CustomForm
                                readOnly
                                fields={[
                                  {
                                    icon: faLink,
                                    label: 'Endpoint',
                                    value: (
                                      <>
                                        <a className={s.fieldLink} href={fullEndpoint} target="_blank" rel="noopener noreferrer">{endpointPath}</a>
                                        <CopyButton title="Copy endpoint" textToCopy={endpointPath} />
                                      </>
                                    ),
                                  },
                                  {
                                    icon: faFileLines,
                                    label: 'Description',
                                    value: exportDetails.description,
                                    hidden: !exportDetails.description,
                                  },
                                  {
                                    icon: faGlobe,
                                    label: 'Allowed Origins',
                                    value: exportDetails.allowedOrigin?.some(o => /^\*$/.test(o))
                                      ? (currentProject?.data?.allowedOrigin?.join(', ') || '*')
                                      : exportDetails.allowedOrigin?.join(', '),
                                    hidden: !exportDetails.allowedOrigin?.length,
                                  },
                                  {
                                    icon: faClock,
                                    label: 'Created',
                                    value: new Date(exportDetails.createdAt).toLocaleString(),
                                  },
                                ]}
                              />
                            </div>
                          )}
                          {panel.activeTab === 'nodes' && <NodeViewer exportDetails={exportDetails} projectId={id} />}
                          {panel.activeTab === 'response' && (
                            <ResponsePreview
                              projectId={id!}
                              schema={exportDetails.nodeSchema}
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

      {showDeleteModal && (
        <DeleteExportModal
          exportId={exportId}
          currentProject={currentProject}
          currentExport={exportDetails}
          onClose={() => setShowDeleteModal(false)}
        />
      )}
    </div>
  );
};
