import s from './LoginForm.module.css';
import { useNavigate } from 'react-router-dom';
import { FormEvent, useState } from 'react';
import { ActionButton } from '../Buttons/ActionButton';
import Loader from '../Loader';

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
            <h1>Log in</h1>
            <ul className={s.container}>
              <li className={s.inputContainer}>
                <label htmlFor="">Email</label>
                <input onInput={handleEmail} type="email" placeholder='example@mail.com' />
              </li>
              <li className={s.inputContainer}>
                <label htmlFor="">Password</label>
                <input onInput={handlePassword} type="password" placeholder='********' />
              </li>
            </ul>
            <ActionButton text='Log in' type='submit' />
            <span><small>{error}</small></span>
          </form>
      }
    </div>
  )
}
