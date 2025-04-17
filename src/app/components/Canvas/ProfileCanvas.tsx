import s from './ProfileCanvas.module.css';

export const ProfileCanvas = (props: any) => {
  const { userData } = props || {};
  const { username, role } = userData || {};

  return (
    <ul className={s.container}>
      <li>
        <h4>
          {username}
        </h4>
      </li>
      <li>
        <small>{role}</small>
      </li>
    </ul>
  )
}
