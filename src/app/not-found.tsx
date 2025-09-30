'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function NotFound() {
  const router = useRouter();

  useEffect(() => {
    // For GitHub Pages SPA routing - redirect 404s to the correct client-side route
    if (typeof window !== 'undefined') {
      const path = window.location.pathname.replace('/countdown', '');
      if (path && path !== '/404') {
        router.replace(path);
      }
    }
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">404</h1>
        <p className="text-gray-600 mb-8">Page not found</p>
        <Link
          href="/"
          className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 inline-block"
        >
          Go to Home
        </Link>
      </div>
    </div>
  );
}
