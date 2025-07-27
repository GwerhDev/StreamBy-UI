import { useSelector } from "react-redux";
import { useState, useEffect } from "react";
import { RootState } from "../../../store";
import { createExport, createRawExport } from "../../../services/exports";
import { Export, FieldDefinition } from '../../../interfaces';
import s from './CreateExportForm.module.css';
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
  const [fields, setFields] = useState<FieldDefinition[]>([]);
  const [rawJsonData, setRawJsonData] = useState<any>({}); // For raw JSON data (object)
  const [rawJsonInputString, setRawJsonInputString] = useState<string>(""); // For raw JSON string input
  const [isJsonValid, setIsJsonValid] = useState<boolean>(true);
  const [inputMode, setInputMode] = useState<'form' | 'rawJson'>('form'); // 'form' or 'rawJson'
  const [loading, setLoading] = useState(false);
  const [created, setCreated] = useState<Export | null>(null);
  const [disabled, setDisabled] = useState<boolean>(true);
  const navigate = useNavigate();

  const fieldTypes = [
    { value: "date", label: "Date" },
    { value: "string", label: "String" },
    { value: "number", label: "Number" },
    { value: "boolean", label: "Boolean" },
  ];

  const handleAddField = () => {
    setFields([...fields, { name: "", type: "string", label: "", required: false }]);
  };

  const handleRemoveField = (index: number) => {
    const newFields = [...fields];
    newFields.splice(index, 1);
    setFields(newFields);
  };

  const handleFieldChange = (index: number, fieldName: keyof FieldDefinition, value: string | boolean) => {
    const newFields = [...fields];
    (newFields[index] as any)[fieldName] = value;
    setFields(newFields);
  };

  const handleJsonEditorChange = (jsonString: string, data: object | null, isValid: boolean) => {
    setRawJsonInputString(jsonString);
    setRawJsonData(data);
    setIsJsonValid(isValid);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setLoading(true);

    try {
      let payload: any = {
        name,
        description,
        collectionName,
      };

      if (inputMode === 'rawJson') {
        payload.jsonData = rawJsonData;
        const response = await createRawExport(currentProject?.id || '', payload);
        setCreated(response);
        setRawJsonData({}); // Reset to empty object
        setRawJsonInputString("{}"); // Reset to empty string
      } else { // form mode
        if (fields.length === 0) {
          setLoading(false);
          return;
        }
        payload.fields = fields;
        const response = await createExport(currentProject?.id || '', payload);
        setCreated(response);
        setFields([]);
      }

      setName("");
      setDescription("");
      setCollectionName("");

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
    let isContentDefined = false;
    if (inputMode === 'rawJson') {
      isContentDefined = isJsonValid && rawJsonInputString.trim().length > 0;
    } else { // form mode
      isContentDefined = fields.length > 0;
    }
    setDisabled(!name || !collectionName || !isContentDefined || loading || !isJsonValid);
  }, [name, collectionName, fields, rawJsonInputString, inputMode, loading, isJsonValid]);

  return (
    <div className={s.container}>
      <Spinner isLoading={loading} />
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
        </div>

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
            fields={fields}
            fieldTypes={fieldTypes}
            handleAddField={handleAddField}
            handleRemoveField={handleRemoveField}
            handleFieldChange={handleFieldChange}
          />
        ) : (
          <RawJsonInputMode
            rawJsonInputString={rawJsonInputString}
            handleJsonEditorChange={handleJsonEditorChange}
          />
        )}

        <span className={s.buttonContainer}>
          <ActionButton disabled={disabled || loading} icon={faFileExport} text="Create" type="submit" />
          <SecondaryButton disabled={loading} icon={faXmark} onClick={handleCancel} text="Cancel" />
        </span>

        {created && (
          <div>
            <h4>Export creado:</h4>
            <pre>{JSON.stringify(created, null, 2)}</pre>
          </div>
        )}
      </form>
    </div>
  );
}