import s from './BoardSkeleton.module.css';
import skeleton from '../Loader/Skeleton.module.css';

// The board as it loads: its header, its filters, and a few columns and lanes with cards.
const COLUMNS = 4;
const LANES = [[2, 1, 0, 1], [1, 0, 1, 0]];

export function BoardSkeleton() {
  return (
    <div className={s.skeleton} data-testid="board-skeleton" aria-busy="true" aria-label="Loading the board">
      <div className={s.header}>
        <span className={`${s.icon} ${skeleton.skeleton}`} />
        <div className={s.titles}>
          <span className={`${s.title} ${skeleton.skeleton}`} />
          <span className={`${s.subtitle} ${skeleton.skeleton}`} />
        </div>
      </div>
      <div className={s.filters}>
        <span className={`${s.search} ${skeleton.skeleton}`} />
        <span className={`${s.filter} ${skeleton.skeleton}`} />
        <span className={`${s.filter} ${skeleton.skeleton}`} />
      </div>
      <div className={s.board}>
        <div className={s.row}>
          {Array.from({ length: COLUMNS }, (_, i) => <span key={i} className={`${s.head} ${skeleton.skeleton}`} />)}
        </div>
        {LANES.map((cards, lane) => (
          <div key={lane} className={s.lane}>
            <span className={`${s.laneName} ${skeleton.skeleton}`} />
            <div className={s.row}>
              {cards.map((count, column) => (
                <div key={column} className={s.cell}>
                  {Array.from({ length: count }, (_, i) => <span key={i} className={`${s.card} ${skeleton.skeleton}`} />)}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
