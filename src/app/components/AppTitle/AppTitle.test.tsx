import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { AppTitle } from './AppTitle';

describe('AppTitle', () => {
  it('is StreamBy outside a project', () => {
    render(<AppTitle onClick={() => {}} />);
    expect(screen.getByTestId('app-title')).toHaveTextContent(/^STREAMBY$/);
    expect(screen.queryByTestId('app-title-project')).not.toBeInTheDocument();
    expect(screen.getByTestId('app-title-brand-icon')).toBeInTheDocument();
  });

  it("is the project's name in one, with StreamBy for its hover", () => {
    render(<AppTitle projectName="World of Gwerh" projectImage="https://img.test/wog.png" onClick={() => {}} />);
    expect(screen.getByTestId('app-title-project')).toHaveTextContent('WORLD OF GWERH');
    expect(screen.getByTestId('app-title-project').querySelector('img')).toHaveAttribute('src', 'https://img.test/wog.png');
    expect(screen.getByTestId('app-title-brand')).toHaveTextContent('STREAMBY');
  });

  it('goes home when clicked, in a project or not', () => {
    const onClick = vi.fn();
    const { rerender } = render(<AppTitle projectName="World of Gwerh" onClick={onClick} />);
    fireEvent.click(screen.getByTestId('app-title'));
    rerender(<AppTitle onClick={onClick} />);
    fireEvent.click(screen.getByTestId('app-title'));
    expect(onClick).toHaveBeenCalledTimes(2);
  });
});
