import s from './TokenCreated.module.css';
import { ReactNode } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck, faKey, faTriangleExclamation } from '@fortawesome/free-solid-svg-icons';
import { SectionHeader } from '../SectionHeader/SectionHeader';
import { CustomForm } from '../Forms/CustomForm';
import { ActionButton } from '../Buttons/ActionButton';
import CopyButton from '../Buttons/CopyButton';

interface TokenCreatedProps {
  title: string;
  subtitle: string;
  token: string;
  // Prefix of its test ids: `<testId>-created`, `<testId>-value`.
  testId: string;
  onDone: () => void;
  // What to do with it, under the token.
  children?: ReactNode;
}

// A token just made: shown this once, to be copied.
export const TokenCreated = ({ title, subtitle, token, testId, onDone, children }: TokenCreatedProps) => (
  <div className={s.created} data-testid={`${testId}-created`}>
    <CustomForm
      header={<SectionHeader icon={faKey} title={title} subtitle={subtitle} />}
      fields={[]}
      actions={<ActionButton icon={faCheck} text="Done" onClick={onDone} />}
    >
      <div className={s.body}>
        <p className={s.warning}>
          <FontAwesomeIcon icon={faTriangleExclamation} />
          Copy your token now. It won't be shown again.
        </p>
        <div className={s.tokenRow}>
          <code className={s.token} data-testid={`${testId}-value`}>{token}</code>
          <CopyButton title="Copy token" textToCopy={token} copiedMessage="Token copied to clipboard." />
        </div>
        {children}
      </div>
    </CustomForm>
  </div>
);
