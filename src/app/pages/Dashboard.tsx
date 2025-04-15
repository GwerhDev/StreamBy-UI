"use client"

import { useState } from "react";
import { Browser } from "../components/Browser/Browser";
import { LateralTab } from "../components/LateralTab/LateralTab";
import { LogoutModal } from "../components/Modals/LogoutModal";
import { LateralMenu } from "../components/LateralMenu/LateralMenu";
import { EmptyBrowser } from "../components/Browser/EmptyBrowser";

export default function DashboardPage(props: any) {
  const { profilePic } = props || {};
  const projectList: any[] = [];
  const [createProject, setCreateProject] = useState(false);
  const [currentProject, setCurrentProject] = useState(null);

  function handleCurrentProject(project: any) {
    setCurrentProject(project);
  }

  return (
    <div className='dashboard-container'>
      <LateralTab profilePic={profilePic} projectList={projectList} action={handleCurrentProject} setCreateProject={setCreateProject} />
      {
        currentProject
          ?
          <div className="dashboard-sections">
            <LateralMenu project={currentProject} />
            <Browser />
          </div>
          :
          <div className="dashboard-sections">
            <EmptyBrowser createProject={createProject} setCreateProject={setCreateProject} />
          </div>
      }
      <LogoutModal />
    </div >
  )
}
