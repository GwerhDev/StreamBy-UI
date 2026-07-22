import s from './CreatePipelineForm.module.css';
import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../../../store';
import { addApiResponse } from '../../../store/apiResponsesSlice';
import { setCurrentProject } from '../../../store/currentProjectSlice';
import { createPipeline } from '../../../services/pipelines';
import { ActionButton } from '../Buttons/ActionButton';
import { SecondaryButton } from '../Buttons/SecondaryButton';
import { LabeledInput } from '../Inputs/LabeledInput';
import { faDiagramProject, faFileLines, faXmark } from '@fortawesome/free-solid-svg-icons';
import { useNavigate, useParams } from 'react-router-dom';
import { CustomForm } from './CustomForm';
import { Icon } from '@fortawesome/fontawesome-svg-core';

export function CreatePipelineForm() {
  const dispatch = useDispatch<AppDispatch>();
  const currentProject = useSelector((state: RootState) => state.currentProject);
  const { id: projectId } = useParams<{ id: string }>();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [disabled, setDisabled] = useState(true);
  const navigate = useNavigate();

  useEffect(() => { setDisabled(!name || loading); }, [name, loading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectId) return;
    setLoading(true);
    try {
      const pipeline = await createPipeline(projectId, { name, description });
      dispatch(addApiResponse({ message: 'Pipeline created successfully.', type: 'success' }));

      const project = currentProject.data;
      if (project) {
        dispatch(setCurrentProject({
          ...project,
          pipelines: [...(project.pipelines ?? []), { id: pipeline.id, name: pipeline.name, order: pipeline.order }],
        }));
      }

      navigate(`/project/${projectId}/workflow/pipelines/${pipeline.id}/editor`);
    } catch (error: any) {
      dispatch(addApiResponse({ message: error.message || 'Failed to create pipeline.', type: 'error' }));
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = (e: React.FormEvent) => {
    e.preventDefault();
    navigate(`/project/${projectId}/workflow/pipelines`);
  };

  return (
    <div className={s.divContainer}>
      <form className={s.form} onSubmit={handleSubmit}>
        <CustomForm
          readOnly={false}
          header={{ icon: faDiagramProject, title: 'New Pipeline', subtitle: 'Fill the form to create a new Pipeline' }}
          fields={[
            {
              icon: faDiagramProject,
              label: "Pipeline's name",
              value: name || '—',
              editComponent: (
                <LabeledInput
                  label="Pipeline's name" type="text" placeholder=""
                  id="name-input" name="name-input" htmlFor="name-input"
                  value={name} onChange={e => setName(e.target.value)}
                />
              ),
            },
            {
              icon: faFileLines,
              label: 'Description (optional)',
              value: description || '—',
              editComponent: (
                <LabeledInput
                  label="Description (optional)" type="text" placeholder=""
                  id="description-input" name="description-input" htmlFor="description-input"
                  value={description} onChange={e => setDescription(e.target.value)}
                />
              ),
            },
          ]}
          actions={
            <>
              <ActionButton disabled={disabled} icon={faDiagramProject} text="Create" type="submit" />
              <SecondaryButton icon={faXmark as Icon} onClick={handleCancel} type="button" text="Cancel" />
            </>
          }
        />
      </form>
    </div>
  );
}
