
import { useSelector } from "react-redux";
import { useState, useEffect } from "react";
import { RootState } from "../../../store";
import { getExport, updateExport } from "../../../services/exports";
import { Export } from '../../../interfaces';
import s from './CreateExportForm.module.css';
import { ActionButton } from '../Buttons/ActionButton';
import { SecondaryButton } from '../Buttons/SecondaryButton';
import { LabeledInput } from '../Inputs/LabeledInput';
import { Spinner } from '../Spinner';
import { faFileExport, faXmark } from '@fortawesome/free-solid-svg-icons';
import { useNavigate, useParams } from 'react-router-dom';
import { RawJsonInputMode } from './RawJsonInputMode';

export function UpdateExportForm() {
  const { data: currentProject } = useSelector((state: RootState) => state.currentProject);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [collectionName, setCollectionName] = useState("");
  const [rawJsonData, setRawJsonData] = useState<any>({}); // For raw JSON data (object)
  const [rawJsonInputString, setRawJsonInputString] = useState<string>(""); // For raw JSON string input
  const [isJsonValid, setIsJsonValid] = useState<boolean>(true);
  const [loading, setLoading] = useState(false);
  const [created, setCreated] = useState<Export | null>(null);
  const [disabled, setDisabled] = useState<boolean>(true);
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
          if (data.json) {
            const jsonString = JSON.stringify(data.json, null, 2);
            setRawJsonInputString(jsonString);
            setRawJsonData(data.json);
          }
        }
      } catch (err: any) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchExportDetails();
  }, [id, exportId]);

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

      payload.jsonData = rawJsonData;
      const response = await updateExport(currentProject?.id || '', exportId || '', payload);
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
    let isContentDefined = isJsonValid && rawJsonInputString.trim().length > 0;
    setDisabled(!name || !collectionName || !isContentDefined || loading || !isJsonValid);
  }, [name, collectionName, rawJsonInputString, loading, isJsonValid]);

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
        </div>

        <RawJsonInputMode
          rawJsonInputString={rawJsonInputString}
          handleJsonEditorChange={handleJsonEditorChange}
        />

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
