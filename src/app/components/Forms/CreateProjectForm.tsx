import s from './CreateProjectForm.module.css';
import { ActionButton } from '../Buttons/ActionButton';
import { SecondaryButton } from '../Buttons/SecondaryButton';
import { FormEvent } from 'react';
import { faDiagramProject, faXmark } from '@fortawesome/free-solid-svg-icons';

export const CreateProjectForm = (props: any) => {
  const { createAction, cancelAction } = props || null;

  const handleOnSubmit = (e: FormEvent) => {
    e.preventDefault();
    console.log('submit');
    return createAction && createAction();
  };

  const handleCancel = () => {
    return cancelAction && cancelAction();
  };

  return (
    <form className={s.container} onSubmit={handleOnSubmit}>
      <h1>New Project</h1>
      <span>
        <input type="file" />
      </span>

      <span>
        <label htmlFor="name-input">Project's name</label>
        <input type="text" />
      </span>

      <span>
        <label htmlFor="name-input">Description (optional)</label>
        <input type="text" />
      </span>

      <span className={s.buttonContainer}>
        <ActionButton icon={faDiagramProject  } text='Create' type='submit' />
        <SecondaryButton icon={faXmark} onClick={handleCancel} text='Cancel' />
      </span>
    </form>
  )
}
