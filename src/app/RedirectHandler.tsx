'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export function RedirectHandler() {
  const router = useRouter();

  useEffect(() => {
    // Check if there's a redirect path from GitHub Pages 404
    const redirect = sessionStorage.getItem('redirect');
    if (redirect) {
      sessionStorage.removeItem('redirect');
      // Remove the basePath from the redirect path
      const path = redirect.replace('/countdown', '');
      if (path && path !== '/') {
        router.replace(path);
      }
    }
  }, [router]);

  return null;
}
