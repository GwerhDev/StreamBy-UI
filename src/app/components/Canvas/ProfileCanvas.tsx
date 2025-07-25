import s from './ProfileCanvas.module.css';
import { Session } from '../../../interfaces';

interface ProfileCanvasProps {
  userData: Session;
}

export const ProfileCanvas = (props: ProfileCanvasProps) => {
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