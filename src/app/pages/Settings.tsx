import { settingsDirectoryList } from "../../config/consts"
import { DirectoryList } from "../components/Dashboard/DirectoryList"

export const Settings = () => {
  return (
    <div>
      <DirectoryList list={settingsDirectoryList} />
    </div>
  )
}
