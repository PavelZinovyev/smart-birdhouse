import { MetricWidget, MetricWidetTitle } from '@/shared/ui';
import styles from './environment-chart.module.scss';

export const EnvironmentChart = () => {
  const temperature = 40;
  const humidity = 68;

  return (
    <section className={styles.root} aria-labelledby="environment-heading">
      <MetricWidetTitle label="Окружающая среда" />
      <div className={styles.grid}>
        <MetricWidget label="Температура" value={temperature} unit="°C" variant="temperature" />
        <MetricWidget label="Влажность" value={humidity} unit="%" variant="humidity" />
      </div>
    </section>
  );
};
