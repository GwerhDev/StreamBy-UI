import { useNavigate } from 'react-router-dom';
import { LoginForm } from '../components/Forms/LoginForm';
import { useEffect } from 'react';

export default function LoginPage(props: any) {
  const { logged } = props || {};
  const navigate = useNavigate();

  useEffect(() => {
    if (logged) {
      navigate('/');
    }
  }, [logged, navigate]);

  return (
    <div className='d-flex h-full justify-content-center align-items-center flex-dir-col'>
      <LoginForm />
    </div>
  )
}
