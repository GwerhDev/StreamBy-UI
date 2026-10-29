import s from './ApiTokenCreate.module.css';
import { FormEvent, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faArrowLeft, faCalendar, faCheck, faFolder, faKey, faShieldHalved, faTag, faTriangleExclamation, faXmark,
} from '@fortawesome/free-solid-svg-icons';
import { AppDispatch, RootState } from '../../../store';
import { addApiResponse } from '../../../store/apiResponsesSlice';
import { useProjects } from '../../../hooks/useProjects';
import { useFormRoute } from '../../../hooks/useFormRoute';
import { createApiToken } from '../../../services/apiTokens';
import { ApiTokenKind, ApiTokenPermission } from '../../../interfaces';
import { SectionHeader } from '../SectionHeader/SectionHeader';
import { CustomForm } from '../Forms/CustomForm';
import { ActionButton } from '../Buttons/ActionButton';
import { SecondaryButton } from '../Buttons/SecondaryButton';
import CopyButton from '../Buttons/CopyButton';
import { LabeledInput } from '../Inputs/LabeledInput';
import { LabeledSelect } from '../Inputs/LabeledSelect';
import { CustomCheckbox } from '../Inputs/CustomCheckbox';
import { PermissionPicker } from './PermissionPicker';
import { LEVEL_LABEL, levelOf, levelPermissions, listOf, RISKY_ACTIONS, RISKY_PERMISSIONS } from './permissions';
import { apiTokensPath } from './paths';

const EXPIRY_OPTIONS = [
  { value: '7', label: '7 days' },
  { value: '30', label: '30 days' },
  { value: '90', label: '90 days' },
  { value: '365', label: '1 year' },
  { value: 'never', label: 'No expiration' },
];

interface ApiTokenCreateProps {
  // A project's token; without it, the user's own.
  projectId?: string;
}

