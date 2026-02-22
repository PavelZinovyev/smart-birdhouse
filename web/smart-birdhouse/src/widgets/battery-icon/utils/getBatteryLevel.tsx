export const getBatteryLevel = (percent: number): 'high' | 'medium' | 'low' => {
  if (percent > 50) return 'high';
  if (percent > 20) return 'medium';
  return 'low';
};
