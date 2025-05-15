import { storageDirectoryList } from "../../config/consts"
import { DirectoryList } from "../components/Dashboard/DirectoryList"

export const Storage = () => {
  return (
    <DirectoryList list={storageDirectoryList} />
  )
}