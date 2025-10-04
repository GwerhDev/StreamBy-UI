import s from './CreateExportForm.module.css';
import { useSelector } from "react-redux";
import { useState, useEffect } from "react";
import { RootState } from "../../../store";
import { createExport } from "../../../services/exports";
import { ActionButton } from '../Buttons/ActionButton';
import { SecondaryButton } from '../Buttons/SecondaryButton';
import { LabeledInput } from '../Inputs/LabeledInput';
import { LabeledSelect } from '../Inputs/LabeledSelect';
import { Spinner } from '../Spinner';
import { faFileExport, faXmark, faFileLines, faCode } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useNavigate } from 'react-router-dom';
import { FormInputMode } from './FormInputMode';
import { RawJsonInputMode } from './RawJsonInputMode';
import { CustomCheckbox } from '../Inputs/CustomCheckbox';

export function CreateExportForm() {
  const currentProject = useSelector((state: RootState) => state.currentProject);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [collectionName, setCollectionName] = useState("");
  const [jsonData, setJsonData] = useState<object>({});
  const [rawJsonString, setRawJsonString] = useState<string>('{}');
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [inputMode, setInputMode] = useState<'form' | 'rawJson'>('form'); // 'form' or 'rawJson'
  const [loading, setLoading] = useState(false);
  const [disabled, setDisabled] = useState<boolean>(true);
  const [selectedAllowedOrigins, setSelectedAllowedOrigins] = useState<string[]>(['*']);
  const [isPrivate, setIsPrivate] = useState<boolean>(false);
  const [exportType, setExportType] = useState<'json' | 'externalApi'>('json');
  const [apiUrl, setApiUrl] = useState<string>('');
  const [credentialId, setCredentialId] = useState<string>('');
  const [prefix, setPrefix] = useState<string>('');
  const [availableCredentials, setAvailableCredentials] = useState<{ value: string; label: string }[]>([]);
  const navigate = useNavigate();

  const handleJsonDataChange = (newData: object) => {
    setJsonData(newData);
    try {
      setRawJsonString(JSON.stringify(newData, null, 2));
      setJsonError(null);
    } catch {
      setJsonError("Invalid JSON format from form input.");
    }
  };

  const handleRawJsonStringChange = (newRawString: string, data: object | null, isValid: boolean) => {
    setRawJsonString(newRawString);
    if (isValid && data) {
      setJsonData(data);
      setJsonError(null);
    } else {
      setJsonData({}); // Clear jsonData if invalid
      setJsonError("Invalid JSON format.");
    }
  };

  const handleAllowedOriginCheckboxChange = (origin: string) => {
    const isChecked = selectedAllowedOrigins.includes(origin) || selectedAllowedOrigins.some(origin => /^\*$/.test(origin));

    if (isChecked) { // The box was checked, now it's being unchecked
      if (selectedAllowedOrigins.some(origin => /^\*$/.test(origin))) {
        // If "all" was selected, now we have a selection of all but one.
        const allOrigins = currentProject?.data?.allowedOrigin || [];
        const newSelection = allOrigins.filter((o: string) => o !== origin);
        setSelectedAllowedOrigins(newSelection);
      } else {
        // Just remove the origin from the list
        setSelectedAllowedOrigins(prev => prev.filter(o => o !== origin));
      }
    } else { // The box was unchecked, now it's being checked
      setSelectedAllowedOrigins(prev => [...prev, origin]);
    }
  };

  const handleSelectAllOriginsChange = () => {
    if (selectedAllowedOrigins.some(origin => /^\*$/.test(origin))) {
      setSelectedAllowedOrigins([]);
    } else {
      setSelectedAllowedOrigins(['*']);
    }
  };

  useEffect(() => {
    if (currentProject?.data?.credentials) {
      const credentialsOptions = currentProject.data.credentials.map(cred => ({
        value: cred.id,
        label: cred.key,
      }));
      setAvailableCredentials(credentialsOptions);
      if (credentialsOptions.length > 0) {
        setCredentialId(credentialsOptions[0].value);
      }
    }
  }, [currentProject]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        name,
        description,
        collectionName,
        allowedOrigin: selectedAllowedOrigins,
        private: isPrivate,
        exportType,
        ...(exportType !== 'externalApi' && { data: jsonData }),
        ...(exportType === 'externalApi' && { apiUrl, prefix, credentialId: credentialId || undefined }),
      };
      const response = await createExport(currentProject?.data?.id || '', payload);
      navigate(`/project/${currentProject?.data?.id}/dashboard/exports/${response.exportId}`);
    } catch (err: unknown) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate(-1);
  };

  useEffect(() => {
    let isFormValid = true;

    if (!name || !collectionName) {
      isFormValid = false;
    }

    if (exportType === 'externalApi') {
      if (!apiUrl) {
        isFormValid = false;
      }
    } else {
      const isJsonDataEmpty = Object.keys(jsonData).length === 0 && JSON.stringify(jsonData) === JSON.stringify({});
      if (inputMode === 'rawJson') {
        if (isJsonDataEmpty || jsonError !== null) {
          isFormValid = false;
        }
      } else {
        if (jsonError !== null) {
          isFormValid = false;
        }
      }
    }

    setDisabled(!isFormValid || loading);
  }, [name, collectionName, jsonData, inputMode, loading, jsonError, selectedAllowedOrigins, exportType, apiUrl]);

  return (
    <div className={s.container}>
      <Spinner bg isLoading={loading} />
      <form onSubmit={handleSubmit}>
        <div className={s.formContainer}>
          <h3>New Export</h3>
          <p>Fill the form to create a new export</p>

          <LabeledInput
            label="Export's name"
            type="text"
            placeholder=""
            id="name-input"
            name="name-input"
            htmlFor="name-input"
            value={name}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
          />

          <LabeledInput
            label="Collection's name"
            type="text"
            placeholder=""
            id="collection-name-input"
            name="collection-name-input"
            htmlFor="collection-name-input"
            value={collectionName}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCollectionName(e.target.value)}
          />

          <LabeledInput
            label="Description (optional)"
            type="text"
            placeholder=""
            id="description-input"
            name="description-input"
            htmlFor="description-input"
            value={description}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDescription(e.target.value)}
          />

          <h4>Allowed Origins for this Export</h4>
          {currentProject?.data?.allowedOrigin && currentProject.data.allowedOrigin.length > 0 && (
            <div className={s.allowedOriginsContainer}>
              <CustomCheckbox
                id="all-origins-checkbox"
                name="all-origins-checkbox"
                checked={selectedAllowedOrigins.some(origin => /^\*$/.test(origin))}
                onChange={handleSelectAllOriginsChange}
                label="Allow all origins from project"
              />
              {currentProject.data?.allowedOrigin.map((origin: string, index: number) => (
                <CustomCheckbox
                  key={index}
                  id={`origin-${index}`}
                  name={`origin-${index}`}
                  value={origin}
                  checked={selectedAllowedOrigins.includes(origin) || selectedAllowedOrigins.some(origin => /^\*$/.test(origin))}
                  onChange={() => handleAllowedOriginCheckboxChange(origin)}
                  label={origin}
                />
              ))}
            </div>
          )}

          <CustomCheckbox
            id="private-checkbox"
            name="private-checkbox"
            checked={isPrivate}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setIsPrivate(e.target.checked)}
            label="Private Export"
          />

          <LabeledSelect
            label="Export Type"
            id="export-type-select"
            name="export-type-select"
            htmlFor="export-type-select"
            value={exportType}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setExportType(e.target.value as 'json' | 'externalApi')}
            options={[
              { value: 'json', label: 'JSON' },
              { value: 'externalApi', label: 'External API' },
            ]}
          />

          {exportType === 'externalApi' && (
            <>
              <LabeledInput
                label="API URL"
                type="text"
                placeholder="https://api.example.com/webhook"
                id="api-url-input"
                name="api-url-input"
                htmlFor="api-url-input"
                value={apiUrl}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setApiUrl(e.target.value)}
              />
              <LabeledInput
                label="Prefix (optional)"
                type="text"
                placeholder="data"
                id="prefix-input"
                name="prefix-input"
                htmlFor="prefix-input"
                value={prefix}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPrefix(e.target.value)}
              />
              {availableCredentials.length > 0 && (
                <LabeledSelect
                  label="Credential (optional)"
                  id="credential-select"
                  name="credential-select"
                  htmlFor="credential-select"
                  value={credentialId}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setCredentialId(e.target.value)}
                  options={availableCredentials}
                />
              )}
            </>
          )}
        </div>
        <div className={s.jsonViewer}>
          {exportType !== 'externalApi' && (
            <div className={s.inputModeToggle}>
              <button
                type="button"
                className={`${s.toggleButton} ${inputMode === 'form' ? s.active : ''}`}
                onClick={() => setInputMode('form')}
                title="Form Input"
              >
                <FontAwesomeIcon icon={faFileLines} />
                Form input
              </button>
              <button
                type="button"
                className={`${s.toggleButton} ${inputMode === 'rawJson' ? s.active : ''}`}
                onClick={() => setInputMode('rawJson')}
                title="Raw JSON"
              >
                <FontAwesomeIcon icon={faCode} />
                Raw JSON
              </button>
            </div>
          )}
          {exportType !== 'externalApi' && inputMode === 'form' ? (
            <FormInputMode
              jsonData={jsonData}
              onJsonDataChange={handleJsonDataChange}
              jsonError={jsonError}
            />
          ) : exportType !== 'externalApi' && (
            <RawJsonInputMode
              jsonData={rawJsonString}
              onJsonDataChange={handleRawJsonStringChange}
              jsonError={jsonError}
            />
          )}
        </div>

        <span className={s.buttonContainer}>
          <ActionButton disabled={disabled || loading} icon={faFileExport} text="Create" type="submit" />
          <SecondaryButton disabled={loading} icon={faXmark} onClick={handleCancel} text="Cancel" />
        </span>
      </form >
    </div >
  );
}