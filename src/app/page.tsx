import EllieApp from '@/components/ellie-app';
export default function Home() {
  return <EllieApp aiAvailable={Boolean(process.env.OPENAI_API_KEY)} />;
}
