import { createFileRoute } from "@tanstack/react-router";

import { DeploymentPage } from "@/views/deployment";

export const Route = createFileRoute("/demo/deployment")({
  head: () => ({
    meta: [
      { title: "Deployment (Demo) | Gulf Asset Weather Risk" },
      { name: "description", content: "Azure reference architecture and adapter configuration for tenant deployment. Interactive demo on synthetic Gulf data." },
      { property: "og:title", content: "Deployment (Demo) | Gulf Asset Weather Risk" },
      { property: "og:description", content: "Azure reference architecture and adapter configuration for tenant deployment. Interactive demo on synthetic Gulf data." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: DeploymentPage,
});
