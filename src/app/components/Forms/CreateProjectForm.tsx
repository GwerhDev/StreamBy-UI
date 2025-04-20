import s from './CreateProjectForm.module.css';
import { useRef, useState, FormEvent } from 'react';
import { ActionButton } from '../Buttons/ActionButton';
import { SecondaryButton } from '../Buttons/SecondaryButton';
import { faDiagramProject, faFileImage, faPlus, faXmark } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { LabeledInput } from '../Inputs/LabeledInput';
import {
  createProject,
  getUploadUrl,
  uploadToPresignedUrl,
  updateProjectImage,
} from '../../../services/streamby';
import { useNavigate } from 'react-router-dom';
import { useProjects } from '../../../hooks/useProjects';

export const CreateProjectForm = () => {
  const [preview, setPreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { refreshProjects } = useProjects();

  const handleOnSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      const response = await createProject({ name, description });
      const { project } = response || {};

      if (imageFile && project?.id) {
        const contentType = imageFile.type;
        const { url, publicUrl } = await getUploadUrl(project.id, imageFile.name, contentType);
        await uploadToPresignedUrl(url, imageFile, contentType);
        await updateProjectImage(project.id, publicUrl);
      }
      await refreshProjects();
      navigate(`/project/${project.id}`);

    } catch (err) {
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
              <FontAwesomeIcon color="var(--color-dark)" size="4x" icon={faFileImage} />
            )}
            <span className={s.plusContainer}>
              <FontAwesomeIcon color="var(--color-lighter)" icon={faPlus} />
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

        <span className={s.buttonContainer}>
          <ActionButton icon={faDiagramProject} text="Create" type="submit" />
          <SecondaryButton icon={faXmark} onClick={handleCancel} text="Cancel" />
        </span>
      </form>
    </div>
  );
};
