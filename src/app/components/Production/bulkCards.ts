import { Member, Team } from '../../../interfaces';
import { NewCard } from '../../../services/production';

// Cards from a table pasted from a spreadsheet (tab separated) or a CSV (comma or semicolon
// separated, a cell in quotes when it holds one): a row each, its columns its name, description,
// people and teams (several in a cell, separated by commas, semicolons or bars). A first row of
// column names says which column is which; without one, they're in that order.

export interface ParsedRow {
  // Its line in what was pasted, from 1.
  line: number;
  name: string;
  description: string;
  people: string[];
  teams: string[];
}

type Column = 'name' | 'description' | 'people' | 'teams';
const ORDER: Column[] = ['name', 'description', 'people', 'teams'];
const HEADERS: Record<string, Column> = {
  name: 'name', nombre: 'name', title: 'name', titulo: 'name',
  description: 'description', descripcion: 'description',
  people: 'people', personas: 'people', assignees: 'people', 'assigned to': 'people', asignados: 'people', person: 'people', persona: 'people',
  teams: 'teams', equipos: 'teams', team: 'teams', equipo: 'teams',
};
const normal = (cell: string) => cell.trim().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

const delimiterOf = (lines: string[]) =>
  (lines.some(l => l.includes('\t')) ? '\t' : lines[0]?.includes(';') && !lines[0]?.includes(',') ? ';' : ',');

// A line's cells: separated by the delimiter, a quoted cell taken as it is ("" a quote).
function cellsOf(line: string, delimiter: string): string[] {
  if (delimiter === '\t') return line.split('\t');
  const cells: string[] = [];
  let cell = '';
  let quoted = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (quoted) {
      if (c === '"' && line[i + 1] === '"') { cell += '"'; i++; } else if (c === '"') quoted = false; else cell += c;
    } else if (c === '"' && !cell.trim()) {
      quoted = true;
    } else if (c === delimiter) {
      cells.push(cell); cell = '';
    } else {
      cell += c;
    }
  }
  cells.push(cell);
  return cells;
}

const listOf = (cell: string | undefined) => (cell ?? '').split(/[,;|]/).map(x => x.trim()).filter(Boolean);

/** The rows of a pasted table or CSV. */
export function parseCards(text: string): ParsedRow[] {
  const lines = text.split(/\r?\n/).map((line, i) => ({ line, n: i + 1 })).filter(({ line }) => line.trim());
  if (!lines.length) return [];
  const delimiter = delimiterOf(lines.map(l => l.line));
  const first = cellsOf(lines[0].line, delimiter).map(normal);
  const hasHeader = first[0] !== undefined && HEADERS[first[0]] !== undefined;
  const columns: (Column | null)[] = hasHeader ? first.map(c => HEADERS[c] ?? null) : ORDER;
  return lines.slice(hasHeader ? 1 : 0).map(({ line, n }) => {
    const cells = cellsOf(line, delimiter);
    const at = (column: Column) => { const i = columns.indexOf(column); return i >= 0 ? cells[i] : undefined; };
    return { line: n, name: (at('name') ?? '').trim(), description: (at('description') ?? '').trim(), people: listOf(at('people')), teams: listOf(at('teams')) };
  });
}

export interface Problem { line: number; message: string }

/** The cards the rows make, their people and teams by name (case aside), and what's wrong with any. */
export function resolveCards(rows: ParsedRow[], members: Member[], teams: Team[]): { cards: NewCard[]; problems: Problem[] } {
  const active = members.filter(m => m.status === 'active');
  const problems: Problem[] = [];
  const cards = rows.map(row => {
    if (!row.name) problems.push({ line: row.line, message: 'It has no name' });
    const assignedTo = row.people.map(name => {
      const member = active.find(m => m.username.toLowerCase() === name.toLowerCase());
      if (!member) problems.push({ line: row.line, message: `${name} isn't a member of the project` });
      return member?.userId;
    }).filter((id): id is string => !!id);
    const teamIds = row.teams.map(name => {
      const team = teams.find(t => t.name.toLowerCase() === name.toLowerCase());
      if (!team) problems.push({ line: row.line, message: `${name} isn't a team of the project` });
      return team?.id;
    }).filter((id): id is string => !!id);
    return {
      name: row.name,
      ...(row.description ? { description: row.description } : {}),
      ...(assignedTo.length ? { assignedTo: [...new Set(assignedTo)] } : {}),
      ...(teamIds.length ? { teamIds: [...new Set(teamIds)] } : {}),
    };
  });
  return { cards, problems };
}
