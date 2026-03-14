import { useState, useCallback } from 'react';

/**
 * Скачивание файла по URL через fetch + blob + программный клик по <a download>.
 * Работает для cross-origin (в отличие от атрибута download у ссылки).
 */
export function useDownloadFile() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const download = useCallback(async (url: string, fileName: string) => {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Ошибка ${res.status}`);
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = fileName;
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { download, loading, error };
}
