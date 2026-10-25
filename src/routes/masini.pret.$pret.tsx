import { createFileRoute } from "@tanstack/react-router";
import { landingLoader, landingHead, LandingComponent } from "@/lib/landing-route";

export const Route = createFileRoute("/masini/pret/$pret")({
  loader: ({ params }) => landingLoader("pret", params.pret),
  head: ({ params, loaderData }) => landingHead(loaderData, "pret", params.pret),
  component: RouteComponent,
});

function RouteComponent() {
  return <LandingComponent data={Route.useLoaderData()} />;
}
