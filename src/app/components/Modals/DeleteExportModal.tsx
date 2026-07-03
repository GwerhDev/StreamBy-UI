import { useNavigate } from 'react-router-dom';
import { deleteExport } from '../../../services/exports';
import { FormEvent, useState } from 'react';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '../../../store';
import { addApiResponse } from '../../../store/apiResponsesSlice';
import { DeleteExportForm } from '../Forms/DeleteExportForm';
import { CurrentProjectState, Export } from '../../../interfaces';
import { ModalShell } from './ModalShell';

interface DeleteExportModalProps {
  exportId: string | undefined;
  currentProject: CurrentProjectState | undefined;
  currentExport: Export | undefined;
  onClose: () => void;
}

export const DeleteExportModal = (props: DeleteExportModalProps) => {
  const [loader, setLoader] = useState<boolean>(false);
  const [disabled, setDisabled] = useState<boolean>(true);
  const [confirmText, setConfirmText] = useState<string>('');
  const { exportId, currentExport, currentProject, onClose } = props;
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();

  const handleDeleteExport = async (e: FormEvent) => {
    e.preventDefault();
    try {
      setLoader(true);
      const response = await deleteExport(currentProject?.data?.id, exportId);
      dispatch(addApiResponse({ message: response.message || 'Export deleted.', type: 'success' }));
      onClose();
      navigate('/project/' + currentProject?.data?.id + '/exports');
    } catch (error: any) {
      dispatch(addApiResponse({ message: error.message || 'Failed to delete export.', type: 'error' }));
    } finally {
      setLoader(false);
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    setConfirmText(value);
    setDisabled(value !== currentExport?.name);
  };

  return (
    <ModalShell title="Delete Export" onClose={onClose}>
      <DeleteExportForm
        loader={loader}
        disabled={disabled}
        confirmText={confirmText}
        currentExport={currentExport}
        handleInput={handleInput}
        handleCancel={onClose}
        handleDeleteExport={handleDeleteExport}
      />
    </ModalShell>
  );
};
