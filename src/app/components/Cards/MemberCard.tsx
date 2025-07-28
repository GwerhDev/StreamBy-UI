import s from './MemberCard.module.css';
import { faUser } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Member } from '../../../interfaces';

export const MemberCard = (props: { member: Member }) => {
  const { member } = props || {};

  return (
    <>
      <span className={s.box}>
        <span className={s.memberImageContainer}>
          <span>{member.username[0]}</span>
        </span>
        <h4 className={s.title}>
          {member.username}
        </h4>
        <span className={s.memberRole}>
          {member.role}
        </span>
      </span>
      <FontAwesomeIcon icon={faUser} />
    </>
  )
}
