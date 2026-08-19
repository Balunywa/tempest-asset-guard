import { createFileRoute } from "@tanstack/react-router";

import { ThresholdsPage } from "@/views/thresholds";

export const Route = createFileRoute("/demo/thresholds")({
  head: () => ({
    meta: [
      { title: "Thresholds (Demo) | Gulf Asset Weather Risk" },
      { name: "description", content: "Configurable operational limits per asset class that drive automated alerting. Interactive demo on synthetic Gulf data." },
      { property: "og:title", content: "Thresholds (Demo) | Gulf Asset Weather Risk" },
      { property: "og:description", content: "Configurable operational limits per asset class that drive automated alerting. Interactive demo on synthetic Gulf data." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ThresholdsPage,
});
