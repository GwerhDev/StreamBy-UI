import s from './LateralTab.module.css';
import { ProjectButton } from '../Buttons/ProjectButton';
import { AddProjectButton } from '../Buttons/AddProjectButton';
import streambyIcon from '../../../assets/streamby-icon.svg';
import logoutIcon from '../../../assets/logout-icon.svg';

export const LateralTab = (props: any) => {
  const { projectList, action, setCreateProject, profilePic } = props || null;

  function handleOnclick() {
    setCreateProject(true);
  }

  const handleLogoutModal = () => {
    const logoutModal = document.getElementById('logout-modal') as HTMLDivElement | null;
    if (logoutModal) {
      logoutModal.style.display = 'flex';
    }
  };

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
      <span className={s.logout} onClick={handleLogoutModal}>
        <img src={profilePic || logoutIcon} alt="Profile picture" width={40} />
      </span>
    </div>
  );
};
