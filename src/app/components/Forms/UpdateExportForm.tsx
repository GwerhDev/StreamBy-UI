import s from './UpdateExportForm.module.css';
import { useSelector } from "react-redux";
import { useState, useEffect } from "react";
import { RootState } from "../../../store";
import { getExport, updateExport } from "../../../services/exports";
import { Export } from '../../../interfaces';
import { ActionButton } from '../Buttons/ActionButton';
import { SecondaryButton } from '../Buttons/SecondaryButton';
import { LabeledInput } from '../Inputs/LabeledInput';
import { Spinner } from '../Spinner';
import { faCode, faFileExport, faFileLines, faXmark } from '@fortawesome/free-solid-svg-icons';
import { useNavigate, useParams } from 'react-router-dom';
import { RawJsonInputMode } from './RawJsonInputMode';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { FormInputMode } from './FormInputMode';
import { CustomCheckbox } from '../Inputs/CustomCheckbox';


export function UpdateExportForm() {
  const currentProject = useSelector((state: RootState) => state.currentProject);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [collectionName, setCollectionName] = useState("");
  const [rawJsonData, setRawJsonData] = useState<any>({}); // For raw JSON data (object)
  const [rawJsonInputString, setRawJsonInputString] = useState<string>("{}"); // For raw JSON string input
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [inputMode, setInputMode] = useState<'form' | 'rawJson'>('form'); // 'form' or 'rawJson'
  const [loading, setLoading] = useState(false);
  const [created, setCreated] = useState<Export | null>(null);
  const [disabled, setDisabled] = useState<boolean>(true);
  const [selectedAllowedOrigins, setSelectedAllowedOrigins] = useState<string[]>([]);
  const [isPrivate, setIsPrivate] = useState<boolean>(false);
  const navigate = useNavigate();
  const { id, exportId } = useParams();

  useEffect(() => {
    const fetchExportDetails = async () => {
      if (!id || !exportId) {
        return;
      }
      try {
        setLoading(true);
        const data = await getExport(id, exportId);
        if (data) {
          setName(data.name);
          setDescription(data.description || "");
          setCollectionName(data.collectionName);
          setSelectedAllowedOrigins(data.allowedOrigin || []);
          setIsPrivate(data.private || false);
          if (data.json) {
            const jsonString = JSON.stringify(data.json, null, 2);
            setRawJsonInputString(jsonString);
            setRawJsonData(data.json);
            setJsonError(null);
          } else {
            setRawJsonInputString("{}");
            setRawJsonData({});
            setJsonError(null);
          }
        }
      } catch (err: any) {
        console.error(err);
        setJsonError("Failed to load export data.");
      } finally {
        setLoading(false);
      }
    };

    fetchExportDetails();
  }, [id, exportId]);

  const handleJsonDataChange = (newData: any) => {
    setRawJsonData(newData);
    try {
      setRawJsonInputString(JSON.stringify(newData, null, 2));
      setJsonError(null);
    } catch (e: any) {
      setJsonError("Invalid JSON format from form input.");
    }
  };

  const handleRawJsonStringChange = (newRawString: string, data: object | null, isValid: boolean) => {
    setRawJsonInputString(newRawString);
    if (isValid && data) {
      setRawJsonData(data);
      setJsonError(null);
    } else {
      setRawJsonData({}); // Clear jsonData if invalid
      setJsonError("Invalid JSON format.");
    }
  };

  const handleAllowedOriginCheckboxChange = (origin: string) => {
    const isChecked = selectedAllowedOrigins.includes(origin) || selectedAllowedOrigins.some(origin => /^\*$/.test(origin));

    if (isChecked) { // The box was checked, now it's being unchecked
      if (selectedAllowedOrigins.some(origin => /^\*$/.test(origin))) {
        // If "all" was selected, now we have a selection of all but one.
        const allOrigins = currentProject?.data?.allowedOrigin || [];
        const newSelection = allOrigins.filter(o => o !== origin);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setLoading(true);

    interface Payload {
      name: string;
      description?: string;
      collectionName: string;
      jsonData: object;
      allowedOrigin: string[];
      private: boolean;
    }

    try {
      const payload: Payload = {
        name,
        description,
        collectionName,
        jsonData: rawJsonData,
        allowedOrigin: selectedAllowedOrigins,
        private: isPrivate,
      };
      
      const response = await updateExport(currentProject?.data?.id || '', exportId || '', payload);
      if (response) {
        setCreated(response);
        navigate(`/project/${id}/dashboard/exports/${response.exportId}`);
      }

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
    const isJsonDataEmpty = Object.keys(rawJsonData).length === 0 && JSON.stringify(rawJsonData) === JSON.stringify({});

    let isContentDefined = false;
    if (inputMode === 'rawJson') {
      isContentDefined = !isJsonDataEmpty;
    } else { // form mode
      isContentDefined = true; // Always enabled in form mode to allow adding first field
    }

    setDisabled(!name || !collectionName || !isContentDefined || loading || jsonError !== null);
  }, [name, collectionName, rawJsonData, inputMode, loading, jsonError, selectedAllowedOrigins]);

  return (
    <div className={s.container}>
      <Spinner bg isLoading={loading} />
      <form onSubmit={handleSubmit}>
        <div className={s.formContainer}>
          <h3>Update Export</h3>
          <p>Fill the form to update a new export</p>

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
            disabled={true}
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

          {currentProject?.data?.allowedOrigin && currentProject.data.allowedOrigin.length > 0 && (
            <div className={s.allowedOriginsContainer}>
              <h4>Allowed Origins for Project</h4>
              <CustomCheckbox
                id="all-origins-checkbox"
                name="all-origins-checkbox"
                checked={selectedAllowedOrigins.some(origin => /^\*$/.test(origin))}
                onChange={handleSelectAllOriginsChange}
                label="Allow all origins from project"
              />
              {currentProject.data.allowedOrigin.map((origin, index) => (
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
              jsonData={rawJsonData}
              onJsonDataChange={handleJsonDataChange}
              jsonError={jsonError}
            />
          ) : (
            <RawJsonInputMode
              jsonData={rawJsonInputString}
              onJsonDataChange={handleRawJsonStringChange}
              jsonError={jsonError}
            />
          )}
        </div>

        <span className={s.buttonContainer}>
          <ActionButton disabled={disabled || loading} icon={faFileExport} text="Update" type="submit" />
          <SecondaryButton disabled={loading} icon={faXmark} onClick={handleCancel} text="Cancel" />
        </span>

        {created && (
          <div>
            <h4>Export updated:</h4>
            <pre>{JSON.stringify(created, null, 2)}</pre>
          </div>
        )}
      </form>
    </div>
  );
}

