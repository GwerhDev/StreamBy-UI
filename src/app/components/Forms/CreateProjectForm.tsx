import { ActionButton } from '../Buttons/ActionButton';
import { SecondaryButton } from '../Buttons/SecondaryButton';
import s from './CreateProjectForm.module.css';

export const CreateProjectForm = (props: any) => {
  const { createAction, cancelAction } = props || null;

  function handleOnSubmit(e: any) {
    e.preventDefault();
    console.log('submit');
  };

  function handleCancel() {
    cancelAction();
  }

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
        <ActionButton text='Create' type='submit' />
        <SecondaryButton onClick={handleCancel} text='Cancel' />
      </span>
    </form>
  )
}
