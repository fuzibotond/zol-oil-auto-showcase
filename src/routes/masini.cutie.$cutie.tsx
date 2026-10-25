import { createFileRoute } from "@tanstack/react-router";
import { landingLoader, landingHead, LandingComponent } from "@/lib/landing-route";

export const Route = createFileRoute("/masini/cutie/$cutie")({
  loader: ({ params }) => landingLoader("cutie", params.cutie),
  head: ({ params, loaderData }) => landingHead(loaderData, "cutie", params.cutie),
  component: RouteComponent,
});

function RouteComponent() {
  return <LandingComponent data={Route.useLoaderData()} />;
}
