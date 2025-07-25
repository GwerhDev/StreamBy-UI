import s from "./DirectoryList.module.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import { RootState } from "../../../store";
import { IconDefinition } from '@fortawesome/fontawesome-svg-core';

interface DirectoryListItem {
  name: string;
  icon?: IconDefinition;
  path: string;
  description?: string;
}

interface DirectoryListProps {
  list: DirectoryListItem[];
}

export const DirectoryList = (props: DirectoryListProps) => {
  const { list } = props || {};
  const currentProject = useSelector((state: RootState) => state.currentProject);

  return (
    <div className={s.container}>
      <ul className={s.list}>
        {
          list?.map((e: DirectoryListItem, index: number) => (
            <Link key={index} to={`/project/${currentProject.data?.id}/${e.path}`} >
              <li className={s.article} key={e.path}>
                {
                  e.icon && <FontAwesomeIcon size="2xl" icon={e.icon} />
                }
                <h3>
                  {e.name}
                </h3>
                {
                  e.description && <p> {e.description}</p>
                }
              </li>
            </Link>
          ))
        }
      </ul>
    </div >
  )
}