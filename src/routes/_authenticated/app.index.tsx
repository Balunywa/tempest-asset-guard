import { createFileRoute } from "@tanstack/react-router";

import { OverviewPage } from "@/views/index";

export const Route = createFileRoute("/_authenticated/app/")({
  head: () => ({
    meta: [
      { title: "Operations Overview | Gulf Asset Weather Risk" },
      { name: "description", content: "Executive view of Gulf of Mexico hurricane exposure across offshore platforms, pipelines, refineries and LNG terminals." },
      { property: "og:title", content: "Operations Overview | Gulf Asset Weather Risk" },
      { property: "og:description", content: "Executive view of Gulf of Mexico hurricane exposure across offshore platforms, pipelines, refineries and LNG terminals." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: OverviewPage,
});
