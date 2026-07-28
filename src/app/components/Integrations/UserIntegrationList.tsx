import s from './UserIntegrationList.module.css';
import skeleton from '../Loader/Skeleton.module.css';
import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGlobe, faPlug, faPlus, faTrash, faDatabase, faCloud } from '@fortawesome/free-solid-svg-icons';
import { RootState, AppDispatch } from '../../../store';
import { fetchIntegrations } from '../../../store/managementSlice';
import { addApiResponse } from '../../../store/apiResponsesSlice';
import { SectionHeader } from '../SectionHeader/SectionHeader';
import { ActionButton } from '../Buttons/ActionButton';
import { EmptyBackground } from '../Backgrounds/EmptyBackground';
import { DeleteUserIntegrationModal } from './DeleteUserIntegrationModal';
import { IntegrationKind, IntegrationPoolEntry, ServiceProviderType } from '../../../interfaces';
import { SERVICE_PROVIDER_ICON } from './serviceProviderIcons';
import streambyIcon from '../../../assets/streamby-icon.svg';

const KIND_ICON: Record<IntegrationKind, typeof faDatabase> = {
  database: faDatabase,
  storage: faCloud,
  service: faPlug,
};

export const UserIntegrationList = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const [searchParams, setSearchParams] = useSearchParams();
  const { integrations, loading } = useSelector((state: RootState) => state.management);

  const [selected, setSelected] = useState<IntegrationPoolEntry | null>(null);

  useEffect(() => {
    dispatch(fetchIntegrations());
  }, [dispatch]);

  useEffect(() => {
    const connected = searchParams.get('connected');
    const oauthError = searchParams.get('oauthError');
    if (!connected && !oauthError) return;

    dispatch(fetchIntegrations());
    if (connected) {
      dispatch(addApiResponse({ message: `${connected} connected.`, type: 'success' }));
    } else if (oauthError) {
      dispatch(addApiResponse({ message: `Failed to connect: ${oauthError}`, type: 'error' }));
    }
    setSearchParams({}, { replace: true });
    // eslint-disable-next-line
  }, []);

  const handleCreate = () => navigate('/user/integrations/create');

  return (
    <div className={s.container}>
      <SectionHeader
        icon={faGlobe}
        title="Integrations"
        subtitle="Connect your own databases and storage to use across projects."
        action={!loading && integrations.length === 0 ? <ActionButton icon={faPlus} text="Add integration" onClick={handleCreate} /> : undefined}
      />

      {loading ? (
        <ul>
          {Array.from({ length: 3 }).map((_, i) => (
            <li key={i} className={`${s.cardSkeleton} ${skeleton.skeleton}`} />
          ))}
        </ul>
      ) : integrations.length === 0 ? (
        <div className={s.emptyState}>
          <EmptyBackground />
        </div>
      ) : (
        <ul>
          {integrations.map(entry => (
            <li key={entry.id}>
              <span className={s.cardLeft}>
                <span className={s.cardIcon}>
                  <FontAwesomeIcon icon={entry.kind === 'service' ? SERVICE_PROVIDER_ICON[entry.provider as ServiceProviderType] : KIND_ICON[entry.kind]} />
                </span>
                <span className={s.cardInfo}>
                  <h4>{entry.name}</h4>
                  <small>{entry.provider}</small>
                </span>
              </span>
              <span className={s.cardRight}>
                {entry.source === 'builtin' ? (
                  <img src={streambyIcon} alt="Built-in" className={s.builtinIcon} title="Built-in" />
                ) : (
                  <button
                    className={s.deleteBtn}
                    onClick={() => setSelected(entry)}
                    title="Delete integration"
                  >
                    <FontAwesomeIcon icon={faTrash} />
                  </button>
                )}
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
