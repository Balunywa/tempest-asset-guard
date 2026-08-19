import { createFileRoute } from "@tanstack/react-router";

import { OverviewPage } from "@/views/index";

export const Route = createFileRoute("/demo/")({
  head: () => ({
    meta: [
      { title: "Operations Overview (Demo) | Gulf Asset Weather Risk" },
      { name: "description", content: "Executive view of Gulf of Mexico hurricane exposure across offshore platforms, pipelines, refineries and LNG terminals. Interactive demo on synthetic Gulf data." },
      { property: "og:title", content: "Operations Overview (Demo) | Gulf Asset Weather Risk" },
      { property: "og:description", content: "Executive view of Gulf of Mexico hurricane exposure across offshore platforms, pipelines, refineries and LNG terminals. Interactive demo on synthetic Gulf data." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: OverviewPage,
});
