import s from './DeleteExportModal.module.css';
import { useNavigate } from 'react-router-dom';
import { deleteExport } from '../../../services/exports';
import { useProjects } from '../../../hooks/useProjects';
import { FormEvent, useState } from 'react';
import { DeleteExportForm } from '../Forms/DeleteExportForm';
import { ExportDetails, Project } from '../../../interfaces';

interface DeleteExportModalProps {
  currentProject: Project | null;
  currentExport: ExportDetails | null;
  onClose: () => void;
}

export const DeleteExportModal = (props: DeleteExportModalProps) => {
  const [loader, setLoader] = useState<boolean>(false);
  const [disabled, setDisabled] = useState<boolean>(true);
  const [confirmText, setConfirmText] = useState<string>("");
  const { currentExport, currentProject, onClose } = props || {};
  const { loadProjects } = useProjects();
  const navigate = useNavigate();

  const handleDeleteExport = async (e: FormEvent) => {
    e.preventDefault();
    try {
      setLoader(true);
      const response = await deleteExport(currentProject?.id, currentExport?.id);
      loadProjects(response.projects);
      setLoader(false);
      onClose();
      navigate('/project/' + currentProject?.id + '/dashboard/exports');
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
        currentProject={currentProject}
        currentExport={currentExport}
        handleDeleteExport={handleDeleteExport}
        handleCancel={handleCancel}
        handleInput={handleInput}
        disabled={disabled}
        loader={loader}
        confirmText={confirmText}
      />
    </div>
  );
};