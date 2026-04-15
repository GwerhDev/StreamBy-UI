import { apiDirectoryList } from "../../config/consts";
import { DirectoryList } from "../components/Dashboard/DirectoryList";

export const Api = () => {
  return <DirectoryList list={apiDirectoryList} />;
};
