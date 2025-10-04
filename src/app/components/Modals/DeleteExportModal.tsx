import s from './DeleteExportModal.module.css';
import { useNavigate } from 'react-router-dom';
import { deleteExport } from '../../../services/exports';
import { FormEvent, useState } from 'react';
import { DeleteExportForm } from '../Forms/DeleteExportForm';
import { CurrentProjectState, ExportDetails } from '../../../interfaces';

interface DeleteExportModalProps {
  exportId: string | undefined;
  currentProject: CurrentProjectState | undefined;
  currentExport: ExportDetails | undefined;
  onClose: () => void;
}

export const DeleteExportModal = (props: DeleteExportModalProps) => {
  const [loader, setLoader] = useState<boolean>(false);
  const [disabled, setDisabled] = useState<boolean>(true);
  const [confirmText, setConfirmText] = useState<string>("");
  const { exportId, currentExport, currentProject, onClose } = props || {};
  const navigate = useNavigate();

  const handleDeleteExport = async (e: FormEvent) => {
    e.preventDefault();
    try {
      setLoader(true);
      await deleteExport(currentProject?.data?.id, exportId);
      setLoader(false);
      onClose();
      navigate('/project/' + currentProject?.data?.id + '/dashboard/exports');
    } catch (error) {
      setLoader(false);
      console.error('Error deleting project:', error);
    }
  };

  const handleCancel = () => {
    onClose();
  };

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    setConfirmText(value);
    if (value === currentExport?.name) {
      setDisabled(false);
    } else {
      setDisabled(true);
    }
  };

  return (
    <div className={s.container}>
      <DeleteExportForm
        loader={loader}
        disabled={disabled}
        confirmText={confirmText}
        currentExport={currentExport}
        handleInput={handleInput}
        handleCancel={handleCancel}
        handleDeleteExport={handleDeleteExport}
      />
    </div>
  );
};