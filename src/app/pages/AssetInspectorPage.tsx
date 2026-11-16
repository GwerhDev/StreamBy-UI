import { AssetInspector } from '../components/Inspector/AssetInspector';
import type { MeasuredKind } from '../../services/assetMeasurements';

export const AssetInspectorPage = ({ kind = 'model' }: { kind?: MeasuredKind }) => <AssetInspector key={kind} kind={kind} />;
