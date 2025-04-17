import { useEffect, useRef, useState } from "react";
import s from "./ProfileButton.module.css";
import { ProfileCanvas } from "../Canvas/ProfileCanvas";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faGear, faRightFromBracket, faUser } from "@fortawesome/free-solid-svg-icons";
import { ACCOUNT_BASE } from "../../../config/api";

export const ProfileButton = (props: any) => {
  const { userData } = props || {};
  const { profilePic } = userData || {};
  const [showCanvas, setShowCanvas] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleProfileButton = () => {
    setShowCanvas((prev) => !prev);
  };

  const handleLogoutModal = () => {
    const logoutModal = document.getElementById("logout-modal") as HTMLDivElement | null;
    if (logoutModal) logoutModal.style.display = "flex";
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
      <span className={s.canvas}>
        <div>
          {showCanvas && <ProfileCanvas userData={userData} />}
          <div className={s.profileButtonContainer}>
            {showCanvas && (
              <ul className={s.accountActionsContainer}>
                <button onClick={() => window.location.href = ACCOUNT_BASE}>
                  <FontAwesomeIcon size="xs" icon={faUser} />
                </button>
                <button>
                  <FontAwesomeIcon size="xs" icon={faGear} />
                </button>
                <button onClick={handleLogoutModal}>
                  <FontAwesomeIcon size="xs" icon={faRightFromBracket} />
                </button>
              </ul>
            )}
            <span className={s.profileButton} onClick={handleProfileButton}>
              <img src={profilePic} alt="Profile picture" width="100%" />
            </span>
          </div>
        </div>
      </span>
    </div>
  );
};
