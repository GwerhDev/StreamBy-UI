import s from './UpdateProjectForm.module.css';
import { useRef, useState, FormEvent, useEffect } from 'react';
import { ActionButton } from '../Buttons/ActionButton';
import { SecondaryButton } from '../Buttons/SecondaryButton';
import { faFileImage, faFloppyDisk, faPlus, faXmark } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { LabeledInput } from '../Inputs/LabeledInput';
import {
  uploadToPresignedUrl,
  updateProjectImage,
  uploadProjectImage,
  updateProject,
} from '../../../services/projects';
import { useProjects } from '../../../hooks/useProjects';
import { useSelector } from 'react-redux';
import { RootState } from '../../../store';
import { useNavigate } from 'react-router-dom';
import { Spinner } from '../Spinner';

export const UpdateProjectForm = () => {
  const { data: currentProjectData } = useSelector((state: RootState) => state.currentProject);
  const navigate = useNavigate();
  const [name, setName] = useState<string>(currentProjectData?.name || "");
  const [loader, setLoader] = useState<boolean>(false);
  const [preview, setPreview] = useState<string | null>(currentProjectData?.image || null);
  const [disabled, setDisabled] = useState<boolean>(true);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [description, setDescription] = useState<string>(currentProjectData?.description || "");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { loadProjects } = useProjects();

  useEffect(() => {
    setName(currentProjectData?.name || "");
    setPreview(currentProjectData?.image || null);
    setDescription(currentProjectData?.description || "");
  }, [currentProjectData]);

  const handleOnSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      setLoader(true);
      const payload = { name, description };
      const { projects, projectId } = await updateProject(currentProjectData?.id || '', payload);

      if (imageFile && projectId) {
        const contentType = imageFile.type;
        const { url, publicUrl } = await uploadProjectImage(projectId);
        await uploadToPresignedUrl(url, imageFile, contentType);
        await updateProjectImage(projectId, publicUrl);
      }
      loadProjects(projects);
      navigate('/project/' + currentProjectData?.id + '/dashboard/overview');
      setLoader(false);

    } catch (err) {
      setLoader(false);
      alert((err as Error).message);
    }
  };

  const handleCancel = () => {
    navigate('/project/' + currentProjectData?.id + '/dashboard/overview');
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
    setDisabled(!name);
  }, [name]);

  return (
    <div className={s.container}>
      <Spinner bg isLoading={loader} />
      <form className={s.formContainer} onSubmit={handleOnSubmit}>
        <h3>Update Project</h3>
        <p>Fill the form to update your project</p>

        <ul className={s.formContainer}>
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

        <span className={s.buttonContainer}>
          <ActionButton disabled={disabled || loader} icon={faFloppyDisk} text="Update" type="submit" />
          <SecondaryButton disabled={loader} icon={faXmark} onClick={handleCancel} text="Cancel" />
        </span>
      </form>
    </div>
  );
};
