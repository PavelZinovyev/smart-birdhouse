import { useSensors } from '@/shared/api';
import { EnvironmentChart } from '@/widgets/environment-chart/environment-chart';
import { BatteryChart, PiPowerToggle, VideoList } from '@/widgets';
import { usePiStatus } from '@/shared/api';

const POLL_INTERVAL_MS = 5000;
const PI_STATUS_REFETCH_MS = 3000;

export const MainPage = () => {
  const { data, loading, error } = useSensors(POLL_INTERVAL_MS);
  const piStatus = usePiStatus(PI_STATUS_REFETCH_MS);

  const isPiPowerOn = piStatus.data?.pi_power ?? false;

  const showVideoList = isPiPowerOn && !piStatus.isLoading && !piStatus.isError;

  return (
    <div className="layout-container stack">
      {error && <p role="alert">Ошибка: {error}</p>}
      <PiPowerToggle {...piStatus} />
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
      {showVideoList && <VideoList />}
    </div>
  );
};
