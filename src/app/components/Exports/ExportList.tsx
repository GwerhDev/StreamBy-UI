import s from "./ExportList.module.css";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { RootState } from "../../../store";
import { exportList } from "../../../interfaces";
import { ExportCard } from "../Cards/ExportCard";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus } from "@fortawesome/free-solid-svg-icons";

export function ExportList() {
  const { data: currentProjectData } = useSelector((state: RootState) => state.currentProject);
  const { exports, id } = currentProjectData || {};
  const navigate = useNavigate();

  const handleCreateExport = () => {
    navigate(`/project/${id}/dashboard/exports/create`);
  };

  return (
    <div className={s.container}>
      <ul>
        {exports?.map((exportItem: exportList) => (
          <li key={exportItem._id} onClick={() => navigate('/project/' + id + "/dashboard/exports/" + exportItem._id)}>
            <ExportCard key={exportItem._id} exports={exportItem} />
          </li>
        ))}
        <li className={s.createProject} onClick={handleCreateExport}>
          <FontAwesomeIcon icon={faPlus} />
          <h4>
            Create a new Export
          </h4>
        </li>
      </ul>
    </div>
  );
}
