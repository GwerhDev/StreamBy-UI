import s from './LateralTab.module.css';
import { ProjectButton } from '../Buttons/ProjectButton';
import { AddProjectButton } from '../Buttons/AddProjectButton';
import streambyIcon from '../../../assets/streamby-icon.svg';
import { ProfileButton } from '../Buttons/ProfileButton';

export const LateralTab = (props: any) => {
  const { projectList, action, setCreateProject, userData } = props || {};

  function handleOnclick() {
    setCreateProject(true);
  }

  return (
    <div className={s.container}>
      <img src={streambyIcon} alt="StreamBy Icon" height={25} />
      <ul className={s.projects}>
        {
          projectList?.map((project: any, index: number) => (
            <li key={index}>
              <ProjectButton project={project} action={action} />
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
