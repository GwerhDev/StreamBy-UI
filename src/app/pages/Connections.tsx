import { connectionsDirectoryList } from "../../config/consts";
import { DirectoryList } from "../components/Dashboard/DirectoryList";

export const Connections = () => {
  return <DirectoryList list={connectionsDirectoryList} />;
};
