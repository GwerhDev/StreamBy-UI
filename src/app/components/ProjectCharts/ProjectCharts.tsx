import { useSelector } from 'react-redux';
import { ResponsivePie } from '@nivo/pie';
import { RootState } from '../../../store';
import s from './ProjectCharts.module.css';
import skeleton from '../Loader/Skeleton.module.css';
import { Spinner } from '../Spinner';

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
    innerRadius: 0.5,
    padAngle: 0.5,
    cornerRadius: 1,
    activeOuterRadiusOffset: 1,
    borderWidth: 1,
    arcLinkLabelsSkipAngle: 10,
    arcLinkLabelsTextColor: '#adadad',
    arcLinkLabelsThickness: 2,
    arcLinkLabelsColor: '#adadad',
    arcLabelsSkipAngle: 10,
    arcLabelsTextColor: '#adadad',
    margin: { top: 40, right: 80, bottom: 80, left: 80 },
    legends: [
      {
        anchor: 'left' as const,
        direction: 'row' as const,
        justify: false,
        translateX: -75,
        translateY: 56,
        itemsSpacing: 0,
        itemWidth: 100,
        itemHeight: 18,
        itemTextColor: '#cccccc',
        itemDirection: 'left-to-right' as const,
        itemOpacity: 1,
        symbolSize: 18,
        symbolShape: 'circle' as const,
        effects: [
          {
            on: 'hover' as const,
            style: {
              itemTextColor: '#007bff'
            }
          }
        ]
      }
    ]
  };

  return (
    <div className={s.chartsContainer}>
      <div className={s.chartCard}>
        <h4 className={loading ? skeleton.skeleton : ''}>{loading ? <Spinner bg={false} isLoading /> : 'Member Roles'}</h4>
        {loading ? (
          <div className={`${s.chartPlaceholder} ${skeleton.skeleton}`}></div>
        ) : memberRolesData.length > 0 ? (
          <div className={s.graphContainer}>
            <ResponsivePie
              data={memberRolesData}
              {...commonProps}
              colors={{ scheme: 'category10' }}
            />
          </div>
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
