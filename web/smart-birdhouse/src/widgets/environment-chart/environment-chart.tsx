import { MetricWidget } from '@/shared/ui/metric-widget';
import styles from './environment-chart.module.scss';

export const EnvironmentChart = () => {
  const temperature = 22.5;
  const humidity = 68;

  return (
    <section className={styles.root} aria-labelledby="environment-heading">
      <h2 id="environment-heading" className={styles.title}>
        Окружающая среда
      </h2>
      <div className={styles.grid}>
        <MetricWidget label="Температура" value={temperature} unit="°C" variant="temperature" />
        <MetricWidget label="Влажность" value={humidity} unit="%" variant="humidity" />
      </div>
    </section>
  );
};
