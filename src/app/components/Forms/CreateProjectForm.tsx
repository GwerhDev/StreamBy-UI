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
  getDatabases,
} from '../../../services/streamby';
import { Database } from '../../../interfaces';
import { useNavigate } from 'react-router-dom';
import { useProjects } from '../../../hooks/useProjects';

export const CreateProjectForm = () => {
  const [name, setName] = useState<string>("");
  const [loader, setLoader] = useState<boolean>(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [disabled, setDisabled] = useState<boolean>(true);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [description, setDescription] = useState<string>("");
  const [databases, setDatabases] = useState<Database[]>([]);
  const [selectedDatabaseId, setSelectedDatabaseId] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { refreshProjects } = useProjects();
  const navigate = useNavigate();

  const handleOnSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      setLoader(true);
      const response = await createProject({ name, description, databaseId: selectedDatabaseId });
      const { project } = response || {};

      if (imageFile && project?.id) {
        const contentType = imageFile.type;
        const { url, publicUrl } = await uploadProjectImage(project.id);
        await uploadToPresignedUrl(url, imageFile, contentType);
        await updateProjectImage(project.id, publicUrl);
      }
      await refreshProjects();
      navigate(`/project/${project.id}/dashboard/overview`);
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
    setDisabled(!name || !selectedDatabaseId);
  }, [name, selectedDatabaseId]);

  useEffect(() => {
    const fetchDatabases = async () => {
      try {
        const fetchedDatabases = await getDatabases();
        setDatabases(fetchedDatabases);
        if (fetchedDatabases.length > 0) {
          setSelectedDatabaseId(fetchedDatabases[0].id);
        }
      } catch (err) {
        console.error("Failed to fetch databases:", err);
        alert("Failed to load databases. Please try again later.");
      }
    };
    fetchDatabases();
  }, []);

  return (
    <div className={s.divContainer}>
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

        <div className={s.labeledSelect}>
          <label htmlFor="database-select">Database type</label>
          <select
            id="database-select"
            name="database-select"
            value={selectedDatabaseId}
            onChange={(e) => setSelectedDatabaseId(e.target.value)}
            className={s.selectInput}
          >
            {databases.map((db, index) => (
              <option key={index} value={db.value}>
                {db.name}
              </option>
            ))}
          </select>
        </div>

        <span className={s.buttonContainer}>
          <ActionButton disabled={disabled || loader} icon={faDiagramProject} text="Create" type="submit" />
          <SecondaryButton disabled={loader} icon={faXmark} onClick={handleCancel} text="Cancel" />
        </span>
      </form>
    </div>
  );
};
