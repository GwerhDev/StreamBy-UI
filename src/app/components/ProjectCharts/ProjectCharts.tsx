import { useSelector } from 'react-redux';
import { ResponsivePie } from '@nivo/pie';
import { RootState } from '../../../store';
import s from './ProjectCharts.module.css';
import skeleton from '../Loader/Skeleton.module.css';

export const ProjectCharts = () => {
  const { data: currentProject, loading } = useSelector((state: RootState) => state.currentProject);

  const memberRolesData = Object.entries(
    currentProject?.members?.reduce((acc: { [key: string]: number }, member) => {
      acc[member.role] = (acc[member.role] || 0) + 1;
      return acc;
    }, {})
    || {}
  ).map(([id, value]) => ({ id, value }));

  const commonProps = {
    margin: { top: 40, right: 80, bottom: 80, left: 80 },
    innerRadius: 0.5,
    padAngle: 0.7,
    cornerRadius: 3,
    activeOuterRadiusOffset: 8,
    borderWidth: 1,
    borderColor: '#333333', // Replaced with a direct hex code
    arcLinkLabelsSkipAngle: 10,
    arcLinkLabelsTextColor: '#ffffff', // Direct color value
    arcLinkLabelsThickness: 2,
    arcLinkLabelsColor: { from: 'color' },
    arcLabelsSkipAngle: 10,
    arcLabelsTextColor: '#ffffff', // Direct color value
    // Removed fill property as it was causing syntax errors and not directly applicable
    // Removed legends property to resolve type errors
  };

  return (
    <div className={s.chartsContainer}>
      <div className={s.chartCard}>
        <h4 className={loading ? skeleton.skeleton : ''}>{loading ? '' : 'Member Roles'}</h4>
        {loading ? (
          <div className={`${s.chartPlaceholder} ${skeleton.skeleton}`}></div>
        ) : memberRolesData.length > 0 ? (
          <span>
            <ResponsivePie
              data={memberRolesData}
              {...commonProps}
              colors={{ scheme: 'category10' }}
            />
          </span>
        ) : (
          <p>No member role data available.</p>
        )}
      </div>

      <div className={s.chartCard}>
        <h4 className={loading ? skeleton.skeleton : ''}>{loading ? '' : 'Exports Overview'}</h4>
        {loading ? (
          <div className={`${s.chartPlaceholder} ${skeleton.skeleton}`}></div>
        ) : (
          <p>Charts for exports will go here.</p>
        )}
      </div>
    </div>
  );
};