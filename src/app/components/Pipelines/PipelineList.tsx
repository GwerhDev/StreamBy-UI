import s from "./PipelineList.module.css";
import skeleton from '../Loader/Skeleton.module.css';
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { RootState } from "../../../store";
import { PipelineRef } from "../../../interfaces";
import { PipelineCard } from "../Cards/PipelineCard";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus, faDiagramProject } from "@fortawesome/free-solid-svg-icons";
import { ActionButton } from "../Buttons/ActionButton";
import { SectionHeader } from "../SectionHeader/SectionHeader";
import { EmptyBackground } from "../Backgrounds/EmptyBackground";

export function PipelineList() {
  const { data: currentProjectData, loading: currentProjectLoading } = useSelector((state: RootState) => state.currentProject);
  const { pipelines, id } = currentProjectData || {};
  const navigate = useNavigate();

  const handleCreatePipeline = () => {
    navigate(`/project/${id}/workflow/pipelines/create`);
  };

  return (
    <div className={s.container}>
      <SectionHeader
        icon={faDiagramProject}
        title="Pipelines"
        subtitle="Get started by creating a new pipeline"
        action={currentProjectLoading || pipelines?.length ? undefined : (
          <ActionButton icon={faPlus} text='Create pipeline' onClick={handleCreatePipeline} />
        )}
      />
      {currentProjectLoading ? (
        <ul>
          {Array.from({ length: 3 }).map((_, index) => (
            <li key={index} className={`${s.pipelineCardSkeleton} ${skeleton.skeleton}`}></li>
          ))}
        </ul>
      ) : !pipelines?.length ? (
        <div className={s.emptyState}>
          <EmptyBackground />
        </div>
      ) : (
        <ul>
          {pipelines?.map((pipeline: PipelineRef) => (
            <li title={pipeline.name} key={pipeline.id} onClick={() => navigate(`/project/${id}/workflow/pipelines/${pipeline.id}`)}>
              <PipelineCard pipeline={pipeline} />
            </li>
          ))}
          <li className={s.createPipeline} onClick={handleCreatePipeline}>
            <FontAwesomeIcon icon={faPlus} />
            <h4>
              Create a new Pipeline
            </h4>
          </li>
        </ul>
      )}
    </div>
  );
}
