import { settingsDirectoryList } from "../../config/consts"
import { DirectoryList } from "../components/Dashboard/DirectoryList"

export const Settings = () => {
  return (
    <DirectoryList list={settingsDirectoryList} />
  )
}
