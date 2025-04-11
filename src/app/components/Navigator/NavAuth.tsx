import s from './NavAuth.module.css';
import { useNavigate } from 'react-router-dom';
import { ActionButton } from '../Buttons/ActionButton';
import { PrimaryButton } from '../Buttons/PrimaryButton';

export const NavAuth = () => {
  const navigate = useNavigate();

  function redirection(route: string) {
    navigate(route);
  }

  return (
    <span className={s.container}>
      <ActionButton text="Get started" onClick={() => redirection("/signup")} />
      <PrimaryButton text="Sign in" onClick={() => redirection("/login")} />
    </span>
  )
}
