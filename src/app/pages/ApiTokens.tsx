import { faScrewdriverWrench } from '@fortawesome/free-solid-svg-icons';
import { EmptyBackground } from '../components/Backgrounds/EmptyBackground';

export const ApiTokens = () => {
  return (
    <EmptyBackground
      icon={faScrewdriverWrench}
      title="Under construction"
      subtitle="API Tokens allow third-party services to connect to this project's StreamBy API. Coming soon."
    />
  );
};
