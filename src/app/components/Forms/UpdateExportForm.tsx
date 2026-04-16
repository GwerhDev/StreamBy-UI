import s from './UpdateExportForm.module.css';
import { useSelector } from "react-redux";
import { useState, useEffect, useMemo } from "react";
import { RootState } from "../../../store";
import { getExport, updateExport } from "../../../services/exports";
import { ActionButton } from '../Buttons/ActionButton';
import { SecondaryButton } from '../Buttons/SecondaryButton';
import { LabeledInput } from '../Inputs/LabeledInput';
import { LabeledSelect } from '../Inputs/LabeledSelect';
import { Spinner } from '../Spinner';
import { faCode, faFileExport, faFileLines, faXmark, faSitemap, faDatabase, faGlobe, faLayerGroup, faLock, faTowerBroadcast, faPenToSquare } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { RawJsonInputMode } from './RawJsonInputMode';
import { FormInputMode } from './FormInputMode';
import { CustomCheckbox } from '../Inputs/CustomCheckbox';
import { NodeViewer } from '../NodeViewer/NodeViewer';
import { Export, ApiConnection } from '../../../interfaces';
import { Panel, Group as PanelGroup, Separator as PanelResizeHandle } from 'react-resizable-panels';
import { Tabs } from '../Tabs/Tabs';
import { CustomForm } from './CustomForm';

