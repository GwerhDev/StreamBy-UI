import s from "./ProfileButton.module.css";
import { useEffect, useRef, useState } from "react";
import { ProfileCanvas } from "../Canvas/ProfileCanvas";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArchive, faGear, faPlug, faUser } from "@fortawesome/free-solid-svg-icons";
import { useNavigate } from "react-router-dom";
import { Session } from "../../../interfaces";

interface ProfileButtonProps {
  userData: Session;
  onGoArchive?: () => void;
};

export const ProfileButton = (props: ProfileButtonProps) => {
  const { userData, onGoArchive } = props;
  const { profilePic, username } = userData;
  const [showCanvas, setShowCanvas] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const handleProfileButton = () => {
    setShowCanvas((prev) => !prev);
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowCanvas(false);
      }
    };

    if (showCanvas) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showCanvas]);

  return (
    <div className={s.container} ref={containerRef}>
      <span className={`${s.canvas}${showCanvas ? ` ${s.canvasOpen}` : ''}`}>
        {showCanvas && <ProfileCanvas userData={userData} />}
        <div className={s.profileButtonContainer}>
          {showCanvas && (
            <ul className={s.accountActionsContainer}>
              <button title="Profile" onClick={() => { setShowCanvas(false); navigate('/user/profile'); }}>
                <FontAwesomeIcon icon={faUser} />
              </button>
              <button title="Archive" onClick={() => { onGoArchive?.(); setShowCanvas(false); }}>
                <FontAwesomeIcon icon={faArchive} />
              </button>
              <button title="Integrations" onClick={() => { setShowCanvas(false); navigate('/user/integrations'); }}>
                <FontAwesomeIcon icon={faPlug} />
              </button>
              <button title="Settings" onClick={() => { setShowCanvas(false); navigate('/user/settings'); }}>
                <FontAwesomeIcon icon={faGear} />
              </button>
            </ul>
          )}
          <span className={s.profileButton} onClick={handleProfileButton}>
            {
              profilePic
                ? <img src={profilePic} alt="Profile picture" width="100%" />
                : <span>{username[0]}</span>
            }
          </span>
        </div>
      </span>
    </div>
  );
};
