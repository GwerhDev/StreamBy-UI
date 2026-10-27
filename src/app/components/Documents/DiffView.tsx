import { diffLines } from 'diff';
import s from './DiffView.module.css';

// What changed from one text to another, line by line.
export const DiffView = ({ from, to }: { from: string; to: string }) => {
  const parts = diffLines(from, to);
  if (parts.every(part => !part.added && !part.removed)) return <p className={s.same} data-testid="diff-same">No differences.</p>;
  return (
    <pre className={s.diff} data-testid="diff-view">
      {parts.map((part, i) => (
        <span
          key={i}
          className={part.added ? s.added : part.removed ? s.removed : s.kept}
          data-testid={part.added ? 'diff-added' : part.removed ? 'diff-removed' : undefined}
        >
          {part.value.replace(/\n$/, '').split('\n').map(line => `${part.added ? '+ ' : part.removed ? '- ' : '  '}${line}`).join('\n')}
          {'\n'}
        </span>
      ))}
    </pre>
  );
};
