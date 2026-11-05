import s from './BulkCardsPreview.module.css';
import { ParsedRow, Problem } from './bulkCards';

interface Props {
  rows: ParsedRow[];
  problems: Problem[];
  // What the project calls a card.
  cardName: string;
}

// The cards a pasted table makes, a row each, and what's wrong with any.
export function BulkCardsPreview({ rows, problems, cardName }: Props) {
  if (!rows.length) return null;
  const wrong = new Set(problems.map(p => p.line));
  return (
    <>
      <div className={s.preview}>
        <table className={s.table} aria-label={`${cardName} to create`}>
          <thead>
            <tr><th>Name</th><th>Description</th><th>People</th><th>Teams</th></tr>
          </thead>
          <tbody>
            {rows.map(row => (
              <tr key={row.line} className={wrong.has(row.line) ? s.wrong : ''}>
                <td>{row.name || '—'}</td>
                <td>{row.description}</td>
                <td>{row.people.join(', ')}</td>
                <td>{row.teams.join(', ')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {problems.length > 0 && (
        <ul className={s.problems} aria-label="Problems">
          {problems.map((p, i) => <li key={i}>Line {p.line}: {p.message}</li>)}
        </ul>
      )}
    </>
  );
}
