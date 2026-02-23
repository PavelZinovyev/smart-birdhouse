export const getTemperatureLevel = (temperature: number): 'hot' | 'warm' | 'cool' | 'cold' => {
  if (temperature > 30) return 'hot';
  if (temperature > 20) return 'warm';
  if (temperature > 15) return 'cool';
  return 'cold';
};
