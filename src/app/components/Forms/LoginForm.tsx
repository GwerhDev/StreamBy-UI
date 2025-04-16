import s from './LoginForm.module.css';
import { useNavigate } from 'react-router-dom';
import { FormEvent, useState } from 'react';
import { ActionButton } from '../Buttons/ActionButton';
import { Loader } from '../Loader';
import { faUser, faUserPlus } from '@fortawesome/free-solid-svg-icons';
import { CLIENT_BASE, CLIENT_NAME, REDIRECT_LOGIN, REDIRECT_SIGNUP } from '../../../config/api';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

export const LoginForm = () => {
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showLoader, setShowLoader] = useState(false);

  function handleEmail(e: any) {
    setEmail(e.target.value);
    setError('');
  }

  function handlePassword(e: any) {
    setPassword(e.target.value);
    setError('');
  }

  async function handleSubmit(e: FormEvent) {
    try {
      e.preventDefault();

      if (!email || !password) return setError('Please, fill all the fields');

      const formData = { email, password };
      setShowLoader(true);

      const response = await fetch('/api/controllers/login-inner', {
        method: 'POST',
        body: JSON.stringify(formData),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const userToken = await response.json();

      if (!userToken?.error) {
        navigate(`/dashboard`);
        return;
      }
      setShowLoader(false);

      return setError(userToken?.error);

    } catch (error) {
      console.error(error);
    }
  }

  return (
    <div>
      {
        showLoader ?
          <Loader />
          :
          <form onSubmit={handleSubmit}>
            <h1>User is not authenticated</h1>
            <p>Please, log in to access {CLIENT_NAME} to continue</p>
            {/*             <ul className={s.container}>
              <li className={s.inputContainer}>
                <label htmlFor="">Email</label>
                <input onInput={handleEmail} type="email" placeholder='example@mail.com' />
              </li>
              <li className={s.inputContainer}>
                <label htmlFor="">Password</label>
                <input onInput={handlePassword} type="password" placeholder='********' />
              </li>
            </ul> */}
            <ActionButton onClick={() => window.location.href = REDIRECT_LOGIN + "?callback=" + encodeURIComponent(CLIENT_BASE)} icon={faUser} text={'Log in with ' + CLIENT_NAME} type='submit' />
            <span><small>{error}</small></span>

            <p>Don't have an account? <a href={REDIRECT_SIGNUP + "?callback=" + encodeURIComponent(CLIENT_BASE)}><FontAwesomeIcon icon={faUserPlus} /> Register</a></p>
          </form>
      }
    </div>
  )
}
