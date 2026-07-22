import { useNavigate } from 'react-router-dom';
import { deletePipeline } from '../../../services/pipelines';
import { FormEvent, useState } from 'react';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '../../../store';
import { addApiResponse } from '../../../store/apiResponsesSlice';
import { setCurrentProject } from '../../../store/currentProjectSlice';
import { DeletePipelineForm } from '../Forms/DeletePipelineForm';
import { CurrentProjectState, Pipeline } from '../../../interfaces';
import { ModalShell } from './ModalShell';

interface DeletePipelineModalProps {
  pipelineId: string | undefined;
  currentProject: CurrentProjectState | undefined;
  currentPipeline: Pipeline | undefined;
  onClose: () => void;
}

export const DeletePipelineModal = (props: DeletePipelineModalProps) => {
  const [loader, setLoader] = useState<boolean>(false);
  const [disabled, setDisabled] = useState<boolean>(true);
  const [confirmText, setConfirmText] = useState<string>('');
  const { pipelineId, currentPipeline, currentProject, onClose } = props;
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();

  const handleDeletePipeline = async (e: FormEvent) => {
    e.preventDefault();
    const projectId = currentProject?.data?.id;
    if (!projectId || !pipelineId) return;
    try {
      setLoader(true);
      await deletePipeline(projectId, pipelineId);
      dispatch(addApiResponse({ message: 'Pipeline deleted.', type: 'success' }));
      const project = currentProject?.data;
      if (project) {
        dispatch(setCurrentProject({
          ...project,
          pipelines: (project.pipelines ?? []).filter(p => p.id !== pipelineId),
        }));
      }
      onClose();
      navigate('/project/' + projectId + '/workflow/pipelines');
    } catch (error: any) {
      dispatch(addApiResponse({ message: error.message || 'Failed to delete pipeline.', type: 'error' }));
    } finally {
      setLoader(false);
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    setConfirmText(value);
    setDisabled(value !== currentPipeline?.name);
  };

  return (
    <ModalShell title="Delete Pipeline" onClose={onClose}>
      <DeletePipelineForm
        loader={loader}
        disabled={disabled}
        confirmText={confirmText}
        currentPipeline={currentPipeline}
        handleInput={handleInput}
        handleCancel={onClose}
        handleDeletePipeline={handleDeletePipeline}
      />
    </ModalShell>
  );
};
