import { createFileRoute } from "@tanstack/react-router";

import { PosturePage } from "@/views/posture";

export const Route = createFileRoute("/_authenticated/app/posture")({
  head: () => ({
    meta: [
      { title: "Response Posture | Gulf Asset Weather Risk" },
      { name: "description", content: "T-gate board tracking watch, logistics, down-manning, shut-in and evacuation status by asset." },
      { property: "og:title", content: "Response Posture | Gulf Asset Weather Risk" },
      { property: "og:description", content: "T-gate board tracking watch, logistics, down-manning, shut-in and evacuation status by asset." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: PosturePage,
});
