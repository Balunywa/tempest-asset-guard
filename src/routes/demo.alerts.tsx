import { createFileRoute } from "@tanstack/react-router";

import { AlertsPage } from "@/views/alerts";

export const Route = createFileRoute("/demo/alerts")({
  head: () => ({
    meta: [
      { title: "Alerts (Demo) | Gulf Asset Weather Risk" },
      { name: "description", content: "Prioritised operational alerts from hazard exposure and threshold breaches. Interactive demo on synthetic Gulf data." },
      { property: "og:title", content: "Alerts (Demo) | Gulf Asset Weather Risk" },
      { property: "og:description", content: "Prioritised operational alerts from hazard exposure and threshold breaches. Interactive demo on synthetic Gulf data." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AlertsPage,
});
