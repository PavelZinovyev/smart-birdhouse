import { useSensors, usePiStatusContext } from '@/shared/api';
import { EnvironmentSection } from '@/widgets/environment-seciton/environment-section';
import { VideoList, StreamViewerSection } from '@/widgets';
import { PiSection } from '@/widgets/pi-section';
import { PageLayout } from '../../layout';

const POLL_INTERVAL_MS = 5000;

export const MainPage = () => {
  const { data, loading } = useSensors(POLL_INTERVAL_MS);
  const piStatus = usePiStatusContext();

  const isPiPowerOn = piStatus.data?.pi_power ?? false;

  const showVideoList = isPiPowerOn && !piStatus.isLoading;

  return (
    <PageLayout>
      <PiSection />
      <EnvironmentSection
        temperature={data?.temperature ?? 0}
        humidity={data?.humidity ?? 0}
        loading={loading}
      />
      {showVideoList && (
        <>
          <StreamViewerSection />
          <VideoList />
        </>
      )}
    </PageLayout>
  );
};
