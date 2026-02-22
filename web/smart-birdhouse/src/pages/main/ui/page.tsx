import { EnvironmentChart } from '@/widgets/environment-chart/environment-chart';
import { BatteryChart } from '@/widgets';

export const MainPage = () => {
  return (
    <div>
      <EnvironmentChart />
      <BatteryChart value={50} />
    </div>
  );
};
