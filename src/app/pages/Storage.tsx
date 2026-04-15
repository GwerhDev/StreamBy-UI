import s from './Storage.module.css';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCloud } from '@fortawesome/free-solid-svg-icons';
import { RootState } from '../../store';

export const Storage = () => {
  const currentProject = useSelector((state: RootState) => state.currentProject);
  const storages = useSelector((state: RootState) => state.management.storages);
  const { id } = currentProject.data || {};

  return (
    <div className={s.container}>
      <div className={s.header}>
        <h2>Storage</h2>
      </div>
      {storages.length === 0 ? (
        <div className={s.empty}>
          <FontAwesomeIcon icon={faCloud} className={s.emptyIcon} />
          <p>No storage services connected</p>
        </div>
      ) : (
        <ul className={s.list}>
          {storages.map(storage => (
            <Link key={storage.value} to={`/project/${id}/storage/${storage.value}`}>
              <li className={s.card}>
                <FontAwesomeIcon icon={faCloud} className={s.cardIcon} />
                <h3>{storage.name}</h3>
                {storage.type && <span className={s.badge}>{storage.type.toUpperCase()}</span>}
              </li>
            </Link>
          ))}
        </ul>
      )}
    </div>
  );
};
