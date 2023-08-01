import type { V2_MetaFunction } from "@remix-run/node";

export const meta: V2_MetaFunction = () => [{ title: "Remix App" }];

export default function Index() {
  return <div>Welcome to Remix!</div> 
}
