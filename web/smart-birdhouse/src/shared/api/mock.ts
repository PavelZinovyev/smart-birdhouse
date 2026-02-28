/**
 * Централизованные моки для UI-виджетов.
 *
 * Включение через URL-параметры:
 * - ?videos=mock   — мок-данные видео | loading | error | empty
 * - ?pi=mock       — мок-статус Pi (pi_power=true) | loading | error
 * - ?sensors=mock  — мок-данные сенсоров | loading | error
 *
 * Пример: ?videos=mock&pi=mock&sensors=mock
 */

export type MockResource = 'videos' | 'pi' | 'sensors';

export function getMockValue(key: MockResource): string | null {
  if (typeof window === 'undefined') return null;
  return new URLSearchParams(window.location.search).get(key);
}

export function isMockEnabled(key: MockResource): boolean {
  const v = getMockValue(key);
  return v === 'mock' || v === 'loading' || v === 'error' || v === 'empty';
}

/** Возвращает promise, который никогда не резолвится (для имитации loading) */
export function createNeverResolvingPromise<T>(): Promise<T> {
  return new Promise(() => {});
}
