import s from "./ProfileButton.module.css";
import { useEffect, useRef, useState } from "react";
import { ProfileCanvas } from "../Canvas/ProfileCanvas";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faGear, faHome, faRightFromBracket, faUser } from "@fortawesome/free-solid-svg-icons";
import { ACCOUNT_BASE } from "../../../config/api";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { clearCurrentProject } from "../../../store/currentProjectSlice";

export const ProfileButton = (props: any) => {
  const { userData } = props || {};
  const { profilePic } = userData || {};
  const [showCanvas, setShowCanvas] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const handleProfileButton = () => {
    setShowCanvas((prev) => !prev);
  };

  const handleLogoutModal = () => {
    const logoutModal = document.getElementById("logout-modal") as HTMLDivElement | null;
    if (logoutModal) logoutModal.style.display = "flex";
  };

  const handleGoHome = () => {
    dispatch(clearCurrentProject());
    setShowCanvas(false);
    navigate("/");
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
        {showCanvas && <ProfileCanvas userData={userData} />}
        <div className={s.profileButtonContainer}>
          {showCanvas && (
            <ul className={s.accountActionsContainer}>
              <button title="Home" onClick={handleGoHome}>
                <FontAwesomeIcon icon={faHome} />
              </button>
              <button title="Account" onClick={() => window.location.href = ACCOUNT_BASE}>
                <FontAwesomeIcon icon={faUser} />
              </button>
              <button title="Settings">
                <FontAwesomeIcon icon={faGear} />
              </button>
              <button title="Logout" onClick={handleLogoutModal}>
                <FontAwesomeIcon icon={faRightFromBracket} />
              </button>
            </ul>
          )}
          <span className={s.profileButton} onClick={handleProfileButton}>
            <img src={profilePic} alt="Profile picture" width="100%" />
          </span>
        </div>
      </span>
    </div>
  );
};
