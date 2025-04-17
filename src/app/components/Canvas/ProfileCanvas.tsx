import s from './ProfileCanvas.module.css';

export const ProfileCanvas = (props: any) => {
  const { userData } = props || {};
  const { username, role } = userData || {};

  return (
    <ul className={s.container}>
      <li>
        <h3>
          {username}
        </h3>
      </li>
      <li>
        <small>{role}</small>
      </li>
    </ul>
  )
}
