import { LabHero } from "@/components/home/labHero";
import { loadJournal } from "@/lib/journal";
import { requestTimestamp } from "@/lib/server-time";
export default async function HomePage() {
  const [data, timestamp] = await Promise.all([loadJournal(), requestTimestamp()]);
  return <LabHero data={data} timestamp={timestamp} />;
}
