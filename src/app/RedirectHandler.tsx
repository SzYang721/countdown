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
      
      // With basePath '/countdown', URLs are structured as:
      // Browser: /countdown/abc123 → App route: /abc123
      // Remove the basePath prefix to get the app route
      let path = redirect;
      
      if (path.startsWith('/countdown/')) {
        path = path.substring('/countdown'.length); // Remove basePath prefix
      } else if (path.startsWith('/countdown')) {
        path = path.substring('/countdown'.length); // Handle edge case without trailing slash
      }
      
      // Ensure path starts with /
      if (path && !path.startsWith('/')) {
        path = '/' + path;
      }
      
      console.log('Routing to:', path);
      
      if (path && path !== '/') {
        router.replace(path);
      }
    }
  }, [router]);

  return null;
}
