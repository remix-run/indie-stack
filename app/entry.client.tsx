import * as React from "react";
import { RemixBrowser } from "@remix-run/react";
import { hydrateRoot } from "react-dom/client";

requestIdleCallback(() => {
  React.startTransition(() => {
    hydrateRoot(
      document,
      <React.StrictMode>
        <RemixBrowser />
      </React.StrictMode>
    );
  });
});
