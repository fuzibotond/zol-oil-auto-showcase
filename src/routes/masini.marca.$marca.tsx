import { createFileRoute } from "@tanstack/react-router";
import { landingLoader, landingHead, LandingComponent } from "@/lib/landing-route";

export const Route = createFileRoute("/masini/marca/$marca")({
  loader: ({ params }) => landingLoader("marca", params.marca),
  head: ({ params, loaderData }) => landingHead(loaderData, "marca", params.marca),
  component: RouteComponent,
});

function RouteComponent() {
  return <LandingComponent data={Route.useLoaderData()} />;
}
