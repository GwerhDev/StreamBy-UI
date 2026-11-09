import s from './RunnerConnectSteps.module.css';
import { API_BASE } from '../../../config/api';

interface RunnerConnectStepsProps {
  // The runner's token, when it's just been registered; otherwise a placeholder for it.
  token?: string;
}

const ComingSoon = () => <span className={s.soon} data-testid="runner-connect-soon">Coming soon</span>;

// How a runner will connect: with StreamBy Runner, which isn't out yet (only the steps are shown).
export const RunnerConnectSteps = ({ token }: RunnerConnectStepsProps) => (
  <ol className={s.steps} data-testid="runner-connect-steps">
    <li>
      <span className={s.stepTitle}>Install StreamBy Runner on that machine <ComingSoon /></span>
      <span className={s.hint}>The program that connects a machine to StreamBy. It isn't published yet: this is how it will work.</span>
    </li>
    <li>
      <span className={s.stepTitle}>Start it with this runner's token</span>
      <code className={s.command} data-testid="runner-connect-command">
        {`npx streamby-runner --token ${token ?? 'sbr_…'} --url ${API_BASE}/streamby`}
      </code>
      <span className={s.hint}>
        It asks StreamBy for jobs (at <code>/runner/jobs/next</code>), saying what the machine can do, and shows online here.
      </span>
    </li>
    <li>
      <span className={s.stepTitle}>Share it with the projects (or teams) that may use it</span>
      <span className={s.hint}>Until then it gets no jobs. Each project's admins choose what it runs by itself on deliverables.</span>
    </li>
  </ol>
);
