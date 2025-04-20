import s from './EmptyBrowser.module.css';
import { ActionButton } from '../Buttons/ActionButton';
import { faPlus } from '@fortawesome/free-solid-svg-icons';
import { useNavigate } from 'react-router-dom';

export const EmptyBrowser = () => {
  const navigate = useNavigate();

  const handleOnClick = () => {
    navigate('/project/create');
  };

  return (
    <div className={s.container}>
      <div className={s.createContainer}>
        <h1>Born to Dev</h1>
        <p>Get started by creating a new project</p>
        <ActionButton icon={faPlus} text='Create project' onClick={handleOnClick} />
      </div>
    </div>
  )
}
