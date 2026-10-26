import { useLocation } from 'react-router-dom';

// Where the router is now, for a test to read.
export const Where = () => <p data-testid="location">{useLocation().pathname}</p>;
