import s from './LateralMenu.module.css';

export const LateralMenu = (props: any) => {
  const { project } = props || null;

  return (
    <div className={s.container}>
      <h2>{project.name}</h2>
      <div className={s.mainMenu}>
        <h6>MAIN MENU</h6>
        <h4>DASHBOARD</h4>
      </div>
      <ul className={s.menuList}>
        <li>
          Overview
        </li>
      </ul>
      <h4>STORAGE</h4>
      <ul className={s.menuList}>
        <li>
          Image
        </li>
        <li>
          Audio
        </li>
        <li>
          Video
        </li>
        <li>
          3D Models
        </li>
      </ul>
      <h4>SETTINGS</h4>
      <ul className={s.menuList}>
        <li>
          Credentials
        </li>
        <li>
          Permissions
        </li>
      </ul>
    </div>
  )
}
