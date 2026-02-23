import { useSensors } from '@/shared/api';
import { EnvironmentChart } from '@/widgets/environment-chart/environment-chart';
import { BatteryChart } from '@/widgets';

const POLL_INTERVAL_MS = 5000;

export const MainPage = () => {
  const { data, loading, error } = useSensors(POLL_INTERVAL_MS);

  return (
    <div className="layout-container stack">
      {error && <p role="alert">Ошибка: {error}</p>}
      <EnvironmentChart
        temperature={data?.temperature ?? 0}
        humidity={data?.humidity ?? 0}
        loading={loading}
      />
      <BatteryChart
        value={data?.battery ?? 0}
        loading={loading}
        batteryAvailable={data?.battery_available ?? true}
      />
    </div>
  );
};