export const ApiTokenCreate = ({ projectId }: ApiTokenCreateProps) => {
  const { inModal, close, done } = useFormRoute();
  const dispatch = useDispatch<AppDispatch>();
  const { projectList } = useProjects();
  const projects = projectList.list;
  const currentProject = useSelector((state: RootState) => state.currentProject.data);
  const kind: ApiTokenKind = projectId ? 'project' : 'user';
  const listPath = apiTokensPath(projectId);
  const projectName = currentProject?.name ?? projects.find(p => p.id === projectId)?.name ?? 'this project';

  const [name, setName] = useState('');
  const [permissions, setPermissions] = useState<ApiTokenPermission[]>(levelPermissions('read', kind));
  const [allProjects, setAllProjects] = useState(false);
  const [chosen, setChosen] = useState<string[]>([]);
  const [expiry, setExpiry] = useState('30');
  const [busy, setBusy] = useState(false);
  const [created, setCreated] = useState<string | null>(null);

  const createsProjects = permissions.includes('projects:create');
  const reachesProjects = kind === 'project' || allProjects || chosen.length > 0 || createsProjects;
  const canCreate = name.trim() !== '' && permissions.length > 0 && reachesProjects && !busy;
  const risky = permissions.filter(p => RISKY_PERMISSIONS.includes(p));

  const toggleProject = (id: string, on: boolean) =>
    setChosen(list => (on ? [...new Set([...list, id])] : list.filter(p => p !== id)));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!canCreate) return;
    setBusy(true);
    try {
      const { token } = await createApiToken({
        name: name.trim(),
        permissions,
        ...(kind === 'user' && { projectIds: allProjects ? '*' : chosen }),
        expiresInDays: expiry === 'never' ? null : Number(expiry),
      }, projectId);
      setCreated(token);
    } catch (err) {
      dispatch(addApiResponse({ message: err instanceof Error && err.message ? err.message : 'Failed to create API token.', type: 'error' }));
    } finally {
      setBusy(false);
    }
  };

  if (created) {
    return (
      <div className={s.container}>
        <div className={s.created} data-testid="api-token-created">
          <CustomForm
            header={<SectionHeader icon={faKey} title="Token created" subtitle={name.trim()} />}
            fields={[]}
            actions={<ActionButton icon={faCheck} text="Done" onClick={() => done(listPath)} />}
          >
            <div className={s.createdBody}>
              <p className={s.warning}>
                <FontAwesomeIcon icon={faTriangleExclamation} />
                Copy your token now. It won't be shown again.
              </p>
              <div className={s.tokenRow}>
                <code className={s.token} data-testid="api-token-value">{created}</code>
                <CopyButton title="Copy token" textToCopy={created} copiedMessage="Token copied to clipboard." />
              </div>
            </div>
          </CustomForm>
        </div>
      </div>
    );
  }

  const warnings = [
    ...(kind === 'project' ? [
      `This token belongs to ${projectName}, not to you: it keeps working if you leave the project.`,
      `Anyone who has it can act on ${projectName} with its permissions.`,
    ] : []),
    ...(risky.length ? [`It can ${listOf(risky.map(p => RISKY_ACTIONS[p]!))}. Deleting can't be undone.`] : []),
    ...(expiry === 'never' ? ['A token without expiration works until it is revoked.'] : []),
  ];

  return (
    <div className={s.container}>
      <form onSubmit={handleSubmit} className={s.form} data-testid="api-token-form">
        <CustomForm
          readOnly={false}
          isLoading={busy}
          header={
            <SectionHeader
              icon={inModal ? faKey : faArrowLeft}
              title={kind === 'project' ? 'New project token' : 'New API token'}
              subtitle={kind === 'project'
                ? `A token of ${projectName}, for integrations that work on it: CI, services, agents.`
                : 'Lets an agent or a service work with StreamBy as you.'}
              badge={LEVEL_LABEL[levelOf(permissions, kind)]}
              onIconClick={inModal ? undefined : () => close(listPath)}
            />
          }
          fields={[
            {
              icon: faTag,
              label: 'Name',
              value: name || '—',
              editComponent: (
                <LabeledInput
                  id="api-token-name" htmlFor="api-token-name" name="api-token-name" type="text"
                  label="Name" placeholder={kind === 'project' ? 'e.g. CI deploys' : 'e.g. Claude Code on my laptop'}
                  value={name} onChange={e => setName(e.target.value)} disabled={busy}
                />
              ),
            },
            {
              icon: faFolder,
              label: 'Projects',
              value: '',
              hidden: kind === 'project',
              editComponent: (
                <fieldset className={s.projects}>
                  <legend>Projects</legend>
                  <CustomCheckbox
                    id="api-token-all-projects" name="api-token-all-projects" checked={allProjects}
                    label="All my projects, including ones I join later" disabled={busy}
                    onChange={e => setAllProjects(e.target.checked)}
                  />
                  {!allProjects && (
                    <div className={s.projectList}>
                      {projects.length === 0 && <p className={s.hint}>You have no projects yet.</p>}
                      {projects.map(p => (
                        <CustomCheckbox
                          key={p.id} id={`api-token-project-${p.id}`} name="api-token-project" value={p.id}
                          checked={chosen.includes(p.id)} label={p.name} disabled={busy}
                          onChange={e => toggleProject(p.id, e.target.checked)}
                        />
                      ))}
                    </div>
                  )}
                  {createsProjects && !allProjects && (
                    <p className={s.hint}>It also reaches the projects it creates.</p>
                  )}
                </fieldset>
              ),
            },
            {
              icon: faShieldHalved,
              label: 'Permissions',
              value: '',
              editComponent: <PermissionPicker kind={kind} value={permissions} onChange={setPermissions} disabled={busy} />,
            },
            {
              icon: faCalendar,
              label: 'Expiration',
              value: '',
              editComponent: (
                <LabeledSelect
                  id="api-token-expiry" htmlFor="api-token-expiry" label="Expiration" value={expiry}
                  options={EXPIRY_OPTIONS} onChange={e => setExpiry(e.target.value)} disabled={busy}
                />
              ),
            },
            {
              icon: faTriangleExclamation,
              label: 'Before you create it',
              value: '',
              hidden: warnings.length === 0,
              editComponent: (
                <ul className={s.warnings} data-testid="api-token-warnings">
                  {warnings.map(w => <li key={w}>{w}</li>)}
                </ul>
              ),
            },
          ]}
          actions={
            <>
              <ActionButton type="submit" icon={faKey} text="Create token" disabled={!canCreate} />
              <SecondaryButton icon={faXmark} text="Cancel" disabled={busy} onClick={() => close(listPath)} />
            </>
          }
        />
      </form>
    </div>
  );
};
