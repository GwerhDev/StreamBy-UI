import s from "./DeleteProjectForm.module.css"
import { LabeledInput } from '../Inputs/LabeledInput';
import { PrimaryButton } from '../Buttons/PrimaryButton';
import { SecondaryButton } from '../Buttons/SecondaryButton';
import { faTrash, faXmark } from "@fortawesome/free-solid-svg-icons";
import { DeleteCredentialFormProps } from '../../../interfaces';

export const DeleteCredentialForm = (props: DeleteCredentialFormProps) => {
  const { currentCredential, handleDeleteCredential, handleCancel, handleInput, disabled, loader, confirmText } = props || {};

  return (
    <form onSubmit={handleDeleteCredential} className={s.container} action="">
      <h2>Delete {currentCredential?.key}?</h2>
      <p>Confirm that you want to delete this credential</p>
      <LabeledInput type="text" onChange={handleInput} label={`Enter "${currentCredential?.key}" to submit`} name="confirm-delete" value={confirmText} id="confirm-delete" htmlFor="confirm-delete" placeholder="" />

      <div className={s.buttonContainer}>
        <PrimaryButton type="submit" disabled={disabled || loader} icon={faTrash} text='Delete' />
        <SecondaryButton disabled={loader} icon={faXmark} onClick={handleCancel} text='Cancel' />
      </div>
    </form>
  )
}
