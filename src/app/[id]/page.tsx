import { CountdownClient } from './CountdownClient';

export async function generateStaticParams() {
  // For static export, we need to generate all possible routes
  // Since we can't predict UUIDs, we'll generate a few placeholder routes
  // and handle the rest dynamically on the client side
  return [
    { id: 'placeholder' },
    { id: 'example' },
    { id: 'demo' }
  ];
}

export default function CountdownPage() {
  return <CountdownClient />;
}
