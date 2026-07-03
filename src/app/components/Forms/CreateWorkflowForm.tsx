import s from './CreateWorkflowForm.module.css';
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import { RootState, AppDispatch } from '../../../store';
import { addApiResponse } from '../../../store/apiResponsesSlice';
import { setCurrentProject } from '../../../store/currentProjectSlice';
import { createWorkflow } from '../../../services/workflows';
import { ActionButton } from '../Buttons/ActionButton';
import { SecondaryButton } from '../Buttons/SecondaryButton';
import { LabeledInput } from '../Inputs/LabeledInput';
import { faSitemap, faFileLines, faXmark } from '@fortawesome/free-solid-svg-icons';
import { Icon } from '@fortawesome/fontawesome-svg-core';
import { CustomForm } from './CustomForm';

export function CreateWorkflowForm() {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { id: projectId } = useParams<{ id: string }>();
  const currentProjectData = useSelector((state: RootState) => state.currentProject.data);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [disabled, setDisabled] = useState(true);

  useEffect(() => { setDisabled(!name.trim() || loading); }, [name, loading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectId) return;
    setLoading(true);
    try {
      const workflow = await createWorkflow(projectId, {
        name: name.trim(),
        description: description.trim() || undefined,
      });
      if (currentProjectData) {
        dispatch(setCurrentProject({
          ...currentProjectData,
          workflows: [...(currentProjectData.workflows ?? []), workflow],
        }));
      }
      dispatch(addApiResponse({ message: 'Workflow created.', type: 'success' }));
      navigate(`/project/${projectId}/workflows/${workflow.id}`);
    } catch (err: any) {
      dispatch(addApiResponse({ message: err.message || 'Failed to create workflow.', type: 'error' }));
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = (e: React.FormEvent) => {
    e.preventDefault();
    navigate(`/project/${projectId}/workflows`);
  };

  return (
    <div className={s.container}>
      <form className={s.form} onSubmit={handleSubmit}>
        <CustomForm
          readOnly={false}
          isLoading={loading}
          header={{ icon: faSitemap, title: 'New Workflow', subtitle: 'Fill the form to create a new workflow' }}
          fields={[
            {
              icon: faSitemap,
              label: 'Workflow name',
              value: name || '—',
              editComponent: (
                <LabeledInput
                  label="Workflow name" type="text" placeholder=""
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
              <ActionButton disabled={disabled} icon={faSitemap} text="Create" type="submit" />
              <SecondaryButton icon={faXmark as Icon} onClick={handleCancel} type="button" text="Cancel" />
            </>
          }
        />
      </form>
    </div>
  );
}
