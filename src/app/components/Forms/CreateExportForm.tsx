import s from './CreateExportForm.module.css';
import { useSelector } from "react-redux";
import { useState, useEffect } from "react";
import { RootState } from "../../../store";
import { createExport } from "../../../services/exports";

import { ActionButton } from '../Buttons/ActionButton';
import { SecondaryButton } from '../Buttons/SecondaryButton';
import { LabeledInput } from '../Inputs/LabeledInput';
import { Spinner } from '../Spinner';
import { faFileExport, faXmark, faFileLines, faCode } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useNavigate } from 'react-router-dom';
import { FormInputMode } from './FormInputMode';
import { RawJsonInputMode } from './RawJsonInputMode';

export function CreateExportForm() {
  const { data: currentProject } = useSelector((state: RootState) => state.currentProject);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [collectionName, setCollectionName] = useState("");
  const [jsonData, setJsonData] = useState<any>({});
  const [rawJsonString, setRawJsonString] = useState<string>('{}');
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [inputMode, setInputMode] = useState<'form' | 'rawJson'>('form'); // 'form' or 'rawJson'
  const [loading, setLoading] = useState(false);
  const [disabled, setDisabled] = useState<boolean>(true);
  const [selectedAllowedOrigins, setSelectedAllowedOrigins] = useState<string[]>([]);
  const [isPrivate, setIsPrivate] = useState<boolean>(false);
  const navigate = useNavigate();

  const handleJsonDataChange = (newData: any) => {
    setJsonData(newData);
    try {
      setRawJsonString(JSON.stringify(newData, null, 2));
      setJsonError(null);
    } catch (e: any) {
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
    setSelectedAllowedOrigins(prev =>
      prev.includes(origin) ? prev.filter(o => o !== origin) : [...prev, origin]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        name,
        jsonData,
        description,
        collectionName,
        allowedOrigin: selectedAllowedOrigins,
        private: isPrivate,
      };
      const response = await createExport(currentProject?.id || '', payload);
      navigate(`/project/${currentProject?.id}/dashboard/exports/${response.exportId}`);
    } catch (err: unknown) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate(-1); // Go back to the previous page
  };

  useEffect(() => {
    const isJsonDataEmpty = Object.keys(jsonData).length === 0 && JSON.stringify(jsonData) === JSON.stringify({});

    let isContentDefined = false;
    if (inputMode === 'rawJson') {
      isContentDefined = !isJsonDataEmpty;
    } else { // form mode
      isContentDefined = true; // Always enabled in form mode to allow adding first field
    }

    setDisabled(!name || !collectionName || !isContentDefined || loading || jsonError !== null);
  }, [name, collectionName, jsonData, inputMode, loading, jsonError, selectedAllowedOrigins]);

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

          {currentProject?.allowedOrigin && currentProject.allowedOrigin.length > 0 && (
            <div className={s.allowedOriginsContainer}>
              <h4>Allowed Origins for Project</h4>
              {currentProject.allowedOrigin.map((origin, index) => (
                <div key={index} className={s.checkboxContainer}>
                  <input
                    type="checkbox"
                    id={`origin-${index}`}
                    name={`origin-${index}`}
                    value={origin}
                    checked={selectedAllowedOrigins.includes(origin)}
                    onChange={() => handleAllowedOriginCheckboxChange(origin)}
                  />
                  <label htmlFor={`origin-${index}`}>{origin}</label>
                </div>
              ))}
            </div>
          )}

          <div className={s.checkboxContainer}>
            <input
              type="checkbox"
              id="private-checkbox"
              name="private-checkbox"
              checked={isPrivate}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setIsPrivate(e.target.checked)}
            />
            <label htmlFor="private-checkbox">Private Export</label>
          </div>
        </div>
        <div className={s.jsonViewer}>
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
          {inputMode === 'form' ? (
            <FormInputMode
              jsonData={jsonData}
              onJsonDataChange={handleJsonDataChange}
              jsonError={jsonError}
            />
          ) : (
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