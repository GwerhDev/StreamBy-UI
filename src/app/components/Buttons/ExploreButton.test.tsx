import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { ExploreButton } from './ExploreButton';

const renderWithRouter = (initialPath = '/') =>
  render(
    <MemoryRouter initialEntries={[initialPath]}>
      <ExploreButton onClick={vi.fn()} />
    </MemoryRouter>
  );

describe('ExploreButton', () => {
  it('renders button with title', () => {
    renderWithRouter();
    expect(screen.getByRole('button', { name: /explore projects/i })).toBeInTheDocument();
  });

  it('calls onClick when clicked', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(
      <MemoryRouter>
        <ExploreButton onClick={onClick} />
      </MemoryRouter>
    );
    await user.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('applies active class when on /project/explore', () => {
    renderWithRouter('/project/explore');
    expect(screen.getByRole('button').className).toContain('active');
  });

  it('does not apply active class on other routes', () => {
    renderWithRouter('/');
    expect(screen.getByRole('button').className).not.toContain('active');
  });
});
