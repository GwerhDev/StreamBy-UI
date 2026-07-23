import s from './UserIntegrationList.module.css';
import skeleton from '../Loader/Skeleton.module.css';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlug, faPlus, faTrash, faDatabase, faCloud } from '@fortawesome/free-solid-svg-icons';
import { RootState, AppDispatch } from '../../../store';
import { fetchIntegrations } from '../../../store/managementSlice';
import { SectionHeader } from '../SectionHeader/SectionHeader';
import { ActionButton } from '../Buttons/ActionButton';
import { EmptyBackground } from '../Backgrounds/EmptyBackground';
import { DeleteUserIntegrationModal } from './DeleteUserIntegrationModal';
import { IntegrationPoolEntry } from '../../../interfaces';

export const UserIntegrationList = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { integrations, loading } = useSelector((state: RootState) => state.management);
  const owned = integrations.filter(i => i.source === 'integration');

  const [selected, setSelected] = useState<IntegrationPoolEntry | null>(null);

  useEffect(() => {
    dispatch(fetchIntegrations());
  }, [dispatch]);

  const handleCreate = () => navigate('/user/integrations/create');

  return (
    <div className={s.container}>
      <SectionHeader
        icon={faPlug}
        title="Integrations"
        subtitle="Connect your own databases and storage to use across projects."
        action={!loading && owned.length === 0 ? <ActionButton icon={faPlus} text="Add integration" onClick={handleCreate} /> : undefined}
      />

      {loading ? (
        <ul>
          {Array.from({ length: 3 }).map((_, i) => (
            <li key={i} className={`${s.cardSkeleton} ${skeleton.skeleton}`} />
          ))}
        </ul>
      ) : owned.length === 0 ? (
        <div className={s.emptyState}>
          <EmptyBackground />
        </div>
      ) : (
        <ul>
          {owned.map(entry => (
            <li key={entry.id}>
              <span className={s.cardLeft}>
                <span className={s.cardIcon}>
                  <FontAwesomeIcon icon={entry.kind === 'database' ? faDatabase : faCloud} />
                </span>
                <span className={s.cardInfo}>
                  <h4>{entry.name}</h4>
                  <small>{entry.provider}</small>
                </span>
              </span>
              <span className={s.cardRight}>
                <button
                  className={s.deleteBtn}
                  onClick={() => setSelected(entry)}
                  title="Delete integration"
                >
                  <FontAwesomeIcon icon={faTrash} />
                </button>
              </span>
            </li>
          ))}
          <li className={s.createItem} onClick={handleCreate}>
            <FontAwesomeIcon icon={faPlus} />
            <h4>New integration</h4>
          </li>
        </ul>
      )}

      {selected && (
        <DeleteUserIntegrationModal
          integrationId={selected.id}
          integrationName={selected.name}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
};
