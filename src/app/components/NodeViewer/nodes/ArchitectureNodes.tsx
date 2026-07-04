import { memo, useCallback } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFileExport, faSitemap, faXmark } from '@fortawesome/free-solid-svg-icons';
import { useNavigate, useParams } from 'react-router-dom';
import ns from '../NodeViewer.module.css';
import s from './ArchitectureNodes.module.css';

export interface ArchNodeData {
  entityId: string;
  label: string;
  subtitle: string;
  onDelete?: (entityType: 'export' | 'pipeline', entityId: string, nodeId: string) => void;
}

export const ExportRefNode = memo(({ id, data, selected }: NodeProps<ArchNodeData>) => {
  const navigate = useNavigate();
  const { id: projectId } = useParams<{ id: string }>();

  const handleDelete = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    data.onDelete?.('export', data.entityId, id);
  }, [data, id]);

  return (
    <div
      className={`${ns.customNode} ${selected ? ns.nodeSelected : ''}`}
      onClick={() => navigate(`/project/${projectId}/exports/${data.entityId}`)}
    >
      <Handle type="target" position={Position.Left} id="in-left" className={ns.handle} />
      <div className={ns.nodeIconBar} style={{ backgroundColor: '#231c06' }}>
        <div className={ns.nodeIcon} style={{ color: '#fbbf24' }}>
          <FontAwesomeIcon icon={faFileExport} />
        </div>
        {data.onDelete && (
          <button className={s.deleteBtn} onClick={handleDelete} title="Delete export">
            <FontAwesomeIcon icon={faXmark} />
          </button>
        )}
      </div>
      <div className={ns.nodeBody}>
        <div className={ns.nodeLabel}>{data.label}</div>
        <div className={ns.nodeSubtitle}>{data.subtitle}</div>
      </div>
      <Handle type="source" position={Position.Right} id="out-right" className={ns.handle} />
    </div>
  );
});
ExportRefNode.displayName = 'ExportRefNode';

export const PipelineRefNode = memo(({ id, data, selected }: NodeProps<ArchNodeData>) => {
  const navigate = useNavigate();
  const { id: projectId } = useParams<{ id: string }>();

  const handleDelete = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    data.onDelete?.('pipeline', data.entityId, id);
  }, [data, id]);

  return (
    <div
      className={`${ns.customNode} ${selected ? ns.nodeSelected : ''}`}
      onClick={() => navigate(`/project/${projectId}/workflow`)}
    >
      <Handle type="target" position={Position.Left} id="in-left" className={ns.handle} />
      <div className={ns.nodeIconBar} style={{ backgroundColor: '#16103a' }}>
        <div className={ns.nodeIcon} style={{ color: '#a78bfa' }}>
          <FontAwesomeIcon icon={faSitemap} />
        </div>
        {data.onDelete && (
          <button className={s.deleteBtn} onClick={handleDelete} title="Delete pipeline">
            <FontAwesomeIcon icon={faXmark} />
          </button>
        )}
      </div>
      <div className={ns.nodeBody}>
        <div className={ns.nodeLabel}>{data.label}</div>
        <div className={ns.nodeSubtitle}>{data.subtitle}</div>
      </div>
      <Handle type="source" position={Position.Right} id="out-right" className={ns.handle} />
    </div>
  );
});
PipelineRefNode.displayName = 'PipelineRefNode';
