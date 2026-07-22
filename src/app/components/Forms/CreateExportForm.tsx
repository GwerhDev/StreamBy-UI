import s from './CreateExportForm.module.css';
import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../../../store';
import { addApiResponse } from '../../../store/apiResponsesSlice';
import { setCurrentProject } from '../../../store/currentProjectSlice';
import { createExport } from '../../../services/exports';
import { updateProjectWorkflow } from '../../../services/workflow';
import { fetchBuiltinDatabases } from '../../../services/database';
import { ActionButton } from '../Buttons/ActionButton';
import { SecondaryButton } from '../Buttons/SecondaryButton';
import { LabeledInput } from '../Inputs/LabeledInput';
import { LabeledSelect } from '../Inputs/LabeledSelect';
import { faDiagramProject, faDatabase, faFileLines, faXmark } from '@fortawesome/free-solid-svg-icons';
import { useNavigate, useParams } from 'react-router-dom';
import { CustomForm } from './CustomForm';
import { Icon } from '@fortawesome/fontawesome-svg-core';

export function CreateExportForm() {
  const dispatch = useDispatch<AppDispatch>();
  const currentProject = useSelector((state: RootState) => state.currentProject);
  const { id: projectId } = useParams<{ id: string }>();

  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [disabled, setDisabled] = useState(true);
  const [description, setDescription] = useState('');
  const [storageDbId, setStorageDbId] = useState('');
  const [builtinDbs, setBuiltinDbs] = useState<{ value: string; label: string }[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchBuiltinDatabases().then(dbs => {
      const options = dbs.map(db => ({ value: db.name, label: db.name }));
      setBuiltinDbs(options);
      if (options.length > 0 && !storageDbId) setStorageDbId(options[0].value);
    });
  }, [projectId]);

  useEffect(() => { setDisabled(!name || loading); }, [name, loading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await createExport(currentProject?.data?.id, { name, description, allowedOrigin: ['*'], storageDbId });
      dispatch(addApiResponse({ message: 'Export created successfully.', type: 'success' }));

      const project = currentProject.data;
      if (project) {
        const workflow = project.workflow;
        let updatedWorkflow = workflow;

        if (workflow?.nodeSchema) {
          const existingNodes = (workflow.nodeSchema.nodes ?? []) as any[];
          const existingEdges = (workflow.nodeSchema.edges ?? []) as any[];
          const exportNodes = existingNodes.filter((n: any) => String(n.id).startsWith('export-'));
          const streambyNode = existingNodes.find((n: any) => n.id === 'streamby');
          const newNodeId = `export-${response.exportId}`;
          const newNode = {
            id: newNodeId,
            type: 'exportNode',
            position: {
              x: (streambyNode?.position?.x ?? 350) + exportNodes.length * 220,
              y: (streambyNode?.position?.y ?? 20) + 220,
            },
            data: { label: name, subtitle: 'export', exportId: response.exportId },
          };
          const newEdge = {
            id: `e-streamby-${newNodeId}`,
            source: 'streamby', sourceHandle: 'out-bottom',
            target: newNodeId, targetHandle: 'in-orchestrator-bottom',
            animated: true, style: { stroke: '#38b6ff', strokeWidth: 1.5 },
          };
          const updatedSchema = {
            nodes: [...existingNodes, newNode],
            edges: [...existingEdges, newEdge],
          };
          try {
            updatedWorkflow = await updateProjectWorkflow(projectId!, { nodeSchema: updatedSchema });
          } catch {
            // Workflow update is best-effort — don't block navigation
          }
        }

        dispatch(setCurrentProject({ ...project, workflow: updatedWorkflow }));
      }

      navigate(`/project/${projectId}/workflow/exports/${response.exportId}/editor`);
    } catch (error: any) {
      dispatch(addApiResponse({ message: error.message || 'Failed to create export.', type: 'error' }));
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = (e: React.FormEvent) => {
    e.preventDefault();
    navigate(`/project/${projectId}/workflow/exports`);
  };

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
            {
              icon: faDatabase,
              label: 'Storage database',
              value: storageDbId || '—',
              editComponent: (
                <LabeledSelect
                  label="Storage database" id="storage-db" name="storage-db" htmlFor="storage-db"
                  value={storageDbId}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setStorageDbId(e.target.value)}
                  options={builtinDbs}
                />
              ),
            },
          ]}
          actions={
            <>
              <ActionButton disabled={disabled} icon={faDiagramProject} text="Create" type="submit" />
              <SecondaryButton icon={faXmark as Icon} onClick={handleCancel} type="button" text="Cancel" />
            </>
          }
        />
      </form>
    </div>
  );
}
