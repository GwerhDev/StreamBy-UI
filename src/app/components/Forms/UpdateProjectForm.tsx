import s from './UpdateProjectForm.module.css';
import { useRef, useState, FormEvent, useEffect } from 'react';
import { ActionButton } from '../Buttons/ActionButton';
import { SecondaryButton } from '../Buttons/SecondaryButton';
import { faDiagramProject, faFileImage, faFileLines, faLayerGroup, faLock, faFloppyDisk, faPlus, faXmark } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { LabeledInput } from '../Inputs/LabeledInput';
import { LabeledSelect } from '../Inputs/LabeledSelect';
import { ProjectCategory } from '../../../interfaces';
import {
  updateProject,
  updateProjectImage,
  uploadProjectImage,
  uploadToPresignedUrl,
} from '../../../services/projects';
import { useSelector } from 'react-redux';
import { RootState } from '../../../store';
import { useNavigate } from 'react-router-dom';
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
  const [category, setCategory] = useState<ProjectCategory | ''>(currentProjectData?.category || '');
  const [isPublic, setIsPublic] = useState<boolean>(currentProjectData?.public ?? true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const session = useSelector((state: RootState) => state.session);
  const isFreemium = session.plan === 'freemium';

  useEffect(() => {
    setName(currentProjectData?.name || "");
    setPreview(currentProjectData?.image || null);
    setDescription(currentProjectData?.description || "");
    setCategory(currentProjectData?.category || '');
    setIsPublic(currentProjectData?.public ?? true);
  }, [currentProjectData]);

  const handleOnSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      setLoader(true);
      const payload = { name, description, public: isPublic, category: category || null };
      const { projectId } = await updateProject(currentProjectData?.id || '', payload);

      if (imageFile && projectId) {
        const contentType = imageFile.type;
        const { url, publicUrl } = await uploadProjectImage(projectId);
        await uploadToPresignedUrl(url, imageFile, contentType);
        await updateProjectImage(projectId, publicUrl);
      }
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

  useEffect(() => {
    setDisabled(!name);
  }, [name]);

  return (
    <div className={s.divContainer}>
      <form className={s.form} onSubmit={handleOnSubmit}>
        <CustomForm
          readOnly={false}
          isLoading={loader}
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
                      <FontAwesomeIcon color="var(--color-surface-sunken)" size="4x" icon={faFileImage} />
                    )}
                    <span className={s.plusContainer}>
                      <FontAwesomeIcon color="var(--color-text-primary)" icon={faPlus} />
                    </span>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    ref={fileInputRef}
                    className={s.hidden}
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
              icon: faLock,
              label: 'Visibility',
              value: null,
              editComponent: (
                <div className={s.visibilityField}>
                  <div className={s.switchRow}>
                    <span className={s.visibilityLabel}>
                      Visibility: <span className={`${s.visibilityBadge} ${isPublic ? s.badgePublic : s.badgePrivate}`}>{isPublic ? 'Public' : 'Private'}</span>
                    </span>
                    <button
                      type="button"
                      className={`${s.switch} ${!isPublic ? s.switchOff : ''} ${isFreemium ? s.switchDisabled : ''}`}
                      onClick={() => !isFreemium && setIsPublic(v => !v)}
                    />
                  </div>
                  {isFreemium && (
                    <p className={s.upgradeBadge}>Private projects require a Subscriber plan</p>
                  )}
                </div>
              ),
            },
            {
              icon: faLayerGroup,
              label: 'Category',
              value: null,
              editComponent: (
                <LabeledSelect
                  label="Project category (optional)"
                  htmlFor="category-input"
                  value={category}
                  onChange={e => setCategory(e.target.value as ProjectCategory | '')}
                  options={[
                    { value: '', label: '— Select a category —' },
                    { value: 'game', label: 'Game Development' },
                    { value: 'film', label: 'Audiovisual / Film' },
                    { value: 'api', label: 'API / Data Service' },
                    { value: 'creative', label: 'Creative / Design' },
                  ]}
                />
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
