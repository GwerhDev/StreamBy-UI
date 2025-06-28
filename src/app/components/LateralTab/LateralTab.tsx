import s from './LateralTab.module.css';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { faArchive } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { ProjectButton } from '../Buttons/ProjectButton';
import { ProfileButton } from '../Buttons/ProfileButton';
import { AddProjectButton } from '../Buttons/AddProjectButton';
import { clearCurrentProject } from '../../../store/currentProjectSlice';
import { ProjectList, Session } from '../../../interfaces';
import streambyIcon from '../../../assets/streamby-icon.svg';

export const LateralTab = (props: { projectList: ProjectList[], userData: Session }) => {
  const { projectList, userData } = props || {};

  const filteredList = projectList.filter((project: ProjectList) => !project.archived);

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleOnclick = () => {
    dispatch(clearCurrentProject());
    navigate('/project/create');
  };

  const handleGoHome = () => {
    dispatch(clearCurrentProject());
    navigate("/");
  };

  const handleGoArchive = () => {
    dispatch(clearCurrentProject());
    navigate("/user/archive");
  };

  return (
    <div className={s.container}>
      <span className={s.iconContainer}>
        <img onClick={handleGoHome} src={streambyIcon} alt="StreamBy Icon" height={25} />
      </span>
      <ul className={s.projects}>
        {
          filteredList?.map((project: ProjectList, index: number) => (
            <li key={index}>
              <ProjectButton project={project} />
            </li>
          ))
        }
        <AddProjectButton onClick={handleOnclick} />
      </ul>

      <ul className={s.user}>
        <li className={s.archive} onClick={handleGoArchive}>
          <FontAwesomeIcon icon={faArchive} />
        </li>

        <li>
          <ProfileButton userData={userData} />
        </li>

        <li>
          <div className={s.versionContainer}>
            <small className={s.version}>{"v" + __APP_VERSION__}</small>
          </div>
        </li>
      </ul>
    </div>
  );
};
