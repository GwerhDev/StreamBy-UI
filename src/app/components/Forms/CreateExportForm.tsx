import s from './CreateExportForm.module.css';
import React, { DragEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../../store';
import { createExport } from '../../../services/exports';
import { ActionButton } from '../Buttons/ActionButton';
import { SecondaryButton } from '../Buttons/SecondaryButton';
import { LabeledInput } from '../Inputs/LabeledInput';
import { Spinner } from '../Spinner';
import {
  faFileExport, faXmark, faFileLines, faCode, faSitemap,
  faGlobe, faLock, faTableColumns,
} from '@fortawesome/free-solid-svg-icons';
import { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useNavigate, useParams } from 'react-router-dom';
import { CustomCheckbox } from '../Inputs/CustomCheckbox';
import { NodeViewer, NodeViewerHandle } from '../NodeViewer/NodeViewer';
import { Export } from '../../../interfaces';
import { Panel, Group as PanelGroup, Separator as PanelResizeHandle } from 'react-resizable-panels';
import { Tabs, TabItem } from '../Tabs/Tabs';
import { CustomForm } from './CustomForm';
import { SectionHeader } from '../SectionHeader/SectionHeader';

type TabId = 'details' | 'nodes' | 'response';
interface PanelState { id: string; tabs: TabId[]; activeTab: TabId; isOriginal: boolean; }
interface ColumnState { id: string; rows: PanelState[]; }

const TAB_DEFS: Record<TabId, { label: string; icon: IconDefinition }> = {
  details:  { label: 'Details',  icon: faFileLines },
  nodes:    { label: 'Nodes',    icon: faSitemap   },
  response: { label: 'Response', icon: faCode      },
};
const ALL_TABS: TabId[] = ['details', 'nodes', 'response'];

let _c = 0;
const uid = () => `p${++_c}`;

export function CreateExportForm() {
  const currentProject = useSelector((state: RootState) => state.currentProject);
  const { id: projectId } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [disabled, setDisabled] = useState(true);
  const [selectedAllowedOrigins, setSelectedAllowedOrigins] = useState<string[]>(['*']);
  const [isPrivate, setIsPrivate] = useState(false);
  const [createdExportId, setCreatedExportId] = useState<string | null>(null);
  const nodeViewerRef = useRef<NodeViewerHandle>(null);

  const [columns, setColumns] = useState<ColumnState[]>([
    { id: uid(), rows: [{ id: uid(), tabs: ALL_TABS, activeTab: 'details', isOriginal: true }] },
  ]);
  const dragRef = useRef<{ fromPanelId: string; tab: TabId; isOriginal: boolean } | null>(null);

  useEffect(() => { setDisabled(!name || loading); }, [name, loading]);

  const handleAllowedOriginCheckboxChange = (origin: string) => {
    const isChecked = selectedAllowedOrigins.includes(origin) || selectedAllowedOrigins.some(o => /^\*$/.test(o));
    if (isChecked) {
      if (selectedAllowedOrigins.some(o => /^\*$/.test(o))) {
        setSelectedAllowedOrigins((currentProject?.data?.allowedOrigin || []).filter((o: string) => o !== origin));
      } else {
        setSelectedAllowedOrigins(prev => prev.filter(o => o !== origin));
      }
    } else {
      setSelectedAllowedOrigins(prev => [...prev, origin]);
    }
  };

  const handleSelectAllOriginsChange = () => {
    if (selectedAllowedOrigins.some(o => /^\*$/.test(o))) setSelectedAllowedOrigins([]);
    else setSelectedAllowedOrigins(['*']);
  };

  const handleNodeSave = (updates: Record<string, string | boolean | object | null>) => {
    if ('private' in updates && typeof updates.private === 'boolean') setIsPrivate(updates.private);
  };

  const exportForViewer = useMemo<Export>(() => ({
    id: createdExportId || '',
    name: name || 'New Export',
    method: 'GET',
    status: 'pending',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    projectId: projectId || '',
    exportedBy: '',
    private: isPrivate,
    allowedOrigin: selectedAllowedOrigins,
  }), [createdExportId, name, projectId, isPrivate, selectedAllowedOrigins]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const nodeSchema = nodeViewerRef.current?.getSchema();
      const apiConns = currentProject.data?.apiConnections || [];
      const useConnections = nodeSchema?.nodes.some((n: object) => (n as { type?: string }).type === 'apiConnectionNode') ?? false;
      const useCredentials = useConnections && nodeSchema!.nodes.some((n: object) => {
        const node = n as { type?: string; data?: { connectionId?: string } };
        if (node.type !== 'apiConnectionNode') return false;
        return !!apiConns.find(c => c.id === node.data?.connectionId)?.credentialId;
      });
      const payload = { name, description, allowedOrigin: selectedAllowedOrigins, private: isPrivate, useConnections, useCredentials, ...(nodeSchema ? { nodeSchema } : {}) };
      const response = await createExport(currentProject?.data?.id, payload);
      setCreatedExportId(response.exportId);
      navigate(`/project/${currentProject?.data?.id}/dashboard/exports/${response.exportId}`);
    } catch (err: unknown) {
      console.error(err);
    } finally {
      setLoading(false);
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

  const setActiveTab = useCallback((colIdx: number, rowIdx: number, tab: TabId) => {
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

  return (
    <div className={s.container}>
      <div className={s.pageHeader}>
        <SectionHeader icon={faFileExport} title="New Export" subtitle="Fill the form to create a new export" />
      </div>
      <Spinner bg isLoading={loading} />
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
                            onChange={tab => setActiveTab(colIdx, rowIdx, tab as TabId)}
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
                            {panel.activeTab === 'details' && (
                              <div className={s.detailsScroll}>
                                <CustomForm
                                  readOnly={false}
                                  fields={[
                                    {
                                      icon: faCode,
                                      label: 'Name',
                                      value: name || '—',
                                      editComponent: (
                                        <LabeledInput
                                          label="Export's name" type="text" placeholder="" id="name-input"
                                          name="name-input" htmlFor="name-input" value={name}
                                          onChange={e => setName(e.target.value)}
                                        />
                                      ),
                                    },
                                    {
                                      icon: faFileLines,
                                      label: 'Description',
                                      value: description || '—',
                                      editComponent: (
                                        <LabeledInput
                                          label="Description (optional)" type="text" placeholder="" id="description-input"
                                          name="description-input" htmlFor="description-input" value={description}
                                          onChange={e => setDescription(e.target.value)}
                                        />
                                      ),
                                    },
                                    {
                                      icon: faLock,
                                      label: 'Private',
                                      value: isPrivate ? 'Yes' : 'No',
                                      editComponent: (
                                        <CustomCheckbox
                                          id="private-checkbox" name="private-checkbox"
                                          checked={isPrivate}
                                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setIsPrivate(e.target.checked)}
                                          label="Private Export"
                                        />
                                      ),
                                    },
                                    {
                                      icon: faGlobe,
                                      label: 'Allowed Origins',
                                      value: selectedAllowedOrigins.join(', ') || '—',
                                      hidden: !currentProject?.data?.allowedOrigin?.length,
                                      editComponent: (
                                        <div className={s.allowedOriginsContainer}>
                                          <CustomCheckbox
                                            id="all-origins-checkbox" name="all-origins-checkbox"
                                            checked={selectedAllowedOrigins.some(o => /^\*$/.test(o))}
                                            onChange={handleSelectAllOriginsChange}
                                            label="Allow all origins from project"
                                          />
                                          {currentProject.data?.allowedOrigin?.map((origin: string, i: number) => (
                                            <CustomCheckbox
                                              key={i} id={`origin-${i}`} name={`origin-${i}`} value={origin}
                                              checked={selectedAllowedOrigins.includes(origin) || selectedAllowedOrigins.some(o => /^\*$/.test(o))}
                                              onChange={() => handleAllowedOriginCheckboxChange(origin)}
                                              label={origin}
                                            />
                                          ))}
                                        </div>
                                      ),
                                    },
                                  ]}
                                />
                              </div>
                            )}
                            {panel.activeTab === 'nodes' && (
                              <NodeViewer
                                key="create"
                                ref={nodeViewerRef}
                                exportDetails={exportForViewer}
                                editMode
                                onSave={handleNodeSave}
                                apiConnections={currentProject.data?.apiConnections || []}
                              />
                            )}
                            {panel.activeTab === 'response' && (
                              <div className={s.detailsScroll}>
                                <p className={s.responseHint}>Save the export first to see the processed response.</p>
                              </div>
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
        <div className={s.footer}>
          <ActionButton disabled={disabled || loading} icon={faFileExport} text="Create" type="submit" />
          <SecondaryButton disabled={loading} icon={faXmark} onClick={() => navigate(-1)} text="Cancel" />
        </div>
      </form>
    </div>
  );
}
