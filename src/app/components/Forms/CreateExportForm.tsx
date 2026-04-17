import s from './CreateExportForm.module.css';
import { useSelector } from "react-redux";
import { useState, useEffect, useMemo, useRef } from "react";
import { RootState } from "../../../store";
import { createExport } from "../../../services/exports";
import { ActionButton } from '../Buttons/ActionButton';
import { SecondaryButton } from '../Buttons/SecondaryButton';
import { LabeledInput } from '../Inputs/LabeledInput';
import { Spinner } from '../Spinner';
import { faFileExport, faXmark, faFileLines, faCode, faSitemap, faGlobe, faLock } from '@fortawesome/free-solid-svg-icons';
import { useNavigate, useParams } from 'react-router-dom';
import { CustomCheckbox } from '../Inputs/CustomCheckbox';
import { NodeViewer, NodeViewerHandle } from '../NodeViewer/NodeViewer';
import { Export } from '../../../interfaces';
import { Panel, Group as PanelGroup, Separator as PanelResizeHandle } from 'react-resizable-panels';
import { Tabs } from '../Tabs/Tabs';
import { CustomForm } from './CustomForm';

export function CreateExportForm() {
  const currentProject = useSelector((state: RootState) => state.currentProject);
  const { id: projectId } = useParams<{ id: string }>();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [disabled, setDisabled] = useState<boolean>(true);
  const [selectedAllowedOrigins, setSelectedAllowedOrigins] = useState<string[]>(['*']);
  const [isPrivate, setIsPrivate] = useState<boolean>(false);
  const [inputMode, setInputMode] = useState<'nodes' | 'response'>('nodes');
  const [createdExportId, setCreatedExportId] = useState<string | null>(null);
  const nodeViewerRef = useRef<NodeViewerHandle>(null);
  const navigate = useNavigate();

  const handleAllowedOriginCheckboxChange = (origin: string) => {
    const isChecked = selectedAllowedOrigins.includes(origin) || selectedAllowedOrigins.some(o => /^\*$/.test(o));
    if (isChecked) {
      if (selectedAllowedOrigins.some(o => /^\*$/.test(o))) {
        const allOrigins = currentProject?.data?.allowedOrigin || [];
        setSelectedAllowedOrigins(allOrigins.filter((o: string) => o !== origin));
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
      const payload = {
        name, description,
        allowedOrigin: selectedAllowedOrigins,
        private: isPrivate,
        useConnections,
        useCredentials,
        ...(nodeSchema ? { nodeSchema } : {}),
      };
      const response = await createExport(currentProject?.data?.id, payload);
      setCreatedExportId(response.exportId);
      navigate(`/project/${currentProject?.data?.id}/dashboard/exports/${response.exportId}`);
    } catch (err: unknown) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setDisabled(!name || loading);
  }, [name, loading]);

  return (
    <div className={s.container}>
      <Spinner bg isLoading={loading} />
      <form onSubmit={handleSubmit} className={s.form}>
        <PanelGroup orientation="horizontal" className={s.splitGroup}>

          <Panel defaultSize="40%" minSize="25%" maxSize="60%">
            <div className={s.detailsPanel}>
              <CustomForm
                readOnly={false}
                header={{ icon: faFileExport, title: 'New Export', subtitle: 'Fill the form to create a new export' }}
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
                actions={
                  <>
                    <ActionButton disabled={disabled || loading} icon={faFileExport} text="Create" type="submit" />
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
                onChange={id => setInputMode(id as 'nodes' | 'response')}
                tabs={[
                  { id: 'nodes', label: 'Nodes', icon: faSitemap },
                  { id: 'response', label: 'Response', icon: faCode },
                ]}
              />
              <div className={s.viewerContent}>
                {inputMode === 'nodes' && (
                  <NodeViewer
                    key="create"
                    ref={nodeViewerRef}
                    exportDetails={exportForViewer}
                    editMode
                    onSave={handleNodeSave}
                    apiConnections={currentProject.data?.apiConnections || []}
                  />
                )}
                {inputMode === 'response' && (
                  <div className={s.responsePanel}>
                    <p className={s.responseHint}>Save the export first to see the processed response.</p>
                  </div>
                )}
              </div>
            </div>
          </Panel>

        </PanelGroup>
      </form>
    </div>
  );
}
