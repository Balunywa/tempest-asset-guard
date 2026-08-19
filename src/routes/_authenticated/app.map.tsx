import { createFileRoute } from "@tanstack/react-router";

import { MapPage } from "@/views/map";

export const Route = createFileRoute("/_authenticated/app/map")({
  head: () => ({
    meta: [
      { title: "Live Map | Gulf Asset Weather Risk" },
      { name: "description", content: "Interactive Gulf operations map with hurricane track, forecast cone, wind field and asset exposure layers." },
      { property: "og:title", content: "Live Map | Gulf Asset Weather Risk" },
      { property: "og:description", content: "Interactive Gulf operations map with hurricane track, forecast cone, wind field and asset exposure layers." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: MapPage,
});
