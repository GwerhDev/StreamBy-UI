import { ProjectPresentation } from "../components/ProjectPresentation/ProjectPresentation"
import { useProjectRefresh } from "../../hooks/useProjectInit"

export const Overview = () => {
  useProjectRefresh();
  return (
    <ProjectPresentation />
  )
}
