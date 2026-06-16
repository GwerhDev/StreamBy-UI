import s from './AllowedOriginsList.module.css';
import { useState } from 'react';
import { faGlobe, faTrash } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { ActionButton } from '../Buttons/ActionButton';
import { ResourceList } from '../ResourceList/ResourceList';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../../store';
import { setCurrentProject } from '../../../store/currentProjectSlice';
import { updateProjectOrigins } from '../../../services/projects';
import { useParams } from 'react-router-dom';

export const AllowedOriginsList = () => {
  const dispatch = useDispatch();
  const { id: projectId } = useParams<{ id: string }>();
  const { data: currentProjectData, loading } = useSelector((state: RootState) => state.currentProject);
  const allowedOrigins = currentProjectData?.allowedOrigin ?? [];

  const [showInput, setShowInput] = useState(false);
  const [newOrigin, setNewOrigin] = useState('');
  const [saving, setSaving] = useState(false);

  const handleAdd = async () => {
    const trimmed = newOrigin.trim();
    if (!trimmed || !projectId || !currentProjectData) return;
    setSaving(true);
    try {
      const project = await updateProjectOrigins(projectId, [...allowedOrigins, trimmed]);
      dispatch(setCurrentProject(project));
      setNewOrigin('');
      setShowInput(false);
    } finally {
      setSaving(false);
    }
  };

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

  const items = allowedOrigins.map(origin => ({
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

  if (showInput) {
    items.push({
      id: '__input',
      card: (
        <div className={s.inputCard}>
          <input
            autoFocus
            className={s.originInput}
            type="text"
            placeholder="https://example.com"
            value={newOrigin}
            onChange={e => setNewOrigin(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAdd()}
          />
          <div className={s.inputActions}>
            <ActionButton text="Add" disabled={!newOrigin.trim() || saving} onClick={handleAdd} />
            <button className={s.cancelButton} onClick={() => { setShowInput(false); setNewOrigin(''); }}>
              Cancel
            </button>
          </div>
        </div>
      ),
    });
  }

  return (
    <ResourceList
      icon={faGlobe}
      title="Allowed Origins"
      subtitle="Manage your project's allowed origins."
      items={items}
      loading={loading}
      onAdd={() => setShowInput(true)}
      addLabel="Add a new origin"
    />
  );
};
