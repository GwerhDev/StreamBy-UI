import s from './CreateAllowedOriginForm.module.css';
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../../../store';
import { updateProjectOrigins } from '../../../services/projects';
import { setCurrentProject } from '../../../store/currentProjectSlice';
import { addApiResponse } from '../../../store/apiResponsesSlice';
import { LabeledInput } from '../Inputs/LabeledInput';
import { ActionButton } from '../Buttons/ActionButton';
import { SecondaryButton } from '../Buttons/SecondaryButton';
import { Spinner } from '../Spinner';
import { faGlobe, faXmark, faLink } from '@fortawesome/free-solid-svg-icons';
import { CustomForm } from './CustomForm';

export const CreateAllowedOriginForm = () => {
  const { id: projectId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const currentProject = useSelector((state: RootState) => state.currentProject.data);

  const [origin, setOrigin] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = origin.trim();
    if (!projectId || !trimmed || !currentProject) return;

    setLoading(true);
    try {
      const existing = currentProject.allowedOrigin ?? [];
      const updated = await updateProjectOrigins(projectId, [...existing, trimmed]);
      dispatch(addApiResponse({ message: 'Allowed origin added.', type: 'success' }));
      dispatch(setCurrentProject(updated));
      navigate(`/project/${projectId}/settings/permissions`);
    } catch (error: any) {
      dispatch(addApiResponse({ message: error.message || 'Failed to add allowed origin.', type: 'error' }));
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Spinner bg isLoading={loading} />;
  if (!currentProject) return <div className={s.container}><Spinner bg isLoading={loading} /></div>;

  return (
    <div className={s.container}>
      <form onSubmit={handleSubmit} className={s.form}>
        <CustomForm
          readOnly={false}
          isLoading={loading}
          header={{ icon: faGlobe, title: 'New Allowed Origin', subtitle: `Add an allowed origin for ${currentProject.name}` }}
          fields={[
            {
              icon: faLink,
              label: 'Origin URL',
              value: origin || '—',
              editComponent: (
                <LabeledInput
                  label="Origin URL" name="origin" value={origin} type="url"
                  placeholder="https://example.com"
                  id="origin-url" htmlFor="origin-url"
                  onChange={e => setOrigin(e.target.value)} disabled={loading}
                />
              ),
            },
          ]}
          actions={
            <>
              <ActionButton disabled={loading || !origin.trim()} icon={faGlobe} text="Add" type="submit" />
              <SecondaryButton disabled={loading} icon={faXmark} onClick={() => navigate(-1)} text="Cancel" />
            </>
          }
        />
      </form>
    </div>
  );
};
