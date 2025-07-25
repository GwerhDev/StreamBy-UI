import s from './LateralTab.module.css';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { faArchive } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { ProjectButton } from '../Buttons/ProjectButton';
import { ProfileButton } from '../Buttons/ProfileButton';
import { AddProjectButton } from '../Buttons/AddProjectButton';
import { clearCurrentProject } from '../../../store/currentProjectSlice';
import { ProjectList, Session } from '../../../interfaces';
import streambyIcon from '../../../assets/streamby-icon.svg';
import { RootState } from '../../../store';
import { ProjectsState } from '../../../store/projectsSlice';

export const LateralTab = (props: { projectList: ProjectsState, userData: Session }) => {
  const { projectList, userData } = props || {};
  const { loading: projectsLoading } = useSelector((state: RootState) => state.projects);

  const filteredList = projectList.list.filter((project: ProjectList) => !project.archived);

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
          projectsLoading ? (
            Array.from({ length: 1 }).map((_, index) => (
              <li key={index}>
                <ProjectButton project={{ id: '', name: '', dbType: '' }} loading={true} />
              </li>
            ))
          ) : (
            filteredList?.map((project: ProjectList, index: number) => (
              <li key={index}>
                <ProjectButton project={project} loading={false} />
              </li>
            ))
          )
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
