/// <reference types="vitest" />
/// <reference types="vite/client" />

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import { configDefaults } from "vitest/config";

const defaultInclude = configDefaults.include ?? [];

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  test: {
    include: [
      ...defaultInclude,
      // Provide a test "auto-discovery" convention for tests of files
      // that follow the Remix `*.server.ts` filename convention
      "**/__tests__/**/*.{js,mjs,cjs,ts,mts,cts,jsx,tsx}",
    ],
    globals: true,
    environment: "happy-dom",
    setupFiles: ["./test/setup-test-env.ts"],
  },
});
