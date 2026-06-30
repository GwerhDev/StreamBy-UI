import s from "./ExportList.module.css";
import skeleton from '../Loader/Skeleton.module.css';
import { useState } from 'react';
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { RootState, AppDispatch } from "../../../store";
import { Export } from "../../../interfaces";
import { ExportCard } from "../Cards/ExportCard";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus, faFileExport, faCode } from "@fortawesome/free-solid-svg-icons";
import { ActionButton } from "../Buttons/ActionButton";
import { SectionHeader } from "../SectionHeader/SectionHeader";
import { EmptyBackground } from "../Backgrounds/EmptyBackground";
import { DevModeModal } from "./DevModeModal";
import { updateProjectOrigins } from "../../../services/projects";
import { setCurrentProject } from "../../../store/currentProjectSlice";
import { addApiResponse } from "../../../store/apiResponsesSlice";

const LOCALHOST_RE = /^https?:\/\/localhost:(\d+)$/;

function extractLocalhostPorts(origins: string[] = []): number[] {
  return origins
    .map(o => { const m = o.match(LOCALHOST_RE); return m ? parseInt(m[1], 10) : null; })
    .filter((n): n is number => n !== null);
}

export function ExportList() {
  const dispatch = useDispatch<AppDispatch>();
  const { data: currentProjectData, loading: currentProjectLoading } = useSelector((state: RootState) => state.currentProject);
  const { exports, id, allowedOrigin } = currentProjectData || {};
  const navigate = useNavigate();

  const devModeActive = (allowedOrigin ?? []).some(o => LOCALHOST_RE.test(o));
  const activePorts = extractLocalhostPorts(allowedOrigin);

  const [showDevModal, setShowDevModal] = useState(false);
  const [devLoading, setDevLoading] = useState(false);

  const handleCreateExport = () => {
    navigate(`/project/${id}/dashboard/exports/create`);
  };

  const applyDevMode = async (active: boolean, ports: number[]) => {
    if (!id) return;
    setDevLoading(true);
    try {
      const baseOrigins = (allowedOrigin ?? []).filter(o => !LOCALHOST_RE.test(o));
      const localhostOrigins = active ? ports.map(p => `http://localhost:${p}`) : [];
      const newOrigins = [...baseOrigins, ...localhostOrigins];
      const updatedProject = await updateProjectOrigins(id, newOrigins);
      dispatch(addApiResponse({ message: active ? 'Dev Mode activated.' : 'Dev Mode deactivated.', type: 'success' }));
      dispatch(setCurrentProject({ ...currentProjectData!, allowedOrigin: updatedProject?.allowedOrigin ?? newOrigins }));
    } catch (error: any) {
      dispatch(addApiResponse({ message: error.message || 'Failed to update dev mode.', type: 'error' }));
    } finally {
      setShowDevModal(false);
      setDevLoading(false);
    }
  };

  const handleDevToggle = () => {
    if (devModeActive) {
      applyDevMode(false, []);
    } else {
      setShowDevModal(true);
    }
  };

  const devToggleButton = exports?.length ? (
    <button
      className={`${s.devToggle} ${devModeActive ? s.devToggleActive : ''}`}
      onClick={handleDevToggle}
      disabled={devLoading}
      title={devModeActive ? 'Deactivate Dev Mode' : 'Activate Dev Mode'}
    >
      <FontAwesomeIcon icon={faCode} />
      {devModeActive ? 'Dev Mode ON' : 'Dev Mode'}
    </button>
  ) : undefined;

  return (
    <div className={s.container}>
      <SectionHeader
        icon={faFileExport}
        title="Exports"
        subtitle="Get started by creating a new export"
        action={currentProjectLoading ? undefined : (
          !exports?.length
            ? <ActionButton icon={faPlus} text='Create export' onClick={handleCreateExport} />
            : devToggleButton
        )}
      />
      {currentProjectLoading ? (
        <ul>
          {Array.from({ length: 3 }).map((_, index) => (
            <li key={index} className={`${s.projectCardSkeleton} ${skeleton.skeleton}`}></li>
          ))}
        </ul>
      ) : !exports?.length ? (
        <div className={s.emptyState}>
          <EmptyBackground />
        </div>
      ) : (
        <ul>
          {exports?.map((exportItem: Export) => (
            <li title={exportItem.name} key={exportItem.id} onClick={() => navigate('/project/' + id + "/dashboard/exports/" + exportItem.id)}>
              <ExportCard key={exportItem.id} exports={exportItem} />
            </li>
          ))}
          <li className={s.createProject} onClick={handleCreateExport}>
            <FontAwesomeIcon icon={faPlus} />
            <h4>
              Create a new Export
            </h4>
          </li>
        </ul>
      )}

      {showDevModal && (
        <DevModeModal
          initialPorts={activePorts}
          onConfirm={ports => applyDevMode(true, ports)}
          onClose={() => setShowDevModal(false)}
        />
      )}
    </div>
  );
}
