import s from './IntegrationConnection.module.css';
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { faPlug, faXmark } from '@fortawesome/free-solid-svg-icons';
import { RootState, AppDispatch } from '../../../store';
import { setCurrentProject } from '../../../store/currentProjectSlice';
import { addApiResponse } from '../../../store/apiResponsesSlice';
import { createIntegrationConnection } from '../../../services/integrationConnections';
import { ActionButton } from '../Buttons/ActionButton';
import { SecondaryButton } from '../Buttons/SecondaryButton';
import { CustomForm } from '../Forms/CustomForm';
import { IntegrationPicker } from '../Integrations/IntegrationPicker';

export const IntegrationConnectionCreate = () => {
  const { id: projectId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const project = useSelector((state: RootState) => state.currentProject.data);
  const { integrations } = useSelector((state: RootState) => state.management);

  const [integrationId, setIntegrationId] = useState('');
  const [loading, setLoading] = useState(false);
  const [disabled, setDisabled] = useState(true);

  const connectedIntegrationIds = [
    ...(project?.dbConnections ?? []),
    ...(project?.storageConnections ?? []),
    ...(project?.integrationConnections ?? []),
  ].map(c => c.integrationId).filter((id): id is string => !!id);

  useEffect(() => {
    setDisabled(!integrationId || loading);
  }, [integrationId, loading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectId || !project) return;
    setLoading(true);
    try {
      const connection = await createIntegrationConnection(projectId, integrationId);
      dispatch(addApiResponse({ message: 'Service connection created.', type: 'success' }));
      dispatch(setCurrentProject({
        ...project,
        integrationConnections: [...(project.integrationConnections ?? []), connection],
      }));
      navigate(`/project/${projectId}/services`);
    } catch (error: any) {
      dispatch(addApiResponse({ message: error.message || 'Failed to create connection.', type: 'error' }));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={s.container}>
      <form onSubmit={handleSubmit} className={s.formWrapper}>
        <CustomForm
          readOnly={false}
          isLoading={loading}
          header={{ icon: faPlug, title: 'New Service Connection', subtitle: `Attach a Claude/Jira/Google integration to ${project?.name}` }}
          fields={[
            {
              icon: faPlug,
              label: 'Integration',
              value: integrationId || '—',
              editComponent: (
                <IntegrationPicker
                  pool={integrations}
                  kind="service"
                  selected={integrationId ? [integrationId] : []}
                  onChange={ids => setIntegrationId(ids[0] ?? '')}
                  excludeIds={connectedIntegrationIds}
                  single
                />
              ),
            },
          ]}
          actions={
            <>
              <ActionButton disabled={disabled} icon={faPlug} text="Create" type="submit" />
              <SecondaryButton disabled={loading} icon={faXmark} onClick={() => navigate(-1)} text="Cancel" />
            </>
          }
        />
      </form>
    </div>
  );
};
