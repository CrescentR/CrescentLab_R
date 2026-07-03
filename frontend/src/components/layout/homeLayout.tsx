import { HomeClient } from "@/components/home/homeClient";
import { getHomeContent } from "@/lib/homeContent";

export function HomeLayout() {
  const content = getHomeContent();

  return <HomeClient content={content} />;
}
