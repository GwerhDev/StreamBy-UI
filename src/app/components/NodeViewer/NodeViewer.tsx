import React, { useState } from 'react';
import ReactFlow, { Background, Controls, Edge, Node } from 'reactflow';
import 'reactflow/dist/style.css';
import s from './NodeViewer.module.css';
import { Export } from '../../../interfaces';
import { InfoModal } from '../Modals/InfoModal';

interface NodeViewerProps {
  exportDetails: Export;
}

const getNodeLabel = (type: string) => {
  switch (type) {
    case 'json':
      return 'Collection';
    case 'externalApi':
      return 'External API';
    default:
      return 'Data Source';
  }
}

export const NodeViewer: React.FC<NodeViewerProps> = ({ exportDetails }) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalContent, setModalContent] = useState<React.ReactNode>('');

  const getNodeInfo = (nodeId: string) => {
    switch (nodeId) {
      case 'client':
        return {
          title: 'Client',
          content: 'Represents any client (e.g., a web browser, a mobile app, or a server) that makes a request to the StreamBy endpoint.'
        };
      case 'streamby':
        return {
          title: 'StreamBy Middleware',
          content: 'This is the core of StreamBy. It receives the request, processes it, fetches data from the configured data source, and sends it back to the client. It handles authentication, data transformation, and caching.'
        };
      case 'datasource':
        return {
          title: `Data Source: ${getNodeLabel(exportDetails.type)}`,
          content: exportDetails.type === 'json'
            ? `The data is fetched from the collection named "${exportDetails.collectionName}".`
            : `The data is fetched from an external API at the following URL: ${exportDetails.apiUrl}`
        };
      case 'response':
        return {
          title: 'Response',
          content: 'This is the final JSON data that is sent back to the client.'
        };
      default:
        return { title: 'Unknown', content: 'No information available.' };
    }
  };

  const initialNodes: Node[] = [
    {
      id: 'client',
      position: { x: 0, y: 100 },
      data: { label: 'Client' },
      type: 'input',
    },
    {
      id: 'streamby',
      position: { x: 250, y: 100 },
      data: { label: 'StreamBy Middleware' },
    },
    {
      id: 'datasource',
      position: { x: 500, y: 200 },
      data: { label: getNodeLabel(exportDetails.type) },
    },
    {
      id: 'response',
      position: { x: 750, y: 100 },
      data: { label: 'Response' },
      type: 'output',
    },
  ];

  const initialEdges: Edge[] = [
    { id: 'e1-2', source: 'client', target: 'streamby', animated: true },
    { id: 'e2-3', source: 'streamby', target: 'datasource', animated: true },
    { id: 'e3-2', source: 'datasource', target: 'streamby', animated: true },
    { id: 'e2-4', source: 'streamby', target: 'response', animated: true },
  ];

  const onNodeClick = (_: React.MouseEvent, node: Node) => {
    const { title, content } = getNodeInfo(node.id);
    setModalTitle(title);
    setModalContent(content);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
  };

  return (
    <div className={s.container}>
      <ReactFlow
        nodes={initialNodes}
        edges={initialEdges}
        onNodeClick={onNodeClick}
        fitView
      >
        <Background />
        <Controls />
      </ReactFlow>

      {modalOpen && (
        <InfoModal title={modalTitle} onClose={closeModal}>
          {modalContent}
        </InfoModal>
      )}
    </div>
  );
};