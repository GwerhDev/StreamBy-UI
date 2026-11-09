import s from './RunnerCreate.module.css';
import { FormEvent, useState } from 'react';
import { useDispatch } from 'react-redux';
import { faArrowLeft, faDesktop, faTag, faXmark } from '@fortawesome/free-solid-svg-icons';
import { AppDispatch } from '../../../store';
import { addApiResponse } from '../../../store/apiResponsesSlice';
import { useFormRoute } from '../../../hooks/useFormRoute';
import { registerWorkerRunner } from '../../../services/workerRunners';
import { API_BASE } from '../../../config/api';
import { SectionHeader } from '../SectionHeader/SectionHeader';
import { CustomForm } from '../Forms/CustomForm';
import { ActionButton } from '../Buttons/ActionButton';
import { SecondaryButton } from '../Buttons/SecondaryButton';
import { LabeledInput } from '../Inputs/LabeledInput';
import { TokenCreated } from '../Tokens/TokenCreated';

const LIST_PATH = '/user/runners';

// Registering one of the user's machines as a runner: its token, shown once.
export const RunnerCreate = () => {
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
      setCreated((await registerWorkerRunner(name.trim())).token);
    } catch (err) {
      dispatch(addApiResponse({ message: err instanceof Error && err.message ? err.message : 'Failed to register the runner.', type: 'error' }));
    } finally {
      setBusy(false);
    }
  };

  if (created) {
    return (
      <div className={s.container}>
        <TokenCreated title="Runner registered" subtitle={name.trim()} token={created} testId="runner-token" onDone={() => done(LIST_PATH)}>
          <ol className={s.next}>
            <li>Start the runner on that machine with this token. It asks for jobs at <code>{`${API_BASE}/streamby/runner/jobs/next`}</code>.</li>
            <li>Share it with the projects (or teams) that may use it: until then, it gets no jobs.</li>
          </ol>
        </TokenCreated>
      </div>
    );
  }

  return (
    <div className={s.container}>
      <form onSubmit={handleSubmit} className={s.form} data-testid="runner-form">
        <CustomForm
          readOnly={false}
          isLoading={busy}
          header={
            <SectionHeader
              icon={inModal ? faDesktop : faArrowLeft}
              title="New runner"
              subtitle="One of your machines, to process assets with it: one runner per machine."
              onIconClick={inModal ? undefined : () => close(LIST_PATH)}
            />
          }
          fields={[{
            icon: faTag,
            label: 'Name',
            value: name || '—',
            editComponent: (
              <LabeledInput
                id="runner-name" htmlFor="runner-name" name="runner-name" type="text" label="Name"
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
