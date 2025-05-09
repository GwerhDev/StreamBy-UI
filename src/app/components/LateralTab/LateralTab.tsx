import s from './LateralTab.module.css';
import { ProjectButton } from '../Buttons/ProjectButton';
import { AddProjectButton } from '../Buttons/AddProjectButton';
import { ProfileButton } from '../Buttons/ProfileButton';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { clearCurrentProject } from '../../../store/currentProjectSlice';
import streambyIcon from '../../../assets/streamby-icon.svg';

export const LateralTab = (props: any) => {
  const { projectList, userData } = props || {};
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

  return (
    <div className={s.container}>
      <span className={s.iconContainer}>
        <img onClick={handleGoHome} src={streambyIcon} alt="StreamBy Icon" height={25} />
      </span>
      <ul className={s.projects}>
        {
          projectList?.map((project: any, index: number) => (
            <li key={index}>
              <ProjectButton project={project} />
            </li>
          ))
        }
        <AddProjectButton onClick={handleOnclick} />
      </ul>
      <div className={s.account}>
        <ProfileButton userData={userData} />
      </div>

      <div className={s.versionContainer}>
        <small className={s.version}>{"v" + __APP_VERSION__}</small>
      </div>
    </div>
  );
};