export function UpdateExportForm() {
  const navigate = useNavigate();
  const currentProject = useSelector((state: RootState) => state.currentProject);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [collectionName, setCollectionName] = useState("");
  const [jsonData, setJsonData] = useState<object>({});
  const [rawJsonString, setRawJsonString] = useState<string>('{}');
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [inputMode, setInputMode] = useState<'form' | 'rawJson' | 'flow'>('flow');
  const [loading, setLoading] = useState(false);
  const [disabled, setDisabled] = useState<boolean>(true);
  const [selectedAllowedOrigins, setSelectedAllowedOrigins] = useState<string[]>([]);
  const [isPrivate, setIsPrivate] = useState<boolean>(false);
  const [exportType, setExportType] = useState<'json' | 'externalApi'>('json');
  const [apiUrl, setApiUrl] = useState<string>('');
  const [credentialId, setCredentialId] = useState<string>('');
  const [prefix, setPrefix] = useState<string>('');
  const [selectedConnectionId, setSelectedConnectionId] = useState<string | null>(null);
  const [apiMethod, setApiMethod] = useState<'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE'>('GET');
  const [fetchedExport, setFetchedExport] = useState<Export | null>(null);
  const { id, exportId } = useParams();

  const populateFromData = (data: Export) => {
    setFetchedExport(data);
    setName(data.name);
    setDescription(data.description || "");
    setCollectionName(data.collectionName);
    setSelectedAllowedOrigins(data.allowedOrigin || []);
    setIsPrivate(data.private || false);
    setExportType(data.type || 'json');
    setApiUrl(data.apiUrl || '');
    setPrefix(data.prefix || '');
    setCredentialId(data.credentialId || '');
    const match = currentProject?.data?.apiConnections?.find((c: ApiConnection) => c.baseUrl === data.apiUrl);
    if (match) { setSelectedConnectionId(match.id); setApiMethod(match.method); }
    else if (data.method) { setApiMethod(data.method); }
    if (data.json) {
      if (data.type === 'json') { setRawJsonString(JSON.stringify(data.json, null, 2)); setJsonData(data.json); }
      else { setRawJsonString(JSON.stringify(data.fields, null, 2)); setJsonData(data.fields || {}); }
    } else { setRawJsonString("{}"); setJsonData({}); }
    setJsonError(null);
  };

  useEffect(() => {
    const cached = currentProject.data?.exports?.find(e => e.id === exportId);
    if (cached?.json !== undefined) {
      populateFromData(cached);
      return;
    }
    const fetchExportDetails = async () => {
      if (!id || !exportId) return;
      try {
        setLoading(true);
        const data = await getExport(id, exportId);
        if (data) populateFromData(data);
        else setJsonError("Export not found.");
      } catch (err: unknown) {
        console.error(err); setJsonError("Failed to load export data.");
      } finally {
        setLoading(false);
      }
    };
    fetchExportDetails();
    //eslint-disable-next-line
  }, [id, exportId]);

  const handleConnectionSelect = (conn: ApiConnection) => {
    setApiUrl(conn.baseUrl); setCredentialId(conn.credentialId || '');
    setSelectedConnectionId(conn.id); setApiMethod(conn.method);
  };

  const exportForViewer = useMemo<Export | null>(() => {
    if (!fetchedExport) return null;
    return {
      ...fetchedExport, name, type: exportType, method: apiMethod, prefix,
      private: isPrivate, credentialId: credentialId || undefined,
      apiUrl, collectionName, allowedOrigin: selectedAllowedOrigins,
    };
  }, [fetchedExport, name, exportType, apiMethod, prefix, isPrivate, credentialId, apiUrl, collectionName, selectedAllowedOrigins]);

  const handleNodeSave = (updates: Record<string, string | boolean>) => {
    if ('apiUrl' in updates && typeof updates.apiUrl === 'string') setApiUrl(updates.apiUrl);
    if ('collectionName' in updates && typeof updates.collectionName === 'string') setCollectionName(updates.collectionName);
    if ('prefix' in updates && typeof updates.prefix === 'string') setPrefix(updates.prefix);
    if ('private' in updates && typeof updates.private === 'boolean') setIsPrivate(updates.private);
  };

  const handleJsonDataChange = (newData: object) => {
    setJsonData(newData);
    try { setRawJsonString(JSON.stringify(newData, null, 2)); setJsonError(null); }
    catch { setJsonError("Invalid JSON format from form input."); }
  };

  const handleRawJsonStringChange = (newRawString: string, data: object | null, isValid: boolean) => {
    setRawJsonString(newRawString);
    if (isValid && data) { setJsonData(data); setJsonError(null); }
    else { setJsonData({}); setJsonError("Invalid JSON format."); }
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
    setLoading(true);
    try {
      const payload = {
        name, description, collectionName,
        allowedOrigin: selectedAllowedOrigins,
        private: isPrivate, exportType,
        ...(exportType !== 'externalApi' && { jsonData }),
        ...(exportType === 'externalApi' && { apiUrl, prefix, credentialId: credentialId || undefined, fields: jsonData }),
      };
      await updateExport(id || '', exportId || '', payload);
      navigate(`/project/${id}/dashboard/exports/${exportId}`);
    } catch (err: unknown) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let isFormValid = true;
    if (!name) isFormValid = false;
    if (exportType === 'externalApi') {
      if (!apiUrl) isFormValid = false;
    } else {
      const isJsonDataEmpty = Object.keys(jsonData).length === 0 && JSON.stringify(jsonData) === JSON.stringify({});
      if (inputMode === 'rawJson') { if (isJsonDataEmpty || jsonError !== null) isFormValid = false; }
      else { if (jsonError !== null) isFormValid = false; }
    }
    setDisabled(!isFormValid || loading);
  }, [name, collectionName, jsonData, inputMode, loading, jsonError, selectedAllowedOrigins, exportType, apiUrl]);

  return (
    <div className={s.container}>
      <Spinner bg isLoading={loading} />
      <form onSubmit={handleSubmit} className={s.form}>
        <PanelGroup orientation="horizontal" className={s.splitGroup}>

          <Panel defaultSize="40%" minSize="25%" maxSize="60%">
            <div className={s.detailsPanel}>
              <CustomForm
                readOnly={false}
                header={{ icon: faPenToSquare, title: 'Update Export', subtitle: 'Fill the form to update an export' }}
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
                    icon: faDatabase,
                    label: 'Collection',
                    value: collectionName || '—',
                    editComponent: (
                      <LabeledInput
                        label="Collection's name" type="text" placeholder="" id="collection-input"
                        name="collection-input" htmlFor="collection-input" value={collectionName}
                        onChange={e => setCollectionName(e.target.value)}
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
                    icon: faLayerGroup,
                    label: 'Export Type',
                    value: exportType,
                    editComponent: (
                      <LabeledSelect
                        label="Export Type" id="export-type-select" name="export-type-select"
                        htmlFor="export-type-select" value={exportType}
                        onChange={e => setExportType(e.target.value as 'json' | 'externalApi')}
                        options={[{ value: 'json', label: 'JSON' }, { value: 'externalApi', label: 'External API' }]}
                      />
                    ),
                  },
                  {
                    icon: faLock,
                    label: 'Private',
                    value: isPrivate ? 'Yes' : 'No',
                    hidden: inputMode === 'flow',
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
                  {
                    icon: faTowerBroadcast,
                    label: 'API Connection',
                    value: selectedConnectionId || '—',
                    hidden: exportType !== 'externalApi' || inputMode === 'flow',
                    editComponent: (currentProject?.data?.apiConnections?.length ?? 0) > 0 ? (
                      <ul className={s.connectionsList}>
                        {currentProject.data!.apiConnections!.map((conn: ApiConnection) => (
                          <li
                            key={conn.id}
                            className={`${s.connectionItem} ${selectedConnectionId === conn.id ? s.connectionSelected : ''}`}
                            onClick={() => handleConnectionSelect(conn)}
                          >
                            <span className={s.methodBadge}>{conn.method}</span>
                            <span className={s.connectionName}>{conn.name}</span>
                            <small className={s.connectionUrl}>{conn.baseUrl}</small>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className={s.emptyConnections}>
                        No connections yet.{' '}
                        <Link to={`/project/${id}/connections/api/create`}>
                          <FontAwesomeIcon icon={faTowerBroadcast} /> Create one
                        </Link>
                      </p>
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
                onChange={id => setInputMode(id as 'flow' | 'form' | 'rawJson')}
                tabs={[
                  { id: 'flow', label: 'Flow', icon: faSitemap },
                  { id: 'form', label: 'Form input', icon: faFileLines },
                  { id: 'rawJson', label: 'Raw JSON', icon: faCode },
                ]}
              />
              <div className={s.viewerContent}>
                {inputMode === 'form' && (
                  <FormInputMode jsonData={jsonData} onJsonDataChange={handleJsonDataChange} jsonError={jsonError} />
                )}
                {inputMode === 'rawJson' && (
                  <RawJsonInputMode jsonData={rawJsonString} onJsonDataChange={handleRawJsonStringChange} jsonError={jsonError} />
                )}
                {inputMode === 'flow' && exportForViewer && (
                  <NodeViewer
                    exportDetails={exportForViewer}
                    editMode
                    onSave={handleNodeSave}
                    apiConnections={currentProject?.data?.apiConnections ?? []}
                    onConnectionSelect={handleConnectionSelect}
                    selectedConnectionId={selectedConnectionId}
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
