import { faScrewdriverWrench } from '@fortawesome/free-solid-svg-icons';
import { EmptyBackground } from '../components/Backgrounds/EmptyBackground';

export const ApiTokens = () => {
  return (
    <EmptyBackground
      icon={faScrewdriverWrench}
      title="The day that never comes"
      subtitle="API Tokens will let third-party services connect to this project's StreamBy API. Under construction — coming soon."
    />
  );
};
