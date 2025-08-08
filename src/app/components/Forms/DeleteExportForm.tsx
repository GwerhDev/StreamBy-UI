import s from "./DeleteProjectForm.module.css"
import { LabeledInput } from '../Inputs/LabeledInput';
import { PrimaryButton } from '../Buttons/PrimaryButton';
import { SecondaryButton } from '../Buttons/SecondaryButton';
import { faTrash, faXmark } from "@fortawesome/free-solid-svg-icons";
import { DeleteExportFormProps } from '../../../interfaces';

export const DeleteExportForm = (props: DeleteExportFormProps) => {
  const { currentExport, handleDeleteExport, handleCancel, handleInput, disabled, loader, confirmText } = props || {};

  return (
    <form onSubmit={handleDeleteExport} className={s.container} action="">
      <h2>Delete {currentExport?.name}?</h2>
      <p>Confirm that you want to delete this export</p>
      <LabeledInput type="text" onChange={handleInput} label={`Enter "${currentExport?.name}" to submit`} name="confirm-delete" value={confirmText} id="confirm-delete" htmlFor="confirm-delete" placeholder="" />

      <div className={s.buttonContainer}>
        <PrimaryButton type="submit" disabled={disabled || loader} icon={faTrash} text='Delete' />
        <SecondaryButton disabled={loader} icon={faXmark} onClick={handleCancel} text='Cancel' />
      </div>
    </form>
  )
}