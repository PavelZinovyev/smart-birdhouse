import { MetricWidget, MetricWidgetTitle } from '@/shared/ui';
import { SectionContent } from '@/shared/ui/section-content/section-content';
import { Container } from '@/shared/ui/container/container';

interface EnvironmentSectionProps {
  temperature?: number;
  humidity?: number;
  loading?: boolean;
}

const SECTION_LABEL = 'Окружающая среда';

export const EnvironmentSection = ({
  temperature = 0,
  humidity = 0,
  loading = false,
}: EnvironmentSectionProps) => {
  return (
    <Container aria-label={SECTION_LABEL}>
      <MetricWidgetTitle label={SECTION_LABEL} />
      <SectionContent aria-label={SECTION_LABEL}>
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
      </SectionContent>
    </Container>
  );
};
