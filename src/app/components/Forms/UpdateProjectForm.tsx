import s from './UpdateProjectForm.module.css';
import { useRef, useState, FormEvent, useEffect } from 'react';
import { ActionButton } from '../Buttons/ActionButton';
import { SecondaryButton } from '../Buttons/SecondaryButton';
import { faDiagramProject, faFileImage, faFileLines, faGlobe, faFloppyDisk, faPlus, faXmark } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { LabeledInput } from '../Inputs/LabeledInput';
import {
  updateProject,
  updateProjectImage,
  uploadProjectImage,
  uploadToPresignedUrl,
} from '../../../services/projects';
import { useProjects } from '../../../hooks/useProjects';
import { useSelector } from 'react-redux';
import { RootState } from '../../../store';
import { useNavigate } from 'react-router-dom';
import { Spinner } from '../Spinner';
import { CustomForm } from './CustomForm';

export const UpdateProjectForm = () => {
  const { data: currentProjectData } = useSelector((state: RootState) => state.currentProject);
  const navigate = useNavigate();
  const [name, setName] = useState<string>(currentProjectData?.name || "");
  const [loader, setLoader] = useState<boolean>(false);
  const [preview, setPreview] = useState<string | null>(currentProjectData?.image || null);
  const [disabled, setDisabled] = useState<boolean>(true);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [description, setDescription] = useState<string>(currentProjectData?.description || "");
  const [allowedOrigin, setAllowedOrigin] = useState<string[]>(currentProjectData?.allowedOrigin || [""]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { loadProjects } = useProjects();

  useEffect(() => {
    setName(currentProjectData?.name || "");
    setPreview(currentProjectData?.image || null);
    setDescription(currentProjectData?.description || "");
    setAllowedOrigin(currentProjectData?.allowedOrigin || []);
  }, [currentProjectData]);

  const handleOnSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      setLoader(true);
      const payload = { name, description, allowedOrigin: allowedOrigin.filter(o => o.trim() !== '') };
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

  const handleCancel = () => navigate('/project/' + currentProjectData?.id + '/dashboard/overview');

  const handleImageClick = () => fileInputRef.current?.click();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleAllowedOriginChange = (index: number, value: string) => {
    const updated = [...allowedOrigin];
    updated[index] = value;
    setAllowedOrigin(updated);
  };

  const handleAddAllowedOrigin = () => setAllowedOrigin([...allowedOrigin, ""]);

  const handleRemoveAllowedOrigin = (index: number) => {
    const updated = [...allowedOrigin];
    updated.splice(index, 1);
    setAllowedOrigin(updated);
  };

  useEffect(() => {
    setDisabled(!name);
  }, [name]);

  return (
    <div className={s.divContainer}>
      <Spinner bg isLoading={loader} />
      <form className={s.form} onSubmit={handleOnSubmit}>
        <CustomForm
          readOnly={false}
          header={{ icon: faDiagramProject, title: 'Update Project', subtitle: 'Edit your project details below' }}
          fields={[
            {
              icon: faFileImage,
              label: 'Image',
              value: null,
              editComponent: (
                <div className={s.imageField}>
                  <div className={s.imgContainer} onClick={handleImageClick}>
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
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    ref={fileInputRef}
                    style={{ display: 'none' }}
                    onChange={handleFileChange}
                  />
                </div>
              ),
            },
            {
              icon: faDiagramProject,
              label: "Project's name",
              value: name || '—',
              editComponent: (
                <LabeledInput
                  label="Project's name" type="text" placeholder=""
                  id="name-input" name="name-input" htmlFor="name-input"
                  value={name} onChange={e => setName(e.target.value)}
                />
              ),
            },
            {
              icon: faFileLines,
              label: 'Description',
              value: description || '—',
              editComponent: (
                <LabeledInput
                  label="Description (optional)" type="text" placeholder=""
                  id="description-input" name="description-input" htmlFor="description-input"
                  value={description} onChange={e => setDescription(e.target.value)}
                />
              ),
            },
            {
              icon: faGlobe,
              label: 'Allowed Origins',
              value: null,
              editComponent: (
                <div className={s.allowedOriginsContainer}>
                  {allowedOrigin.map((origin, index) => (
                    <div key={index} className={s.allowedOriginInputContainer}>
                      <LabeledInput
                        label={`Allowed Origin ${index + 1}`} type="text"
                        placeholder="http://example.com"
                        id={`allowed-origin-${index}`} name={`allowed-origin-${index}`}
                        htmlFor={`allowed-origin-${index}`}
                        value={origin} onChange={e => handleAllowedOriginChange(index, e.target.value)}
                      />
                      <button type="button" onClick={() => handleRemoveAllowedOrigin(index)}>
                        <FontAwesomeIcon icon={faXmark} />
                      </button>
                    </div>
                  ))}
                  <button type="button" onClick={handleAddAllowedOrigin}>
                    <FontAwesomeIcon icon={faPlus} /> Add Origin
                  </button>
                </div>
              ),
            },
          ]}
          actions={
            <>
              <ActionButton disabled={disabled || loader} icon={faFloppyDisk} text="Update" type="submit" />
              <SecondaryButton disabled={loader} icon={faXmark} onClick={handleCancel} text="Cancel" />
            </>
          }
        />
      </form>
    </div>
  );
};
