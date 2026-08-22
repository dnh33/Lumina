import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    css: false,
    // Only scan this workspace's src/ — never pick up test files from
    // neighbouring git worktrees (e.g. .worktrees/*), which run their own
    // configs and would double-count or run under the wrong environment.
    include: ["src/**/*.{test,spec}.*"],
    exclude: ["**/node_modules/**", ".worktrees/**"],
  },
});
