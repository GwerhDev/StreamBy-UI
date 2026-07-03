import s from './CreateWorkflowForm.module.css';
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import { RootState, AppDispatch } from '../../../store';
import { addApiResponse } from '../../../store/apiResponsesSlice';
import { setCurrentWorkflow, setWorkflowLoading, setWorkflowError } from '../../../store/currentWorkflowSlice';
import { getWorkflow, updateWorkflow } from '../../../services/workflows';
import { ActionButton } from '../Buttons/ActionButton';
import { SecondaryButton } from '../Buttons/SecondaryButton';
import { LabeledInput } from '../Inputs/LabeledInput';
import { Spinner } from '../Spinner';
import { faSitemap, faFileLines, faXmark } from '@fortawesome/free-solid-svg-icons';
import { Icon } from '@fortawesome/fontawesome-svg-core';
import { CustomForm } from './CustomForm';

export function EditWorkflowForm() {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { id: projectId, workflowId } = useParams<{ id: string; workflowId: string }>();
  const { data: workflow, loading: sliceLoading } = useSelector((state: RootState) => state.currentWorkflow);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [disabled, setDisabled] = useState(true);

  useEffect(() => {
    if (!projectId || !workflowId) return;
    if (workflow?.id === workflowId) {
      setName(workflow.name);
      setDescription(workflow.description || '');
      return;
    }
    dispatch(setWorkflowLoading());
    getWorkflow(projectId, workflowId)
      .then(data => {
        dispatch(setCurrentWorkflow(data));
        setName(data.name);
        setDescription(data.description || '');
      })
      .catch(err => dispatch(setWorkflowError(err.message || 'Failed to load workflow.')));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, workflowId]);

  useEffect(() => { setDisabled(!name.trim() || submitting); }, [name, submitting]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectId || !workflowId) return;
    setSubmitting(true);
    try {
      const updated = await updateWorkflow(projectId, workflowId, {
        name: name.trim(),
        description: description.trim() || undefined,
      });
      dispatch(setCurrentWorkflow(updated));
      dispatch(addApiResponse({ message: 'Workflow updated.', type: 'success' }));
      navigate(`/project/${projectId}/workflows/${workflowId}`);
    } catch (err: any) {
      dispatch(addApiResponse({ message: err.message || 'Failed to update workflow.', type: 'error' }));
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = (e: React.FormEvent) => {
    e.preventDefault();
    navigate(`/project/${projectId}/workflows/${workflowId}`);
  };

  if (sliceLoading) return <Spinner bg isLoading />;

  return (
    <div className={s.container}>
      <form className={s.form} onSubmit={handleSubmit}>
        <CustomForm
          readOnly={false}
          isLoading={submitting}
          header={{ icon: faSitemap, title: 'Edit Workflow', subtitle: 'Update the workflow details' }}
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
              <ActionButton disabled={disabled} icon={faSitemap} text="Save" type="submit" />
              <SecondaryButton icon={faXmark as Icon} onClick={handleCancel} type="button" text="Cancel" />
            </>
          }
        />
      </form>
    </div>
  );
}
