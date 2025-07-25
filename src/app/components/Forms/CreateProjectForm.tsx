import s from './CreateProjectForm.module.css';
import { useRef, useState, FormEvent, useEffect } from 'react';
import { ActionButton } from '../Buttons/ActionButton';
import { SecondaryButton } from '../Buttons/SecondaryButton';
import { faDiagramProject, faFileImage, faPlus, faXmark } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { LabeledInput } from '../Inputs/LabeledInput';
import {
  createProject,
  uploadToPresignedUrl,
  updateProjectImage,
  uploadProjectImage,
} from '../../../services/projects';
import { useNavigate } from 'react-router-dom';
import { useProjects } from '../../../hooks/useProjects';
import { LabeledSelect } from '../Selects/LabeledSelect';
import { useSelector } from 'react-redux';
import { RootState } from '../../../store';
import { Spinner } from '../Spinner';

export const CreateProjectForm = () => {
  const [name, setName] = useState<string>("");
  const [loader, setLoader] = useState<boolean>(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [disabled, setDisabled] = useState<boolean>(true);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [description, setDescription] = useState<string>("");
  const [selectedDatabase, setSelectedDatabase] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { loadProjects } = useProjects();
  const navigate = useNavigate();

  const { databases, loading, error } = useSelector((state: RootState) => state.management);

  useEffect(() => {
    if (databases.length > 0 && !selectedDatabase) {
      setSelectedDatabase(databases[0].value);
    }
  }, [databases, selectedDatabase]);

  const handleOnSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      setLoader(true);
      const response = await createProject({ name, description, dbType: selectedDatabase });
      const { projects, projectId } = response || {};

      if (imageFile && projectId) {
        const contentType = imageFile.type;
        const { url, publicUrl } = await uploadProjectImage(projectId);
        await uploadToPresignedUrl(url, imageFile, contentType);
        await updateProjectImage(projectId, publicUrl);
      }
      loadProjects(projects);
      navigate(`/project/${projectId}/dashboard/overview`);
      setLoader(false);

    } catch (err) {
      setLoader(false);
      alert((err as Error).message);
    }
  };

  const handleCancel = () => {
    navigate('/');
  };

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target || {};
    if (name === 'name-input') {
      setName(value);
    } else if (name === 'description-input') {
      setDescription(value);
    }
  };

  useEffect(() => {
    setDisabled(!name || !selectedDatabase || loading);
  }, [name, selectedDatabase, loading]);

  if (loading) {
    return <div>Loading databases...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div className={s.divContainer}>
      <Spinner isLoading={loader} />
      <form className={s.container} onSubmit={handleOnSubmit}>
        <h3>New Project</h3>
        <p>Fill the form to create a new project</p>

        <ul>
          <li className={s.imgContainer} onClick={handleImageClick}>
            {preview ? (
              <span className={s.previewImageContainer}>
                <img src={preview} alt="preview" className={s.previewImage} />
              </span>
            ) : (
              <FontAwesomeIcon color="var(--color-dark-400)" size="4x" icon={faFileImage} />
            )}
            <span className={s.plusContainer}>
              <FontAwesomeIcon color="var(--color-light-200)" icon={faPlus} />
            </span>
          </li>
          <li>
            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              style={{ display: 'none' }}
              onChange={handleFileChange}
            />
          </li>
        </ul>

        <LabeledInput
          label="Project's name"
          type="text"
          placeholder=""
          id="name-input"
          name="name-input"
          htmlFor="name-input"
          value={name}
          onChange={handleInput}
        />

        <LabeledInput
          label="Description (optional)"
          type="text"
          placeholder=""
          id="description-input"
          name="description-input"
          htmlFor="description-input"
          value={description}
          onChange={handleInput}
        />

        <LabeledSelect
          label="Database type"
          id="database-select"
          name="database-select"
          htmlFor="database-select"
          value={selectedDatabase}
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSelectedDatabase(e.target.value)}
          options={databases}
        />

        <span className={s.buttonContainer}>
          <ActionButton disabled={disabled || loader} icon={faDiagramProject} text="Create" type="submit" />
          <SecondaryButton disabled={loader} icon={faXmark} onClick={handleCancel} text="Cancel" />
        </span>
      </form>
    </div>
  );
};
