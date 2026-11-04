import s from './UpdateProjectForm.module.css';
import { useRef, useState, FormEvent, useEffect } from 'react';
import { ActionButton } from '../Buttons/ActionButton';
import { SecondaryButton } from '../Buttons/SecondaryButton';
import { faDiagramProject, faFileImage, faFileLines, faHashtag, faClipboardList, faLayerGroup, faLock, faFloppyDisk, faPlug, faPlus, faXmark } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { LabeledInput } from '../Inputs/LabeledInput';
import { LabeledSelect } from '../Inputs/LabeledSelect';
import { ProjectCategory } from '../../../interfaces';
import {
  updateProject,
  updateProjectImage,
  uploadProjectImage,
  uploadToPresignedUrl,
  addProjectIntegration,
  removeProjectIntegration,
} from '../../../services/projects';
import { getBoard, setCardKey, setProductionLabels } from '../../../services/production';
import { DEFAULT_LABELS } from '../Production/productionLabels';
import { ProductionLabels } from '../../../interfaces';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../../../store';
import { useFormRoute } from '../../../hooks/useFormRoute';
import { setCurrentProject } from '../../../store/currentProjectSlice';
import { addApiResponse } from '../../../store/apiResponsesSlice';
import { CustomForm } from './CustomForm';
import { IntegrationPicker } from '../Integrations/IntegrationPicker';
import { useParams } from 'react-router-dom';

export const UpdateProjectForm = () => {
  const { data: currentProjectData } = useSelector((state: RootState) => state.currentProject);
  const { integrations } = useSelector((state: RootState) => state.management);
  const { close, done } = useFormRoute();
  const { id: routeId } = useParams<{ id: string }>();
  const overviewPath = `/project/${routeId ?? currentProjectData?.id}/dashboard/overview`;
  const dispatch = useDispatch<AppDispatch>();
  const [name, setName] = useState<string>(currentProjectData?.name || "");
  const [loader, setLoader] = useState<boolean>(false);
  const [preview, setPreview] = useState<string | null>(currentProjectData?.image || null);
  const [disabled, setDisabled] = useState<boolean>(true);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [description, setDescription] = useState<string>(currentProjectData?.description || "");
  const [category, setCategory] = useState<ProjectCategory | ''>(currentProjectData?.category || '');
  const [isPublic, setIsPublic] = useState<boolean>(currentProjectData?.public ?? true);
  const [integrationLoading, setIntegrationLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const session = useSelector((state: RootState) => state.session);
  const isFreemium = session.plan === 'freemium';
  const isAdmin = currentProjectData?.members?.find(m => m.userId === session.userId)?.role === 'admin';

  // The key its Production cards' keys start with (e.g. WOG-12): its admins change it.
  const [cardKey, setCardKeyValue] = useState('');
  const savedCardKey = useRef('');
  // What it calls its sequences and shots (a game's may be sets and assets): its admins name them.
  const [labels, setLabels] = useState<ProductionLabels>(DEFAULT_LABELS);
  const savedLabels = useRef<ProductionLabels>(DEFAULT_LABELS);
  useEffect(() => {
    if (!currentProjectData?.id || !isAdmin) return;
    let cancelled = false;
    getBoard(currentProjectData.id)
      .then(({ key, labels: named }) => {
        if (cancelled) return;
        savedCardKey.current = key; setCardKeyValue(key);
        if (named) { savedLabels.current = named; setLabels(named); }
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [currentProjectData?.id, isAdmin]);

  const connectedIntegrationIds = [
    ...(currentProjectData?.dbConnections ?? []),
    ...(currentProjectData?.storageConnections ?? []),
  ].map(c => c.integrationId).filter((id): id is string => !!id);

  const handleIntegrationsChange = async (ids: string[]) => {
    if (!currentProjectData) return;
    const added = ids.find(id => !connectedIntegrationIds.includes(id));
    const removed = connectedIntegrationIds.find(id => !ids.includes(id));

    setIntegrationLoading(true);
    try {
      if (added) {
        const { project } = await addProjectIntegration(currentProjectData.id, added);
        dispatch(setCurrentProject(project));
        dispatch(addApiResponse({ message: 'Integration connected.', type: 'success' }));
      } else if (removed) {
        const { project } = await removeProjectIntegration(currentProjectData.id, removed);
        dispatch(setCurrentProject(project));
        dispatch(addApiResponse({ message: 'Integration disconnected.', type: 'success' }));
      }
    } catch (error: any) {
      dispatch(addApiResponse({ message: error.message || 'Failed to update integrations.', type: 'error' }));
    } finally {
      setIntegrationLoading(false);
    }
  };

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
      if (isAdmin && projectId && cardKey.trim() && cardKey.trim().toUpperCase() !== savedCardKey.current) {
        savedCardKey.current = await setCardKey(projectId, cardKey.trim());
      }
      const changedLabels = (Object.keys(labels) as (keyof ProductionLabels)[]).filter(k => labels[k].trim() !== savedLabels.current[k]);
      if (isAdmin && projectId && changedLabels.length) {
        savedLabels.current = await setProductionLabels(projectId, Object.fromEntries(changedLabels.map(k => [k, labels[k].trim()])));
      }

      if (imageFile && projectId) {
        const contentType = imageFile.type;
        const { url, publicUrl } = await uploadProjectImage(projectId);
        await uploadToPresignedUrl(url, imageFile, contentType);
        await updateProjectImage(projectId, publicUrl);
      }
      done(overviewPath);
      setLoader(false);

    } catch (err) {
      setLoader(false);
      alert((err as Error).message);
    }
  };

  const handleCancel = () => close(overviewPath);

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
            ...(isAdmin ? [{
              icon: faHashtag,
              label: 'Card key',
              value: cardKey || '—',
              editComponent: (
                <LabeledInput
                  label="Card key (its Production cards are KEY-1, KEY-2…)" type="text" placeholder="e.g. WOG"
                  id="card-key-input" name="card-key-input" htmlFor="card-key-input"
                  value={cardKey} onChange={e => setCardKeyValue(e.target.value.toUpperCase())}
                />
              ),
            }, {
              icon: faClipboardList,
              label: 'Production names',
              value: `${labels.sequences} · ${labels.shots}`,
              editComponent: (
                <div className={s.labelsField}>
                  {([['sequence', 'A sequence is called'], ['sequences', 'Sequences are called'], ['shot', 'A shot is called'], ['shots', 'Shots are called']] as [keyof ProductionLabels, string][]).map(([k, text]) => (
                    <LabeledInput
                      key={k} label={text} type="text" placeholder={DEFAULT_LABELS[k]}
                      id={`labels-${k}-input`} name={`labels-${k}-input`} htmlFor={`labels-${k}-input`}
                      value={labels[k]} onChange={e => setLabels(prev => ({ ...prev, [k]: e.target.value }))}
                    />
                  ))}
                </div>
              ),
            }] : []),
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
            {
              icon: faPlug,
              label: 'Integrations',
              value: null,
              editComponent: (
                <IntegrationPicker
                  pool={integrations}
                  selected={connectedIntegrationIds}
                  onChange={handleIntegrationsChange}
                  disabled={integrationLoading}
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
