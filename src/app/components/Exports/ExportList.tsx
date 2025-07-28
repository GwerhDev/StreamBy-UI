import s from "./ExportList.module.css";
import skeleton from '../Loader/Skeleton.module.css';
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { RootState } from "../../../store";
import { exportList } from "../../../interfaces";
import { ExportCard } from "../Cards/ExportCard";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus } from "@fortawesome/free-solid-svg-icons";
import { ActionButton } from "../Buttons/ActionButton";

export function ExportList() {
  const { data: currentProjectData, loading: currentProjectLoading } = useSelector((state: RootState) => state.currentProject);
  const { exports, id } = currentProjectData || {};
  const navigate = useNavigate();

  const handleCreateExport = () => {
    navigate(`/project/${id}/dashboard/exports/create`);
  };

  return (
    <div className={s.container}>
      <div className={s.header}>
        <h2>Export fire with fire</h2>
        <p>Get started by creating a new export</p>
      </div>
      {currentProjectLoading ? (
        <ul>
          {Array.from({ length: 3 }).map((_, index) => (
            <li key={index} className={`${s.projectCardSkeleton} ${skeleton.skeleton}`}></li>
          ))}
        </ul>
      ) : !exports?.length ? (
        <ActionButton icon={faPlus} text='Create export' onClick={handleCreateExport} />
      ) : (
        <ul>
          {exports?.map((exportItem: exportList) => (
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
    </div>
  );
}
