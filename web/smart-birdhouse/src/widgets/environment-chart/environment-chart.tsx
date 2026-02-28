import { MetricWidget, MetricWidgetTitle } from '@/shared/ui';
import styles from './environment-chart.module.scss';

interface EnvironmentChartProps {
  temperature?: number;
  humidity?: number;
  loading?: boolean;
}

export const EnvironmentChart = ({
  temperature = 0,
  humidity = 0,
  loading = false,
}: EnvironmentChartProps) => {
  return (
    <article aria-label="environment-heading">
      <MetricWidgetTitle label="Окружающая среда" />
      <div className={styles.widgets}>
        <MetricWidget
          label="Температура"
          value={loading ? '—' : temperature}
          loading={loading}
          unit="°C"
          variant="temperature"
        />
        <MetricWidget
          label="Влажность"
          value={loading ? '—' : humidity}
          loading={loading}
          unit="%"
          variant="humidity"
        />
      </div>
    </article>
  );
};
