import { describe, expect, it } from 'vitest';
import { parseCards, resolveCards } from './bulkCards';

const MEMBERS = [
  { userId: 'u1', username: 'ada', role: 'admin', status: 'active' as const },
  { userId: 'u2', username: 'Eli', role: 'editor', status: 'active' as const },
  { userId: 'u3', username: 'pat', role: 'editor', status: 'pending' as const },
];
const TEAMS = [{ id: 'tm1', name: 'Artists', members: [], createdAt: '', updatedAt: '' }];

describe('a pasted table', () => {
  it('from a spreadsheet: tab separated, its first row naming the columns (in any order, in Spanish too)', () => {
    const rows = parseCards('Nombre\tEquipos\tDescripción\tPersonas\nAventurero\tArtists\tThe hero\tada, eli\n\nLobo\t\t\t\n');
    expect(rows).toEqual([
      { line: 2, name: 'Aventurero', description: 'The hero', people: ['ada', 'eli'], teams: ['Artists'] },
      { line: 4, name: 'Lobo', description: '', people: [], teams: [] },
    ]);
  });

  it('a CSV: a cell in quotes holds commas and quotes; without a header, name, description, people, teams', () => {
    expect(parseCards('Hero,"Brave, and ""bold""","ada;eli",Artists')).toEqual([
      { line: 1, name: 'Hero', description: 'Brave, and "bold"', people: ['ada', 'eli'], teams: ['Artists'] },
    ]);
    expect(parseCards('Hero;The hero;ada')).toEqual([{ line: 1, name: 'Hero', description: 'The hero', people: ['ada'], teams: [] }]);
    expect(parseCards('  \n')).toEqual([]);
  });

  it('makes a card of each row, its people and teams by name (case aside), and says what is wrong', () => {
    const rows = parseCards('Hero\t\tADA, eli\tartists\n\tNo name\nVillain\t\tpat, zoe\tSound');
    const { cards, problems } = resolveCards(rows, MEMBERS, TEAMS);
    expect(cards[0]).toEqual({ name: 'Hero', assignedTo: ['u1', 'u2'], teamIds: ['tm1'] });
    expect(cards[1]).toEqual({ name: '', description: 'No name' });
    expect(problems).toEqual([
      { line: 2, message: 'It has no name' },
      // A pending invitation isn't a member yet.
      { line: 3, message: "pat isn't a member of the project" },
      { line: 3, message: "zoe isn't a member of the project" },
      { line: 3, message: "Sound isn't a team of the project" },
    ]);
  });
});
