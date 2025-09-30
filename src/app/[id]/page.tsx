import { CountdownClient } from './CountdownClient';

export async function generateStaticParams() {
  // Generate static params for common countdown IDs
  return [
    { id: 'placeholder' },
    { id: 'example' },
    { id: 'demo' },
    { id: 'test' },
    { id: 'sample' },
    { id: 'default' },
    { id: 'new' },
    { id: 'temp' }
  ];
}

export default function CountdownPage() {
  return <CountdownClient />;
}
