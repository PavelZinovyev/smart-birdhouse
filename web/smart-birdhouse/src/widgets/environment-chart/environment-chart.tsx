import { MetricWidget, MetricWidetTitle } from '@/shared/ui';
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
    <section className={styles.root} aria-labelledby="environment-heading">
      <MetricWidetTitle label="Окружающая среда" />
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
    </section>
  );
};
