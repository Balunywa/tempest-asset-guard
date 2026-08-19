import { createFileRoute } from "@tanstack/react-router";

import { MapPage } from "@/views/map";

export const Route = createFileRoute("/demo/map")({
  head: () => ({
    meta: [
      { title: "Live Map (Demo) | Gulf Asset Weather Risk" },
      { name: "description", content: "Interactive Gulf operations map with hurricane track, forecast cone, wind field and asset exposure layers. Interactive demo on synthetic Gulf data." },
      { property: "og:title", content: "Live Map (Demo) | Gulf Asset Weather Risk" },
      { property: "og:description", content: "Interactive Gulf operations map with hurricane track, forecast cone, wind field and asset exposure layers. Interactive demo on synthetic Gulf data." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: MapPage,
});
