import { CountdownClient } from './CountdownClient';

// Required for static export
export async function generateStaticParams() {
  return [];
}

export default function CountdownPage() {
  return <CountdownClient />;
}
