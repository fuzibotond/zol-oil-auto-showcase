import { createFileRoute } from "@tanstack/react-router";
import { landingLoader, landingHead, LandingComponent } from "@/lib/landing-route";

export const Route = createFileRoute("/masini/combustibil/$combustibil")({
  loader: ({ params }) => landingLoader("combustibil", params.combustibil),
  head: ({ params, loaderData }) => landingHead(loaderData, "combustibil", params.combustibil),
  component: RouteComponent,
});

function RouteComponent() {
  return <LandingComponent data={Route.useLoaderData()} />;
}
