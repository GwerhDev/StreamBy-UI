import s from './UpdateExportForm.module.css';
import { useSelector, useDispatch } from "react-redux";
import { useState, useEffect, useMemo, useRef } from "react";
import { RootState } from "../../../store";
import { getExport, updateExport } from "../../../services/exports";
import { ActionButton } from '../Buttons/ActionButton';
import { SecondaryButton } from '../Buttons/SecondaryButton';
import { LabeledInput } from '../Inputs/LabeledInput';
import { Spinner } from '../Spinner';
import { faFileExport, faXmark, faFileLines, faCode, faSitemap, faGlobe, faLock, faPenToSquare } from '@fortawesome/free-solid-svg-icons';

import { useNavigate, useParams } from 'react-router-dom';
import { CustomCheckbox } from '../Inputs/CustomCheckbox';
import { NodeViewer, NodeViewerHandle } from '../NodeViewer/NodeViewer';
import { ResponsePreview } from '../Exports/ResponsePreview';
import { Export } from '../../../interfaces';
import { Panel, Group as PanelGroup, Separator as PanelResizeHandle } from 'react-resizable-panels';
import { Tabs } from '../Tabs/Tabs';
import { CustomForm } from './CustomForm';
import { setCurrentExport, clearCurrentExport, setExportLoading, setExportError } from '../../../store/currentExportSlice';

export function UpdateExportForm() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const currentProject = useSelector((state: RootState) => state.currentProject);
  const { data: exportDetails, loading: sliceLoading } = useSelector((state: RootState) => state.currentExport);
  const { id, exportId } = useParams();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [disabled, setDisabled] = useState<boolean>(true);
  const [selectedAllowedOrigins, setSelectedAllowedOrigins] = useState<string[]>([]);
  const [isPrivate, setIsPrivate] = useState<boolean>(false);
  const [inputMode, setInputMode] = useState<'nodes' | 'response'>('nodes');
  const [pendingSchema, setPendingSchema] = useState<{ nodes: object[]; edges: object[] } | null>(null);
  const liveSchemaRef = useRef<{ nodes: object[]; edges: object[] } | null>(null);
  const nodeViewerRef = useRef<NodeViewerHandle>(null);

  const handleTabChange = (tab: string) => {
    if (inputMode === 'nodes' && tab !== 'nodes') {
      const schema = nodeViewerRef.current?.getSchema() ?? liveSchemaRef.current;
      if (schema) setPendingSchema(schema);
    }
    setInputMode(tab as 'nodes' | 'response');
  };

  const populateFromData = (data: Export) => {
    setName(data.name);
    setDescription(data.description || "");
    setSelectedAllowedOrigins(data.allowedOrigin || []);
    setIsPrivate(data.private || false);
  };

  useEffect(() => {
    if (!id || !exportId) { dispatch(setExportError('Project ID or Export ID is missing.')); return; }

    if (exportDetails?.id === exportId) { populateFromData(exportDetails); return; }

    const fetchExportDetails = async () => {
      dispatch(setExportLoading());
      try {
        const data = await getExport(id, exportId);
        if (data) { dispatch(setCurrentExport(data)); populateFromData(data); }
        else dispatch(setExportError('Export not found.'));
      } catch (err: unknown) {
        dispatch(setExportError((err as { message: string }).message || 'Failed to fetch export details.'));
      }
    };
    fetchExportDetails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, exportId]);

  useEffect(() => {
    return () => { dispatch(clearCurrentExport()); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const exportForViewer = useMemo<Export | null>(() => {
    if (!exportDetails) return null;
    return {
      ...exportDetails,
      name, private: isPrivate, allowedOrigin: selectedAllowedOrigins,
      nodeSchema: pendingSchema ?? exportDetails.nodeSchema,
    };
  }, [exportDetails, name, isPrivate, selectedAllowedOrigins, pendingSchema]);

  const handleNodeSave = (updates: Record<string, string | boolean | object | null>) => {
    if ('private' in updates && typeof updates.private === 'boolean') setIsPrivate(updates.private);
  };

  const handleAllowedOriginCheckboxChange = (origin: string) => {
    const isChecked = selectedAllowedOrigins.includes(origin) || selectedAllowedOrigins.some(o => o === '*');
    if (isChecked) {
      if (selectedAllowedOrigins.includes('*')) {
        const allOrigins = currentProject?.data?.allowedOrigin || [];
        setSelectedAllowedOrigins(allOrigins.filter(o => o !== origin));
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
      const payload = {
        name, description,
        allowedOrigin: selectedAllowedOrigins,
        private: isPrivate,
        useConnections,
        useCredentials,
        ...(nodeSchema ? { nodeSchema } : {}),
      };
      await updateExport(id || '', exportId || '', payload);
      navigate(`/project/${id}/dashboard/exports/${exportId}`);
    } catch (err: unknown) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    setDisabled(!name || submitting);
  }, [name, submitting]);

  const loading = sliceLoading || submitting;

  return (
    <div className={s.container}>
      <Spinner bg isLoading={loading} />
      <form onSubmit={handleSubmit} className={s.form}>
        <PanelGroup orientation="horizontal" className={s.splitGroup}>

          <Panel defaultSize="40%" minSize="25%" maxSize="60%">
            <div className={s.detailsPanel}>
              <CustomForm
                readOnly={false}
                header={{ icon: faPenToSquare, title: 'Update Export', subtitle: 'Edit the export details below' }}
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
                actions={
                  <>
                    <ActionButton disabled={disabled || loading} icon={faFileExport} text="Update" type="submit" />
                    <SecondaryButton disabled={loading} icon={faXmark} onClick={() => navigate(-1)} text="Cancel" />
                  </>
                }
              />
            </div>
          </Panel>

          <PanelResizeHandle className={s.resizeHandle} />

          <Panel minSize="30%">
            <div className={s.viewerPanel}>
              <Tabs
                active={inputMode}
                onChange={handleTabChange}
                tabs={[
                  { id: 'nodes', label: 'Nodes', icon: faSitemap },
                  { id: 'response', label: 'Response', icon: faCode },
                ]}
              />
              <div className={s.viewerContent}>
                {inputMode === 'nodes' && exportForViewer && (
                  <NodeViewer
                    ref={nodeViewerRef}
                    exportDetails={exportForViewer}
                    editMode
                    onSave={handleNodeSave}
                    onChange={schema => { liveSchemaRef.current = schema; }}
                    apiConnections={currentProject.data?.apiConnections || []}
                    projectId={id}
                  />
                )}
                {inputMode === 'response' && exportDetails && (
                  <ResponsePreview
                    projectId={id!}
                    schema={liveSchemaRef.current}
                    savedApiResponse={exportDetails.apiResponse}
                  />
                )}
              </div>
            </div>
          </Panel>

        </PanelGroup>
      </form>
    </div>
  );
}
