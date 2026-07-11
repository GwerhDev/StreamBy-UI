import { authenticationDirectoryList } from "../../config/consts"
import { DirectoryList } from "../components/Dashboard/DirectoryList"

export const Authentication = () => {
  return (
    <DirectoryList list={authenticationDirectoryList} />
  )
}
