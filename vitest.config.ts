import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["**/*.test.{ts,tsx}", "**/*.spec.{ts,tsx}"],
    exclude: ["node_modules", ".expo"],
    alias: {
      "react-native": new URL("./__mocks__/react-native.ts", import.meta.url).pathname,
    },
  },
});
