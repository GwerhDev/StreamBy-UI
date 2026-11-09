import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { JobProfileFields } from './JobProfileFields';

describe("a job's options", () => {
  it("are the worker's own, as JSON: an object, or it says so", () => {
    const onChange = vi.fn();
    render(<JobProfileFields idPrefix="p" profile={{}} onChange={onChange} />);
    const box = screen.getByLabelText('Options (JSON, optional)');
    fireEvent.change(box, { target: { value: '{ "textureFormat": "ktx2" }' } });
    expect(onChange).toHaveBeenLastCalledWith({ textureFormat: 'ktx2' });
    fireEvent.change(box, { target: { value: '[1]' } });
    expect(screen.getByText('Options must be a JSON object')).toBeInTheDocument();
    fireEvent.change(box, { target: { value: '' } });
    expect(onChange).toHaveBeenLastCalledWith({});
  });

  it('show the options it was given', () => {
    render(<JobProfileFields idPrefix="p" profile={{ ratio: 0.5 }} onChange={() => {}} />);
    expect(screen.getByLabelText('Options (JSON, optional)')).toHaveValue('{\n  "ratio": 0.5\n}');
  });
});
