import {
  json,
  Links,
  LiveReload,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "remix";
import type { LinksFunction, MetaFunction, LoaderFunction } from "remix";

import appStyles from "./styles/app.css";
import { getUser } from "./session.server";

export const links: LinksFunction = () => {
  return [{ rel: "stylesheet", href: appStyles }];
};

export const meta: MetaFunction = () => {
  return {
    title: "Remix Notes",
    viewport: "width=device-width,initial-scale=1",
  };
};

type LoaderData = {
  user: Awaited<ReturnType<typeof getUser>>;
};

export let loader: LoaderFunction = async ({ request }) => {
  return json<LoaderData>({
    user: await getUser(request),
  });
};

export default function App() {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <Meta />
        <Links />
      </head>
      <body>
        <div>
          <Outlet />
        </div>
        <ScrollRestoration />
        <Scripts />
        <LiveReload />
      </body>
    </html>
  );
}
