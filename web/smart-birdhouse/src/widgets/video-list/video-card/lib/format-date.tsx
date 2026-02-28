export const formatDate = (ts: number): string => {
  return new Date(ts * 1000).toLocaleString(undefined, {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};
