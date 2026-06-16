import { LabeledInput } from '../Inputs/LabeledInput';
import { DeleteProjectFormProps } from '../../../interfaces';

export const DeleteProjectForm = (props: DeleteProjectFormProps) => {
  const { currentProject, handleDeleteProject, handleInput, confirmText } = props || {};

  return (
    <form id="delete-project-form" onSubmit={handleDeleteProject}>
      <p>Confirm that you want to delete this project.</p>
      <LabeledInput
        type="text"
        onChange={handleInput}
        label={`Enter "${currentProject?.data?.name}" to submit`}
        name="confirm-delete"
        value={confirmText}
        id="confirm-delete"
        htmlFor="confirm-delete"
        placeholder=""
      />
    </form>
  );
};
