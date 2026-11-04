import { ProductionLabels } from '../../../interfaces';

// What a project calls its sequences and shots until its admins name them.
export const DEFAULT_LABELS: ProductionLabels = { sequence: 'Sequence', sequences: 'Sequences', shot: 'Shot', shots: 'Shots' };

/** A name as it's read mid-sentence ("New sequence", "Delete shot"). */
export const lower = (name: string) => name.toLowerCase();

/** A name with its article ("a shot", "an asset"). */
export const withArticle = (name: string) => `${/^[aeiou]/i.test(name) ? 'an' : 'a'} ${name}`;
