import s from "./DeleteProjectForm.module.css"
import { LabeledInput } from '../Inputs/LabeledInput';
import { PrimaryButton } from '../Buttons/PrimaryButton';
import { SecondaryButton } from '../Buttons/SecondaryButton';
import { faTrash, faXmark } from "@fortawesome/free-solid-svg-icons";

export const DeleteProjectForm = (props: any) => {
  const { currentProject, handleDeleteProject, handleCancel, handleInput, disabled, loader } = props || {};

  return (
    <form onSubmit={handleDeleteProject} className={s.container} action="">
      <h2>Delete {currentProject?.name}?</h2>
      <p>Confirm that you want to delete this project </p>
      <LabeledInput type="text" onChange={handleInput} label={`Enter "${currentProject?.name}" to submit`} />

      <div className={s.buttonContainer}>
        <PrimaryButton type="submit" disabled={disabled || loader} icon={faTrash} text='Delete' />
        <SecondaryButton disabled={loader} icon={faXmark} onClick={handleCancel} text='Cancel' />
      </div>
    </form>
  )
}
