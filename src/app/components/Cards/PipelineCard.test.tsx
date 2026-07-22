import { render, screen } from '@testing-library/react';
import { PipelineCard } from './PipelineCard';
import { PipelineRef } from '../../../interfaces';

const basePipeline: PipelineRef = { id: 'p1', name: 'Ingest Master', order: 0 };

describe('PipelineCard', () => {
  it('renders the pipeline name', () => {
    render(<PipelineCard pipeline={basePipeline} />);
    expect(screen.getByText('Ingest Master')).toBeInTheDocument();
  });

  it('renders the sub-workflow subtitle', () => {
    render(<PipelineCard pipeline={basePipeline} />);
    expect(screen.getByText('Sub-workflow')).toBeInTheDocument();
  });

  it('renders the pipeline icon', () => {
    render(<PipelineCard pipeline={basePipeline} />);
    expect(screen.getByTitle('Pipeline')).toBeInTheDocument();
  });
});
