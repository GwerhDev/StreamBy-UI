import { faRobot } from '@fortawesome/free-solid-svg-icons';
import { faJira, faGoogle } from '@fortawesome/free-brands-svg-icons';
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import { ServiceProviderType } from '../../../interfaces';

// No Anthropic/Claude brand icon exists in FontAwesome — faRobot (generic solid) is the
// pragmatic stand-in rather than a fabricated custom SVG logo.
export const SERVICE_PROVIDER_ICON: Record<ServiceProviderType, IconDefinition> = {
  claude: faRobot,
  jira: faJira,
  google: faGoogle,
};
