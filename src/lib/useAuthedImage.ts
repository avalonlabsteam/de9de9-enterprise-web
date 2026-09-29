import { useEffect, useState } from 'react';
import { apiClient } from '@/api/apiClient';

/**
 * Files the API serves (a company logo, a KYC document…) need the bearer token,
 * so an `<img src>` cannot fetch them on its own. This pulls the bytes through
 * the api client and hands back an object URL, revoked when the url changes or
 * the component unmounts.
 *
 * Null while loading, and null when the file can't be read — callers fall back
 * to their placeholder (initials, an icon) rather than showing a broken image.
 */
export function useAuthedImage(url: string | null | undefined): string | null {
  const [objectUrl, setObjectUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!url) return;
    let cancelled = false;
    let created: string | null = null;

    apiClient
      .get(url, { responseType: 'blob' })
      .then((res) => {
        if (cancelled) return;
        created = URL.createObjectURL(res.data as Blob);
        setObjectUrl(created);
      })
      .catch(() => {
        /* keep the placeholder */
      });

    return () => {
      cancelled = true;
      if (created) URL.revokeObjectURL(created);
      setObjectUrl(null);
    };
  }, [url]);

  return url ? objectUrl : null;
}
