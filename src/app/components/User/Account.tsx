import s from "./Account.module.css";
import { ACCOUNT_BASE } from "../../../config/api";
import { ActionButton } from "../Buttons/ActionButton";
import { useSelector } from "react-redux";
import { RootState } from "../../../store";

export const Account = () => {
  const session = useSelector((state: RootState) => state.session);
  const { username, profilePic, role } = session;

  return (
    <div className={s.container}>
      {
        profilePic
          ? <img className={s.profilePic} src={profilePic} alt="Profile picture" />
          : <span className={s.profilePic}>{username?.[0]}</span>
      }
      <h1>{username}</h1>
      <p>{role}</p>
      <ActionButton text={"View my account"} onClick={() => window.location.href = ACCOUNT_BASE} />
    </div>
  )
}
