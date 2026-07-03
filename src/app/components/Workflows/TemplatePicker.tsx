import s from './TemplatePicker.module.css';
import { Node, Edge } from 'reactflow';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faPlug } from '@fortawesome/free-solid-svg-icons';
import { BLANK_SCHEMA, WORKFLOW_TEMPLATES } from '../NodeViewer/workflowTemplates';

interface Props {
  onSelect: (schema: { nodes: Node[]; edges: Edge[] }) => void;
}

export const TemplatePicker = ({ onSelect }: Props) => (
  <div className={s.container}>
    <h3 className={s.title}>How would you like to start?</h3>
    <div className={s.grid}>
      <button className={s.card} onClick={() => onSelect(BLANK_SCHEMA)}>
        <span className={s.cardIcon}><FontAwesomeIcon icon={faPlus} /></span>
        <span className={s.cardLabel}>Blank</span>
        <span className={s.cardDesc}>Start with an empty canvas</span>
      </button>
      {WORKFLOW_TEMPLATES.map(t => (
        <button key={t.id} className={s.card} onClick={() => onSelect(t.schema)}>
          <span className={s.cardIcon}><FontAwesomeIcon icon={faPlug} /></span>
          <span className={s.cardLabel}>{t.label}</span>
          <span className={s.cardDesc}>{t.description}</span>
        </button>
      ))}
    </div>
  </div>
);
