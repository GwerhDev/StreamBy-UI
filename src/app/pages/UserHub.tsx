import s from '../components/User/Settings.module.css';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faIdCard, faArchive, faChevronRight, faUser } from '@fortawesome/free-solid-svg-icons';
import { SectionHeader } from '../components/SectionHeader/SectionHeader';

const SECTIONS = [
  { icon: faIdCard,  label: 'Profile', description: 'Your personal information and preferences', path: '/user/profile' },
  { icon: faArchive, label: 'Archive', description: 'Your archived projects',                    path: '/user/archive' },
];

export const UserHub = () => {
  const navigate = useNavigate();
  return (
    <div className={s.page}>
      <SectionHeader icon={faUser} title="User" />
      <ul className={s.itemList}>
        {SECTIONS.map(item => (
          <li key={item.path} className={s.item} onClick={() => navigate(item.path)}>
            <span className={s.itemIconWrap}><FontAwesomeIcon icon={item.icon} /></span>
            <span className={s.itemText}>
              <span className={s.itemLabel}>{item.label}</span>
              <span className={s.itemDescription}>{item.description}</span>
            </span>
            <FontAwesomeIcon icon={faChevronRight} className={s.itemArrow} />
          </li>
        ))}
      </ul>
    </div>
  );
};
