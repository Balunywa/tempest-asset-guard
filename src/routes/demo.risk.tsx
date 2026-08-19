import { createFileRoute } from "@tanstack/react-router";

import { RiskPage } from "@/views/risk";

export const Route = createFileRoute("/demo/risk")({
  head: () => ({
    meta: [
      { title: "Asset Risk (Demo) | Gulf Asset Weather Risk" },
      { name: "description", content: "Ranked infrastructure exposure with transparent risk scoring, impact ETA and primary threat by asset. Interactive demo on synthetic Gulf data." },
      { property: "og:title", content: "Asset Risk (Demo) | Gulf Asset Weather Risk" },
      { property: "og:description", content: "Ranked infrastructure exposure with transparent risk scoring, impact ETA and primary threat by asset. Interactive demo on synthetic Gulf data." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: RiskPage,
});
