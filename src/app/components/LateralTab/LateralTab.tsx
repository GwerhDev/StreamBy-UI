import s from './LateralTab.module.css';
import { ProjectButton } from '../Buttons/ProjectButton';
import { AddProjectButton } from '../Buttons/AddProjectButton';
import streambyIcon from '../../../assets/streamby-icon.svg';
import { ProfileButton } from '../Buttons/ProfileButton';
import { useNavigate } from 'react-router-dom';

export const LateralTab = (props: any) => {
  const { projectList, userData } = props || {};
  const navigate = useNavigate();

  const  handleOnclick = () => {
    navigate('/project/create');
  };

  return (
    <div className={s.container}>
      <img src={streambyIcon} alt="StreamBy Icon" height={25} />
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
