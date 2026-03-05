import { VideoList } from '@/widgets';

export const VideosPage = () => {
  return (
    <div className="layout-container stack">
      <VideoList layout="grid" gridVariant="large" />
    </div>
  );
};
