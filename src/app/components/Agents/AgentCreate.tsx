import s from './AgentCreate.module.css';
import { FormEvent, useState } from 'react';
import { useDispatch } from 'react-redux';
import { faArrowLeft, faDesktop, faTag, faXmark } from '@fortawesome/free-solid-svg-icons';
import { AppDispatch } from '../../../store';
import { addApiResponse } from '../../../store/apiResponsesSlice';
import { useFormRoute } from '../../../hooks/useFormRoute';
import { registerWorkerAgent } from '../../../services/workerAgents';
import { API_BASE } from '../../../config/api';
import { SectionHeader } from '../SectionHeader/SectionHeader';
import { CustomForm } from '../Forms/CustomForm';
import { ActionButton } from '../Buttons/ActionButton';
import { SecondaryButton } from '../Buttons/SecondaryButton';
import { LabeledInput } from '../Inputs/LabeledInput';
import { TokenCreated } from '../Tokens/TokenCreated';

const LIST_PATH = '/user/agents';

// Registering one of the user's machines as an agent: its token, shown once.
export const AgentCreate = () => {
  const { inModal, close, done } = useFormRoute();
  const dispatch = useDispatch<AppDispatch>();
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [created, setCreated] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim() || busy) return;
    setBusy(true);
    try {
      setCreated((await registerWorkerAgent(name.trim())).token);
    } catch (err) {
      dispatch(addApiResponse({ message: err instanceof Error && err.message ? err.message : 'Failed to register the agent.', type: 'error' }));
    } finally {
      setBusy(false);
    }
  };

  if (created) {
    return (
      <div className={s.container}>
        <TokenCreated title="Agent registered" subtitle={name.trim()} token={created} testId="agent-token" onDone={() => done(LIST_PATH)}>
          <ol className={s.next}>
            <li>Start the agent on that machine with this token. It asks for jobs at <code>{`${API_BASE}/streamby/worker-agent/jobs/next`}</code>.</li>
            <li>Share it with the projects (or teams) that may use it: until then, it gets no jobs.</li>
          </ol>
        </TokenCreated>
      </div>
    );
  }

  return (
    <div className={s.container}>
      <form onSubmit={handleSubmit} className={s.form} data-testid="agent-form">
        <CustomForm
          readOnly={false}
          isLoading={busy}
          header={
            <SectionHeader
              icon={inModal ? faDesktop : faArrowLeft}
              title="New agent"
              subtitle="One of your machines, to process assets with it: one agent per machine."
              onIconClick={inModal ? undefined : () => close(LIST_PATH)}
            />
          }
          fields={[{
            icon: faTag,
            label: 'Name',
            value: name || '—',
            editComponent: (
              <LabeledInput
                id="agent-name" htmlFor="agent-name" name="agent-name" type="text" label="Name"
                placeholder="e.g. Studio workstation" value={name} onChange={e => setName(e.target.value)} disabled={busy}
              />
            ),
          }]}
          actions={
            <>
              <ActionButton type="submit" icon={faDesktop} text="Register" disabled={!name.trim() || busy} />
              <SecondaryButton icon={faXmark} text="Cancel" disabled={busy} onClick={() => close(LIST_PATH)} />
            </>
          }
        />
      </form>
    </div>
  );
};
