import s from './AllowedOriginsList.module.css';
import React, { useState } from 'react';
import { faGlobe, faTrash } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { ResourceList } from '../ResourceList/ResourceList';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../../store';
import { setCurrentProject } from '../../../store/currentProjectSlice';
import { updateProjectOrigins } from '../../../services/projects';
import { useParams, useNavigate } from 'react-router-dom';

export const AllowedOriginsList = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { id: projectId } = useParams<{ id: string }>();
  const { data: currentProjectData, loading } = useSelector((state: RootState) => state.currentProject);
  const allowedOrigins = currentProjectData?.allowedOrigin ?? [];

  const [saving, setSaving] = useState(false);

  const handleRemove = async (origin: string) => {
    if (!projectId || !currentProjectData) return;
    setSaving(true);
    try {
      const project = await updateProjectOrigins(projectId, allowedOrigins.filter(o => o !== origin));
      dispatch(setCurrentProject(project));
    } finally {
      setSaving(false);
    }
  };

  const items: { id: string; title?: string; card: React.ReactNode; actions?: React.ReactNode }[] = allowedOrigins.map(origin => ({
    id: origin,
    title: origin,
    card: (
      <>
        <span className={s.originIconContainer}>
          <FontAwesomeIcon icon={faGlobe} />
        </span>
        <h4 className={s.originText}>{origin}</h4>
      </>
    ),
    actions: (
      <button
        className={s.deleteButton}
        disabled={saving}
        onClick={e => { e.stopPropagation(); handleRemove(origin); }}
      >
        <FontAwesomeIcon icon={faTrash} />
      </button>
    ),
  }));

  return (
    <ResourceList
      icon={faGlobe}
      title="Allowed Origins"
      subtitle="Manage your project's allowed origins."
      items={items}
      loading={loading}
      onAdd={() => navigate(`/project/${projectId}/settings/permissions/create`)}
      addLabel="Add a new origin"
    />
  );
};
