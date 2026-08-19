import { createFileRoute } from "@tanstack/react-router";

import { EventsPage } from "@/views/events";

export const Route = createFileRoute("/demo/events")({
  head: () => ({
    meta: [
      { title: "Weather Events (Demo) | Gulf Asset Weather Risk" },
      { name: "description", content: "Active and monitored tropical systems with intensity, motion and forecast confidence. Interactive demo on synthetic Gulf data." },
      { property: "og:title", content: "Weather Events (Demo) | Gulf Asset Weather Risk" },
      { property: "og:description", content: "Active and monitored tropical systems with intensity, motion and forecast confidence. Interactive demo on synthetic Gulf data." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: EventsPage,
});
