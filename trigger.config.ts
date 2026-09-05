import { defineConfig } from "@trigger.dev/sdk";

export default defineConfig({
  project: "proj_jtvymjovpmuwlowlmwsg",
  runtime: "node",
  logLevel: "log",
  // The max compute seconds a task is allowed to run. If the task run exceeds this duration, it will be stopped.
  // You can override this on an individual task.
  // See https://trigger.dev/docs/runs/max-duration
  maxDuration: 3600,
  retries: {
    enabledInDev: true,
    default: {
      maxAttempts: 3,
      minTimeoutInMs: 1000,
      maxTimeoutInMs: 10000,
      factor: 2,
      randomize: true,
    },
  },
  dirs: ["features"],
  build: {
    // Stagehand locates its bundled browser extension asset via import.meta.url
    // relative to its own package folder. If esbuild inlines it into the task
    // bundle, that path resolves inside .trigger's build output instead of
    // node_modules, so the extension zip can't be found and Browserbase session
    // creation fails with "Failed to upload the Stagehand extension". Keeping it
    // external makes Trigger.dev install it as a real dependency instead.
    external: ["@browserbasehq/stagehand"],
  },
});
