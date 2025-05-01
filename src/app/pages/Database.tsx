import { databaseDirectoryList } from "../../config/consts"
import { DirectoryList } from "../components/Dashboard/DirectoryList"

export const Database = () => {
  return (
    <div>
      <DirectoryList list={databaseDirectoryList} />
    </div>
  )
}
