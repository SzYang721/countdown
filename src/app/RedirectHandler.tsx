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
      console.log('Redirect from 404:', redirect);
      
      // The redirect contains the full path like: /countdown/countdown/abc123
      // We need to remove only the first /countdown (basePath) and keep the rest
      // So /countdown/countdown/abc123 becomes /countdown/abc123
      let path = redirect;
      
      // Remove the basePath prefix only once
      if (path.startsWith('/countdown/')) {
        path = path.substring('/countdown'.length); // Remove first /countdown
      }
      
      console.log('Routing to:', path);
      
      if (path && path !== '/') {
        router.replace(path);
      }
    }
  }, [router]);

  return null;
}
