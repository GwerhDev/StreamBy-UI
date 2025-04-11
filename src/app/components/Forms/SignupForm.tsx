"use client"

import { FormEvent, useState } from 'react';
import s from './SignupForm.module.css';
import Loading from '@/app/loading';

export const SignupForm = () => {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showLoader, setShowLoader] = useState(false);

  function handleEmail(e: any) {
    setEmail(e.target.value);
  }

  function handleUsername(e: any) {
    setUsername(e.target.value);
  }

  function handlePassword(e: any) {
    setPassword(e.target.value);
  }

  async function handleSubmit(e: FormEvent) {
    try {
      e.preventDefault();
      const formData = { username, email, password };
      setShowLoader(true);

      const response = await fetch('/api/controllers/signup-inner', {
        method: 'POST',
        body: JSON.stringify(formData),
        headers: {
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      setShowLoader(false);

    } catch (error) {
      console.error(error);
    }
  }

  return (
    <div>
      {
        showLoader ?
          <Loading />
          :
          <form onSubmit={handleSubmit}>
            <h1>Sign up</h1>
            <ul className={s.container}>
              <li className={s.inputContainer}>
                <label htmlFor="">Username</label>
                <input onInput={handleUsername} type="text" placeholder='alias' />
              </li>
              <li className={s.inputContainer}>
                <label htmlFor="">Email</label>
                <input onInput={handleEmail} type="email" placeholder='example@mail.com' />
              </li>
              <li className={s.inputContainer}>
                <label htmlFor="">Password</label>
                <input onInput={handlePassword} type="password" placeholder='********' />
              </li>
            </ul>
            <button>Sign up</button>
          </form>
      }
    </div>
  )
}
