import s from './PipelineRuns.module.css';
import { PipelineTrigger } from '../../../interfaces';
import { TRIGGER_OPTIONS } from './pipelineSteps';
import { CustomCheckbox } from '../Inputs/CustomCheckbox';

interface Props {
  triggers: PipelineTrigger[];
  disabled?: boolean;
  onToggle: (trigger: PipelineTrigger, on: boolean) => void;
}

// What starts a card's run of a pipeline by itself (a run can always be started by hand).
export function PipelineTriggers({ triggers, disabled, onToggle }: Props) {
  return (
    <fieldset className={s.triggers} disabled={disabled}>
      <legend className={s.legend}>Start a card's run when</legend>
      {TRIGGER_OPTIONS.map(t => (
        <CustomCheckbox
          key={t.value} id={`trigger-${t.value}`} name="pipeline-trigger" value={t.value} label={t.label}
          checked={triggers.includes(t.value)} onChange={e => onToggle(t.value, e.target.checked)}
        />
      ))}
      <p className={s.hint}>With none, runs start only by hand, from a card.</p>
    </fieldset>
  );
}
