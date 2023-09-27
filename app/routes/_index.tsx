import type { MetaFunction } from '@remix-run/node';
import { Text } from '@paystackhq/pax';

export const meta: MetaFunction = () => [{ title: 'Remix App' }];

export default function Index() {
  return <Text variant="heading1">Welcome to Remix!</Text>;
}
