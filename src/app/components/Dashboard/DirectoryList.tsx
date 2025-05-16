import s from "./DirectoryList.module.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import { RootState } from "../../../store";

export const DirectoryList = (props: any) => {
  const { list } = props || {};
  const currentProject = useSelector((state: RootState) => state.currentProject);

  return (
    <div className={s.container}>
      <ul className={s.list}>
        {
          list?.map((e: any, index: number) => (
            <Link key={index} to={`/project/${currentProject.id}/${e.path}`} >
              <li className={s.article} key={e}>
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