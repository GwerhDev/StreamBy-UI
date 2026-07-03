import s from './UpdateExportForm.module.css';
import React, { DragEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../../../store';
import { addApiResponse } from '../../../store/apiResponsesSlice';
import { getExport, updateExport } from '../../../services/exports';
import { ActionButton } from '../Buttons/ActionButton';
import { SecondaryButton } from '../Buttons/SecondaryButton';
import { LabeledInput } from '../Inputs/LabeledInput';
import { Spinner } from '../Spinner';
import {
  faFileExport, faXmark, faFileLines, faCode, faSitemap,
  faGlobe, faLock, faPenToSquare, faTableColumns,
} from '@fortawesome/free-solid-svg-icons';
import { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useNavigate, useParams } from 'react-router-dom';
import { CustomCheckbox } from '../Inputs/CustomCheckbox';
import { NodeViewer, NodeViewerHandle } from '../NodeViewer/NodeViewer';
import { ResponsePreview } from '../Exports/ResponsePreview';
import { Export } from '../../../interfaces';
import { Panel, Group as PanelGroup, Separator as PanelResizeHandle } from 'react-resizable-panels';
import { Tabs, TabItem } from '../Tabs/Tabs';
import { CustomForm } from './CustomForm';
import { SectionHeader } from '../SectionHeader/SectionHeader';
import { setCurrentExport, clearCurrentExport, setExportLoading, setExportError } from '../../../store/currentExportSlice';
import { usePanelLayout } from '../../../hooks/usePanelLayout';

type TabId = 'details' | 'nodes' | 'response';

const TAB_DEFS: Record<TabId, { label: string; icon: IconDefinition }> = {
  details:  { label: 'Details',  icon: faFileLines },
  nodes:    { label: 'Nodes',    icon: faSitemap   },
  response: { label: 'Response', icon: faCode      },
};

export function UpdateExportForm() {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const currentProject = useSelector((state: RootState) => state.currentProject);
  const { data: exportDetails, loading: sliceLoading } = useSelector((state: RootState) => state.currentExport);
  const { id, exportId } = useParams();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [disabled, setDisabled] = useState(true);
  const [selectedAllowedOrigins, setSelectedAllowedOrigins] = useState<string[]>([]);
  const [isPrivate, setIsPrivate] = useState(false);
  const [pendingSchema, setPendingSchema] = useState<{ nodes: object[]; edges: object[] } | null>(null);
  const [schemaVersion, setSchemaVersion] = useState(0);
  const liveSchemaRef = useRef<{ nodes: object[]; edges: object[] } | null>(null);
  const prevEdgesKey  = useRef<string>('');
  const nodeViewerRef = useRef<NodeViewerHandle>(null);

  // Always updates the ref immediately (synchronous, no batching).
  // Only calls setSchemaVersion when edge topology changes — that triggers the re-render
  // that makes ResponsePreview read the fresh liveSchemaRef.current.
  const handleSchemaChange = useCallback((schema: { nodes: object[]; edges: object[] }) => {
    liveSchemaRef.current = schema;
    const edgesKey = (schema.edges as Array<{ id?: string }>).map(e => e.id ?? '').sort().join(',');
    if (edgesKey !== prevEdgesKey.current) {
      prevEdgesKey.current = edgesKey;
      setSchemaVersion(v => v + 1);
    }
  }, []);

  const {
    columns,
    isDragging,
    dropTarget,
    splitRight,
    splitDown,
    closePanel,
    closeTab,
    setActiveTab: setPanelActiveTab,
    dropTab,
    handlePanelBodyDragOver,
    handlePanelBodyDragLeave,
    handlePanelBodyDrop,
    startDrag,
  } = usePanelLayout();

  useEffect(() => { setDisabled(!name || submitting); }, [name, submitting]);

  const populateFromData = (data: Export) => {
    setName(data.name);
    setDescription(data.description || '');
    setSelectedAllowedOrigins(data.allowedOrigin || []);
    setIsPrivate(data.private || false);
    if (data.nodeSchema) {
      const s = data.nodeSchema as { nodes: object[]; edges: Array<{ id?: string }> };
      prevEdgesKey.current = s.edges.map(e => e.id ?? '').sort().join(',');
      liveSchemaRef.current = s as { nodes: object[]; edges: object[] };
    }
  };

  useEffect(() => {
    if (!id || !exportId) { dispatch(setExportError('Project ID or Export ID is missing.')); return; }
    if (exportDetails?.id === exportId) { populateFromData(exportDetails); return; }
    const doFetch = async () => {
      dispatch(setExportLoading());
      try {
        const data = await getExport(id, exportId);
        if (data) { dispatch(setCurrentExport(data)); populateFromData(data); }
        else dispatch(setExportError('Export not found.'));
      } catch (err: unknown) {
        dispatch(setExportError((err as { message: string }).message || 'Failed to fetch export details.'));
      }
    };
    doFetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, exportId]);

  useEffect(() => {
    return () => { dispatch(clearCurrentExport()); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const exportForViewer = useMemo<Export | null>(() => {
    if (!exportDetails) return null;
    return { ...exportDetails, name, private: isPrivate, allowedOrigin: selectedAllowedOrigins, nodeSchema: pendingSchema ?? exportDetails.nodeSchema };
  }, [exportDetails, name, isPrivate, selectedAllowedOrigins, pendingSchema]);

  const handleNodeSave = (updates: Record<string, string | boolean | object | null>) => {
    if ('private' in updates && typeof updates.private === 'boolean') setIsPrivate(updates.private);
  };

  const handleAllowedOriginCheckboxChange = (origin: string) => {
    const isChecked = selectedAllowedOrigins.includes(origin) || selectedAllowedOrigins.some(o => o === '*');
    if (isChecked) {
      if (selectedAllowedOrigins.includes('*')) {
        setSelectedAllowedOrigins((currentProject?.data?.allowedOrigin || []).filter((o: string) => o !== origin));
      } else {
        setSelectedAllowedOrigins(prev => prev.filter(o => o !== origin));
      }
    } else {
      setSelectedAllowedOrigins(prev => [...prev, origin]);
    }
  };

  const handleSelectAllOriginsChange = () => {
    if (selectedAllowedOrigins.includes('*')) setSelectedAllowedOrigins([]);
    else setSelectedAllowedOrigins(['*']);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
      const payload = { name, description, allowedOrigin: selectedAllowedOrigins, private: isPrivate, useConnections, useCredentials, ...(nodeSchema ? { nodeSchema } : {}) };
      await updateExport(id || '', exportId || '', payload);
      dispatch(addApiResponse({ message: 'Export updated successfully.', type: 'success' }));
      navigate(`/project/${id}/exports/${exportId}`);
    } catch (err: any) {
      dispatch(addApiResponse({ message: err.message || 'Failed to update export.', type: 'error' }));
    } finally {
      setSubmitting(false);
    }
  };

  const buildTabItems = (panel: ReturnType<typeof usePanelLayout>['columns'][0]['rows'][0], colIdx: number, rowIdx: number): TabItem[] =>
    panel.tabs.map(tid => ({
      id: tid,
      label: TAB_DEFS[tid as TabId].label,
      icon: TAB_DEFS[tid as TabId].icon,
      onClose: !panel.isOriginal ? () => closeTab(colIdx, rowIdx, tid as TabId) : undefined,
      draggable: true,
      onDragStart: (e: DragEvent<HTMLButtonElement>) => startDrag(panel.id, tid as TabId, panel.isOriginal, e),
    }));

  const handleSetActiveTab = useCallback((colIdx: number, rowIdx: number, tab: string) => {
    setPanelActiveTab(colIdx, rowIdx, tab as TabId, () => {
      const schema = nodeViewerRef.current?.getSchema() ?? liveSchemaRef.current;
      if (schema) setPendingSchema(schema);
    });
  }, [setPanelActiveTab]);

  const loading = sliceLoading || submitting;

  return (
    <div className={s.container}>
      <div className={s.pageHeader}>
        <SectionHeader icon={faPenToSquare} title={name || 'Update Export'} subtitle="Edit the export details below" />
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
                            onChange={tab => handleSetActiveTab(colIdx, rowIdx, tab)}
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
                                            checked={selectedAllowedOrigins.includes('*')}
                                            onChange={handleSelectAllOriginsChange}
                                            label="Allow all origins from project"
                                          />
                                          {currentProject.data?.allowedOrigin?.map((origin: string, i: number) => (
                                            <CustomCheckbox
                                              key={i} id={`origin-${i}`} name={`origin-${i}`} value={origin}
                                              checked={selectedAllowedOrigins.includes(origin) || selectedAllowedOrigins.includes('*')}
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
                            {panel.activeTab === 'nodes' && exportForViewer && (
                              <NodeViewer
                                ref={nodeViewerRef}
                                exportDetails={exportForViewer}
                                editMode
                                onSave={handleNodeSave}
                                onChange={handleSchemaChange}
                                apiConnections={currentProject.data?.apiConnections || []}
                                projectId={id}
                              />
                            )}
                            {panel.activeTab === 'response' && exportDetails && (
                              <ResponsePreview
                                projectId={id!}
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
        <div className={s.footer}>
          <ActionButton disabled={disabled || loading} icon={faFileExport} text="Update" type="submit" />
          <SecondaryButton disabled={loading} icon={faXmark} onClick={() => navigate(-1)} text="Cancel" />
        </div>
      </form>
    </div>
  );
}
