import { useSensors } from '@/shared/api';
import { EnvironmentChart } from '@/widgets/environment-chart/environment-chart';
import { BatteryChart, PiPowerToggle, VideoList } from '@/widgets';
import { usePiStatusContext } from '@/shared/api';
import { StreamViewer } from '@/widgets';

const POLL_INTERVAL_MS = 5000;

export const MainPage = () => {
  const { data, loading, error } = useSensors(POLL_INTERVAL_MS);
  const piStatus = usePiStatusContext();

  const isPiPowerOn = piStatus.data?.pi_power ?? false;

  const showVideoList = isPiPowerOn && !piStatus.isLoading;

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
        value={data?.battery_percent ?? 0}
        voltage={data?.battery_voltage ?? data?.battery}
        loading={loading}
        batteryAvailable={data?.battery_available ?? true}
        isCharging={data?.battery_charging}
        isChargeDone={data?.battery_charge_done}
        isExternalPowerPresent={data?.battery_power_present}
      />
      {showVideoList && (
        <>
          <StreamViewer />
          <VideoList />
        </>
      )}
    </div>
  );
};
