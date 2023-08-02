import type { V2_MetaFunction } from "@remix-run/node";
import { Text } from "@paystackhq/pax"

export const meta: V2_MetaFunction = () => [{ title: "Remix App" }];

export default function Index() {
  return <Text variant="heading1">Welcome to Remix!</Text> 
}
