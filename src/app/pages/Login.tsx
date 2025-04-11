import { LoginForm } from '../components/Forms/LoginForm';
import { Navigator } from '../components/Navigator/Navigator';
import { LoggedRedirection } from '../components/Utils/LoggedRedirection';

export default function LoginPage() {
  return (
    <div className='d-flex h-full justify-content-center align-items-center flex-dir-col'>
      <Navigator />
      <LoginForm />
      <LoggedRedirection />
    </div>
  )
}
