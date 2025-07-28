import { useSelector } from 'react-redux';
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { RootState } from '../../../store';
import s from './ProjectCharts.module.css';
import skeleton from '../Loader/Skeleton.module.css';

ChartJS.register(ArcElement, Tooltip, Legend);

export const ProjectCharts = () => {
  const { data: currentProject, loading } = useSelector((state: RootState) => state.currentProject);

  const memberRolesData = currentProject?.members?.reduce((acc: { [key: string]: number }, member) => {
    acc[member.role] = (acc[member.role] || 0) + 1;
    return acc;
  }, {});

  const labels = Object.keys(memberRolesData || {});
  const dataValues = Object.values(memberRolesData || {});

  const data = {
    labels: labels,
    datasets: [
      {
        label: '# of Members',
        data: dataValues,
        backgroundColor: [
          'rgba(255, 99, 132, 0.6)',
          'rgba(54, 162, 235, 0.6)',
          'rgba(255, 206, 86, 0.6)',
          'rgba(75, 192, 192, 0.6)',
          'rgba(153, 102, 255, 0.6)',
          'rgba(255, 159, 64, 0.6)',
        ],
        borderColor: [
          'rgba(255, 99, 132, 1)',
          'rgba(54, 162, 235, 1)',
          'rgba(255, 206, 86, 1)',
          'rgba(75, 192, 192, 1)',
          'rgba(153, 102, 255, 1)',
          'rgba(255, 159, 64, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          color: '#cccccc', // Adjust legend text color
        },
      },
      tooltip: {
        callbacks: {
          label: function (context: any) {
            let label = context.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed !== null) {
              label += context.parsed;
            }
            return label;
          },
        },
      },
    },
  };

  return (
    <div className={s.chartsContainer}>
      <div className={s.chartCard}>
        <h4 className={loading ? skeleton.skeleton : ''}>{loading ? '' : 'Member Roles'}</h4>
        {loading ? (
          <div className={`${s.chartPlaceholder} ${skeleton.skeleton}`}></div>
        ) : labels.length > 0 ? (
          <div className={s.chartWrapper}>
            <Pie data={data} options={options} />
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
