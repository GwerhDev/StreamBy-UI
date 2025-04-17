import s from './LoginForm.module.css';
import { ActionButton } from '../Buttons/ActionButton';
import { faUser, faUserPlus } from '@fortawesome/free-solid-svg-icons';
import { CLIENT_BASE, CLIENT_NAME, REDIRECT_LOGIN, REDIRECT_SIGNUP } from '../../../config/api';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

export const LoginForm = () => {

  return (
    <div className={s.container}>
      <h2>Unauthorized</h2>
      <p>You are not authenticated. Please, login with {CLIENT_NAME} to continue</p>
      <ActionButton onClick={() => window.location.href = REDIRECT_LOGIN + "?callback=" + encodeURIComponent(CLIENT_BASE)} icon={faUser} text={'Log in with ' + CLIENT_NAME} type='submit' />
      <p>Don't have an account? <a href={REDIRECT_SIGNUP + "?callback=" + encodeURIComponent(CLIENT_BASE)}><FontAwesomeIcon icon={faUserPlus} /> Register</a></p>
    </div>
  )
}
