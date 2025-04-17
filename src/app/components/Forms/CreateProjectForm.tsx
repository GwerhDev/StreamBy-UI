import { useRef, useState, FormEvent } from 'react';
import s from './CreateProjectForm.module.css';
import { ActionButton } from '../Buttons/ActionButton';
import { SecondaryButton } from '../Buttons/SecondaryButton';
import { faDiagramProject, faFileImage, faPlus, faXmark } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { LabeledInput } from '../Inputs/LabeledInput';

export const CreateProjectForm = (props: any) => {
  const { createAction, cancelAction } = props || {};
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleOnSubmit = (e: FormEvent) => {
    e.preventDefault();
    console.log('submit');
    return createAction && createAction();
  };

  const handleCancel = () => {
    return cancelAction && cancelAction();
  };

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <form className={s.container} onSubmit={handleOnSubmit}>
      <h3>New Project</h3>
      <p>Fill the form to create a new project</p>
      <ul>
        <li className={s.imgContainer} onClick={handleImageClick}>
          {
            preview
              ?
              <span className={s.previewImageContainer}>
                <img src={preview} alt="preview" className={s.previewImage} />
              </span>
              :
              <FontAwesomeIcon color="var(--color-dark)" size="4x" icon={faFileImage} />
          }
          <span className={s.plusContainer}><FontAwesomeIcon color="var(--color-lighter)" icon={faPlus} /></span>
        </li>
        <li>
          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            style={{ display: 'none' }}
            onChange={handleFileChange}
          />
        </li>
      </ul>

      <LabeledInput label="Project's name" type='text' placeholder='' id='name-input' htmlFor='name-input' />
      <LabeledInput label="Description (optional)" type='text' placeholder='' id='description-input' htmlFor='description-input' />

      <span className={s.buttonContainer}>
        <ActionButton icon={faDiagramProject} text='Create' type='submit' />
        <SecondaryButton icon={faXmark} onClick={handleCancel} text='Cancel' />
      </span>
    </form>
  );
};
