import { CountdownClient } from './CountdownClient';

export async function generateStaticParams() {
  // For static export, we need to generate all possible routes
  // Since we can't predict UUIDs, we'll generate a comprehensive set of placeholder routes
  // The catch-all route [...slug] will handle actual UUIDs
  const staticParams = [
    { id: 'placeholder' },
    { id: 'example' },
    { id: 'demo' },
    { id: 'test' },
    { id: 'sample' },
    { id: 'default' },
    { id: 'new' },
    { id: 'temp' }
  ];
  
  return staticParams;
}

export default function CountdownPage() {
  return <CountdownClient />;
}
