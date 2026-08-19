import { createFileRoute } from "@tanstack/react-router";

import { PosturePage } from "@/views/posture";

export const Route = createFileRoute("/demo/posture")({
  head: () => ({
    meta: [
      { title: "Response Posture (Demo) | Gulf Asset Weather Risk" },
      { name: "description", content: "T-gate board tracking watch, logistics, down-manning, shut-in and evacuation status by asset. Interactive demo on synthetic Gulf data." },
      { property: "og:title", content: "Response Posture (Demo) | Gulf Asset Weather Risk" },
      { property: "og:description", content: "T-gate board tracking watch, logistics, down-manning, shut-in and evacuation status by asset. Interactive demo on synthetic Gulf data." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PosturePage,
});
