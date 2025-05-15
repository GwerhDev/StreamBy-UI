import s from "./Account.module.css";
import { ACCOUNT_BASE } from "../../../config/api";
import { ActionButton } from "../Buttons/ActionButton";
import { useSelector } from "react-redux";
import { RootState } from "../../../store";

export const Account = () => {
  const session = useSelector((state: RootState) => state.session);

  return (
    <div className={s.container}>
      <img className={s.profilePic} src={session.profilePic} alt="Profile picture" />
      <h1>{session.username}</h1>
      <p>{session.role}</p>
      <ActionButton text={"View my account"} onClick={() => window.location.href = ACCOUNT_BASE} />
    </div>
  )
}
