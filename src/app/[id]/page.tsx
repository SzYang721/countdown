import { CountdownClient } from './CountdownClient';

export async function generateStaticParams() {
  // Generate a placeholder to allow the route to be exported
  return [{ id: 'placeholder' }];
}

export default function CountdownPage() {
  return <CountdownClient />;
}
