import { useState } from 'react';
import { ActionButton } from '../Buttons/ActionButton';
import s from './EmptyBrowser.module.css';
import { CreateProjectForm } from '../Forms/CreateProjectForm';
import { faPlus } from '@fortawesome/free-solid-svg-icons';

export const EmptyBrowser = (props: any) => {
  const { createProject, setCreateProject } = props || null;

  function handleOnClick() {
    setCreateProject(true);
  }

  function handleCancel() {
    setCreateProject(false);
  }

  return (
    <div className={s.container}>
      {
        createProject
          ?
          <CreateProjectForm cancelAction={handleCancel} />
          :
          <>
            <h1>Born to Dev</h1>
            <p>Get started by creating a new project</p>
            <ActionButton icon={faPlus} text='Create project' onClick={handleOnClick} />
          </>
      }
    </div>
  )
}
