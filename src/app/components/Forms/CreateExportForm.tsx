import s from './CreateExportForm.module.css';
import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../../store';
import { createExport } from '../../../services/exports';
import { ActionButton } from '../Buttons/ActionButton';
import { SecondaryButton } from '../Buttons/SecondaryButton';
import { LabeledInput } from '../Inputs/LabeledInput';
import { Spinner } from '../Spinner';
import { faDiagramProject, faFileLines, faXmark } from '@fortawesome/free-solid-svg-icons';
import { useNavigate, useParams } from 'react-router-dom';
import { CustomForm } from './CustomForm';

export function CreateExportForm() {
  const currentProject = useSelector((state: RootState) => state.currentProject);
  const { id: projectId } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [disabled, setDisabled] = useState(true);

  useEffect(() => { setDisabled(!name || loading); }, [name, loading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await createExport(currentProject?.data?.id, { name, description, allowedOrigin: ['*'] });
      navigate(`/editor/${projectId}/${response.exportId}`);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => navigate('/');
  if (loading) return <Spinner bg isLoading={loading} />;

  return (
    <div className={s.divContainer}>
      <form className={s.form} onSubmit={handleSubmit}>
        <CustomForm
          readOnly={false}
          header={{ icon: faDiagramProject, title: 'New Export', subtitle: 'Fill the form to create a new Export' }}
          fields={[
            {
              icon: faDiagramProject,
              label: "Export's name",
              value: name || '—',
              editComponent: (
                <LabeledInput
                  label="Export's name" type="text" placeholder=""
                  id="name-input" name="name-input" htmlFor="name-input"
                  value={name} onChange={e => setName(e.target.value)}
                />
              ),
            },
            {
              icon: faFileLines,
              label: 'Description (optional)',
              value: description || '—',
              editComponent: (
                <LabeledInput
                  label="Description (optional)" type="text" placeholder=""
                  id="description-input" name="description-input" htmlFor="description-input"
                  value={description} onChange={e => setDescription(e.target.value)}
                />
              ),
            },

          ]}
          actions={
            <>
              <ActionButton disabled={disabled} icon={faDiagramProject} text="Create" type="submit" />
              <SecondaryButton icon={faXmark} onClick={handleCancel} text="Cancel" />
            </>
          }
        />
      </form>
    </div>
  );
}
