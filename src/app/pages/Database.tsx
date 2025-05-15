import { databaseDirectoryList } from "../../config/consts"
import { DirectoryList } from "../components/Dashboard/DirectoryList"

export const Database = () => {
  return (
    <DirectoryList list={databaseDirectoryList} />
  )
}
