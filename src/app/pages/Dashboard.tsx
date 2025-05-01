import { dashboardDirectoryList } from "../../config/consts"
import { DirectoryList } from "../components/Dashboard/DirectoryList"

export const Dashboard = () => {
  return (
    <div>
      <DirectoryList list={dashboardDirectoryList} />
    </div>
  )
}
