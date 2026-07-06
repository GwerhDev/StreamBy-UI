import s from './WorkflowSkeleton.module.css';

interface SkeletonNode {
  id: string;
  x: number;
  y: number;
  delay: number;
  wide?: boolean;
}

interface SkeletonEdge {
  from: string;
  to: string;
  delay: number;
}

const NODES: SkeletonNode[] = [
  { id: 'db1',      x:  60, y:  40, delay: 0   },
  { id: 'db2',      x:  60, y: 200, delay: 80  },
  { id: 'api1',     x:  60, y: 360, delay: 160 },
  { id: 'storage1', x:  60, y: 520, delay: 240 },
  { id: 'core',     x: 330, y: 256, delay: 320, wide: true },
  { id: 'export1',  x: 600, y: 180, delay: 400 },
  { id: 'export2',  x: 600, y: 340, delay: 480 },
];

const NODE_W = 148;
const NODE_H = 70;
const WIDE_W = 158;

function cx(node: SkeletonNode) {
  return node.x + (node.wide ? WIDE_W : NODE_W) / 2;
}
function cy(node: SkeletonNode) {
  return node.y + NODE_H / 2;
}

const nodeMap = Object.fromEntries(NODES.map(n => [n.id, n]));

const EDGES: SkeletonEdge[] = [
  { from: 'db1',      to: 'core',    delay: 500 },
  { from: 'db2',      to: 'core',    delay: 560 },
  { from: 'api1',     to: 'core',    delay: 620 },
  { from: 'storage1', to: 'core',    delay: 680 },
  { from: 'core',     to: 'export1', delay: 740 },
  { from: 'core',     to: 'export2', delay: 800 },
];

export function WorkflowSkeleton() {
  const SVG_W = 800;
  const SVG_H = 640;

  return (
    <div className={s.root}>
      <svg className={s.svg} viewBox={`0 0 ${SVG_W} ${SVG_H}`} preserveAspectRatio="xMidYMid meet">
        {EDGES.map(edge => {
          const from = nodeMap[edge.from];
          const to   = nodeMap[edge.to];
          const x1 = cx(from) + (from.wide ? WIDE_W : NODE_W) / 2;
          const x2 = cx(to)   - (to.wide   ? WIDE_W : NODE_W) / 2;
          const y1 = cy(from);
          const y2 = cy(to);
          const mx = (x1 + x2) / 2;
          return (
            <path
              key={`${edge.from}-${edge.to}`}
              className={s.edge}
              style={{ animationDelay: `${edge.delay}ms` }}
              d={`M ${x1} ${y1} C ${mx} ${y1}, ${mx} ${y2}, ${x2} ${y2}`}
              fill="none"
            />
          );
        })}
      </svg>

      {NODES.map(node => (
        <div
          key={node.id}
          className={`${s.node} ${node.wide ? s.nodeWide : ''}`}
          style={{
            left: node.x,
            top: node.y,
            animationDelay: `${node.delay}ms`,
          }}
        >
          <div className={s.nodeIconBar}>
            <div className={s.iconSquare} />
            <div className={s.titleBar} />
          </div>
          <div className={s.nodeBody}>
            <div className={s.subtitleBar} />
          </div>
        </div>
      ))}
    </div>
  );
}
