export const getBatteryWidth = (percent: number): number => {
  return Math.min(100, Math.max(0, percent));
};
